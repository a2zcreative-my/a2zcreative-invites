/**
 * Event Publish API
 * POST /api/events/publish - Create and publish an event
 * 
 * SECURITY: Server-side enforcement of package rules.
 * - Package rules are the single source of truth (never trust client)
 * - Event type validated against package's allowed types
 * - event_access created for ALL packages (not just free)
 * - Limits and features derived from packageRules, not client input
 */

import { getCurrentUser } from '../../lib/session.js';
import { 
    getPackageOrThrow, 
    validateEventTypeForPackage, 
    getFeaturesJson,
    getEventStatus,
    VALID_PACKAGE_IDS,
    canCreateMultipleEvents
} from '../../lib/packageRules.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // Get authenticated user
    const sessionResult = await getCurrentUser(db, request);
    const user = sessionResult?.valid ? sessionResult.user : null;

    if (!user) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Sila log masuk untuk menerbitkan jemputan'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let eventData;
    try {
        eventData = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid JSON data'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const {
        eventType,
        hostName1,
        hostName2,
        parentNames1,
        parentNames2,
        eventDate,
        startTime,
        venueName,
        venueAddress,
        mapLink,
        theme,
        inviteTitle,
        verseText,
        verseRef,
        hashtag,
        schedule,
        contacts,
        slug,
        package: packageId
        // NOTE: hasWatermark from client is IGNORED - derived from package rules
    } = eventData;

    // ===========================================
    // STEP 1: Validate required fields
    // ===========================================
    if (!slug || !eventType || !venueName || !eventDate) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Maklumat wajib tidak lengkap (slug, jenis majlis, tempat, tarikh)'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ===========================================
    // STEP 2: Validate packageId (MUST be one of: free|basic|popular|business)
    // ===========================================
    if (!packageId || !VALID_PACKAGE_IDS.includes(packageId)) {
        return new Response(JSON.stringify({
            success: false,
            error: `Pakej tidak sah: "${packageId}". Pakej yang sah: ${VALID_PACKAGE_IDS.join(', ')}`
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get package rules (throws if invalid - but we already validated above)
    let pkg;
    try {
        pkg = getPackageOrThrow(packageId);
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ===========================================
    // STEP 3: Resolve event type name from DB and validate against package
    // ===========================================
    let eventTypeName;
    try {
        const eventTypeRow = await db.prepare(`
            SELECT name FROM event_types WHERE id = ?
        `).bind(eventType).first();

        if (!eventTypeRow) {
            return new Response(JSON.stringify({
                success: false,
                error: `Jenis majlis dengan ID ${eventType} tidak dijumpai`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        eventTypeName = eventTypeRow.name;
    } catch (error) {
        console.error('Event type lookup error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Gagal mengesahkan jenis majlis'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Validate event type is allowed for this package
    const eventTypeValidation = validateEventTypeForPackage(packageId, eventTypeName);
    if (!eventTypeValidation.valid) {
        return new Response(JSON.stringify({
            success: false,
            error: eventTypeValidation.error
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ===========================================
    // STEP 4: Check multiple events restriction (if applicable)
    // ===========================================
    if (!canCreateMultipleEvents(packageId)) {
        try {
            // Count user's active events (draft, pending_payment, published)
            const activeEventCount = await db.prepare(`
                SELECT COUNT(*) as count 
                FROM events 
                WHERE created_by = ? 
                AND status IN ('draft', 'pending_payment', 'published', 'active')
                AND deleted_at IS NULL
            `).bind(user.id).first();

            if (activeEventCount && activeEventCount.count >= 1) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Pakej anda hanya membenarkan 1 majlis aktif. Sila naik taraf ke pakej Bisnes untuk majlis berganda.',
                    code: 'MULTIPLE_EVENTS_NOT_ALLOWED',
                    upgradeRequired: 'business'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (error) {
            console.error('Multiple events check error:', error);
            // Continue - don't block on error, just log
        }
    }

    // ===========================================
    // STEP 5: Check slug availability
    // ===========================================
    const existingSlug = await db.prepare(`
        SELECT id FROM events WHERE slug = ?
    `).bind(slug).first();

    if (existingSlug) {
        return new Response(JSON.stringify({
            success: false,
            error: 'URL ini sudah digunakan. Sila pilih URL lain.'
        }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ===========================================
    // STEP 6: Server-derived values (NEVER from client)
    // ===========================================
    const status = getEventStatus(packageId);
    const hasWatermark = pkg.watermark ? 1 : 0;
    const guestLimit = pkg.guestLimit;
    const viewLimit = pkg.viewLimit;
    const featuresJson = getFeaturesJson(packageId);
    const paidAt = pkg.autoPublish ? 'CURRENT_TIMESTAMP' : null;

    try {
        // Generate event name
        const eventName = hostName1 && hostName2
            ? `${hostName1} & ${hostName2}`
            : hostName1 || 'Majlis';

        // ===========================================
        // STEP 7: Create event record
        // ===========================================
        const result = await db.prepare(`
            INSERT INTO events (
                event_name,
                slug,
                event_type_id,
                event_date,
                start_time,
                end_time,
                venue_name,
                venue_address,
                map_link,
                theme_id,
                created_by,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            eventName,
            slug,
            eventType,
            eventDate,
            startTime || '11:00',
            null,
            venueName,
            venueAddress || '',
            mapLink || '',
            theme || 'elegant-gold',
            user.id,
            status
        ).run();

        const eventId = result.meta?.last_row_id;

        if (!eventId) {
            throw new Error('Failed to get event ID');
        }

        // ===========================================
        // STEP 8: Store event metadata (host names, schedule, etc.)
        // NOTE: has_watermark stored here is server-derived, not from client
        // ===========================================
        await db.prepare(`
            INSERT OR REPLACE INTO event_metadata (
                event_id,
                host_name_1,
                host_name_2,
                parent_names_1,
                parent_names_2,
                invite_title,
                verse_text,
                verse_ref,
                hashtag,
                schedule_json,
                contacts_json,
                has_watermark
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            eventId,
            hostName1 || '',
            hostName2 || '',
            parentNames1 || '',
            parentNames2 || '',
            inviteTitle || '',
            verseText || '',
            verseRef || '',
            hashtag || '',
            JSON.stringify(schedule || []),
            JSON.stringify(contacts || []),
            hasWatermark  // Server-derived, not from client!
        ).run();

        // ===========================================
        // STEP 9: Create event_access for ALL packages (not just free!)
        // This is the single source of truth for limits and features
        // ===========================================
        if (pkg.autoPublish) {
            // Free package: auto-publish with paid_at set immediately
            await db.prepare(`
                INSERT INTO event_access (
                    event_id,
                    package_id,
                    guest_limit,
                    view_limit,
                    has_watermark,
                    features_json,
                    paid_at,
                    view_count,
                    guest_count,
                    max_guests,
                    max_views,
                    current_guests,
                    current_views
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, 0, ?, ?, 0, 0)
            `).bind(
                eventId,
                packageId,
                guestLimit,
                viewLimit,
                hasWatermark,
                featuresJson,
                guestLimit,  // Also set max_guests for backwards compatibility
                viewLimit    // Also set max_views for backwards compatibility
            ).run();
        } else {
            // Paid packages: pending_payment, paid_at is NULL until payment confirmed
            await db.prepare(`
                INSERT INTO event_access (
                    event_id,
                    package_id,
                    guest_limit,
                    view_limit,
                    has_watermark,
                    features_json,
                    paid_at,
                    view_count,
                    guest_count,
                    max_guests,
                    max_views,
                    current_guests,
                    current_views
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, 0, 0, ?, ?, 0, 0)
            `).bind(
                eventId,
                packageId,
                guestLimit,
                viewLimit,
                hasWatermark,
                featuresJson,
                guestLimit,
                viewLimit
            ).run();
        }

        // ===========================================
        // STEP 10: Log audit
        // ===========================================
        await db.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'event_created', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ 
                userId: user.id, 
                slug, 
                packageId,
                eventTypeName,
                guestLimit,
                viewLimit,
                hasWatermark,
                status
            }),
            request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();

        return new Response(JSON.stringify({
            success: true,
            eventId,
            slug,
            inviteUrl: `https://a2zcreative.my/inv/${slug}`,
            status,
            package: packageId,
            limits: {
                guests: guestLimit,
                views: viewLimit
            },
            hasWatermark: hasWatermark === 1,
            message: status === 'published'
                ? 'Jemputan berjaya diterbitkan!'
                : 'Jemputan disimpan. Menunggu pembayaran.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Event publish error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Gagal menerbitkan jemputan',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

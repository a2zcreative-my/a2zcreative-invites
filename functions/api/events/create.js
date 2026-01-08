/**
 * Event Create API
 * POST /api/events/create - Create a new event draft
 * 
 * SECURITY: Uses packageRules.js as single source of truth
 * Package IDs: free | basic | popular | business
 */

import { getCurrentUser } from '../../lib/session.js';
import { 
    getPackageOrThrow, 
    validateEventTypeForPackage,
    getFeaturesJson,
    VALID_PACKAGE_IDS,
    canCreateMultipleEvents
} from '../../lib/packageRules.js';

// Event type mapping (frontend ID -> DB event_type_id)
const EVENT_TYPE_MAPPING = {
    wedding: 1,
    birthday: 4,
    family: 3,
    business: 2,
    community: 5
};

// Event type name mapping for validation
const EVENT_TYPE_NAMES = {
    wedding: 'Perkahwinan',
    birthday: 'Hari Lahir',
    family: 'Keluarga',
    business: 'Bisnes',
    community: 'Komuniti'
};

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Auth Check
    const sessionResult = await getCurrentUser(db, request);
    const user = sessionResult?.valid ? sessionResult.user : null;

    if (!user) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Sila log masuk untuk mencipta jemputan'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }

    const { eventType, planId } = data;

    // 2. Validate Inputs
    if (!eventType || !planId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Sila pilih jenis majlis dan pakej'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Validate packageId (MUST be one of: free|basic|popular|business)
    if (!VALID_PACKAGE_IDS.includes(planId)) {
        return new Response(JSON.stringify({
            success: false,
            error: `Pakej tidak sah: "${planId}". Pakej yang sah: ${VALID_PACKAGE_IDS.join(', ')}`
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get package rules (single source of truth)
    let pkg;
    try {
        pkg = getPackageOrThrow(planId);
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Validate event type exists
    const eventTypeId = EVENT_TYPE_MAPPING[eventType];
    if (!eventTypeId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Jenis majlis tidak sah'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Validate event type is allowed for this package
    const eventTypeName = EVENT_TYPE_NAMES[eventType];
    const eventTypeValidation = validateEventTypeForPackage(planId, eventTypeName);
    if (!eventTypeValidation.valid) {
        return new Response(JSON.stringify({
            success: false,
            error: eventTypeValidation.error
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 6. Check multiple events restriction
    if (!canCreateMultipleEvents(planId)) {
        try {
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
                }), { status: 403, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (error) {
            console.error('Multiple events check error:', error);
        }
    }

    // 7. Generate Draft Slug
    const randomStr = crypto.randomUUID().split('-')[0];
    const slug = `draft-${randomStr}-${Date.now()}`;

    // 8. Server-derived values from package rules
    const hasWatermark = pkg.watermark ? 1 : 0;
    const guestLimit = pkg.guestLimit;
    const viewLimit = pkg.viewLimit;
    const featuresJson = getFeaturesJson(planId);

    try {
        // 9. Create Event (Draft Status)
        const result = await db.prepare(`
            INSERT INTO events (
                event_name,
                slug,
                event_type_id,
                created_by,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP)
        `).bind(
            'Majlis Baru',
            slug,
            eventTypeId,
            user.id
        ).run();

        const eventId = result.meta?.last_row_id;
        if (!eventId) throw new Error('Failed to create event record');

        // 10. Set Entitlements in event_access (using packageRules as source of truth)
        await db.prepare(`
            INSERT INTO event_access (
                event_id,
                package_id,
                guest_limit,
                view_limit,
                has_watermark,
                features_json,
                max_guests,
                max_views,
                guest_count,
                view_count,
                current_guests,
                current_views
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
        `).bind(
            eventId,
            planId,
            guestLimit,
            viewLimit,
            hasWatermark,
            featuresJson,
            guestLimit,
            viewLimit
        ).run();

        // 11. Initialize Metadata
        await db.prepare(`
            INSERT INTO event_metadata (event_id, has_watermark) VALUES (?, ?)
        `).bind(eventId, hasWatermark).run();

        // 12. Audit Log
        await db.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'event_created', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ 
                userId: user.id, 
                planId, 
                eventType,
                guestLimit,
                viewLimit,
                hasWatermark
            }),
            request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();

        return new Response(JSON.stringify({
            success: true,
            eventId,
            slug,
            package: planId,
            limits: {
                guests: guestLimit,
                views: viewLimit
            },
            hasWatermark: hasWatermark === 1,
            redirect: `/dashboard/edit/${slug}`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create event error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Gagal mencipta jemputan. Sila cuba lagi.',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

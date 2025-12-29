/**
 * Event Publish API
 * POST /api/events/publish - Create and publish an event
 */

import { getCurrentUser } from '../../lib/session.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // Get authenticated user
    const user = await getCurrentUser(db, request);
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
        package: packageId,
        hasWatermark
    } = eventData;

    // Validate required fields
    if (!slug || !eventType || !venueName || !eventDate) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Maklumat wajib tidak lengkap (slug, jenis majlis, tempat, tarikh)'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check slug availability
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

    try {
        // Generate event name
        const eventName = hostName1 && hostName2
            ? `${hostName1} & ${hostName2}`
            : hostName1 || 'Majlis';

        // Determine status based on package
        const status = packageId === 'free' ? 'published' : 'pending_payment';

        // Create event
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

        // Store additional event data in event_details or custom_data column
        // For now, we'll store schedule and contacts as JSON in the database
        // This requires a custom_data column or separate tables

        // Store event metadata (host names, parents, etc.)
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
            hasWatermark ? 1 : 0
        ).run();

        // If free package, create event_access with free package
        if (packageId === 'free') {
            await db.prepare(`
                INSERT INTO event_access (
                    event_id,
                    package_id,
                    guest_limit,
                    view_limit,
                    has_watermark,
                    paid_at
                ) VALUES (?, 'free', 10, 50, 1, CURRENT_TIMESTAMP)
            `).bind(eventId).run();
        }

        // Log audit
        await db.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'event_created', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ userId: user.id, slug, packageId }),
            request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();

        return new Response(JSON.stringify({
            success: true,
            eventId,
            slug,
            inviteUrl: `https://a2zcreative.my/inv/${slug}`,
            status,
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

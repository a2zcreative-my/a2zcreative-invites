import { getCurrentUser, createSessionCookie } from '../../lib/session.js';
import {
    getEventTypeById,
    deriveHostName1,
    deriveHostName2,
    deriveEventName,
    EVENT_TYPE_ID_TO_KEY
} from '../../lib/eventConfig.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Auth Check
    const sessionResult = await getCurrentUser(db, request);
    const user = sessionResult?.valid ? sessionResult.user : null;

    if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
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

    const { slug, eventDetails } = data;

    if (!slug || !eventDetails) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Find existing event with all current values
        const event = await db.prepare(`
            SELECT id, event_type_id, venue_address, map_link 
            FROM events 
            WHERE slug = ? AND created_by = ?
        `).bind(slug, user.id).first();

        if (!event) {
            return new Response(JSON.stringify({ success: false, error: 'Event not found' }), {
                status: 404, headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get event type key for deriving names
        const eventTypeKey = EVENT_TYPE_ID_TO_KEY[event.event_type_id] || 'wedding';

        // Derive host names and event name based on event type
        const hostName1 = deriveHostName1(eventTypeKey, eventDetails);
        const hostName2 = deriveHostName2(eventTypeKey, eventDetails);
        const eventName = deriveEventName(eventTypeKey, eventDetails);

        // Update core event fields in events table
        await db.prepare(`
            UPDATE events 
            SET event_date = COALESCE(?, event_date),
                start_time = COALESCE(?, start_time),
                venue_name = COALESCE(?, venue_name),
                venue_address = COALESCE(?, venue_address),
                map_link = COALESCE(?, map_link),
                event_name = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            eventDetails.event_date || null,
            eventDetails.event_time || null,
            eventDetails.location || null,
            eventDetails.venueAddress || event.venue_address || null,
            eventDetails.mapLink || event.map_link || null,
            eventName,
            event.id
        ).run();

        // Update event_metadata with detailed information
        await db.prepare(`
            UPDATE event_metadata
            SET host_name_1 = COALESCE(?, host_name_1),
                host_name_2 = COALESCE(?, host_name_2),
                parent_names_1 = COALESCE(?, parent_names_1),
                parent_names_2 = COALESCE(?, parent_names_2),
                invite_title = COALESCE(?, invite_title),
                verse_text = COALESCE(?, verse_text),
                verse_ref = COALESCE(?, verse_ref),
                hashtag = COALESCE(?, hashtag),
                schedule_json = COALESCE(?, schedule_json),
                contacts_json = COALESCE(?, contacts_json),
                theme_json = COALESCE(?, theme_json),
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = ?
        `).bind(
            hostName1,
            hostName2,
            eventDetails.parentNames1 || null,
            eventDetails.parentNames2 || null,
            eventDetails.event_title || null,
            eventDetails.verseText || null,
            eventDetails.verseRef || null,
            eventDetails.hashtag || null,
            eventDetails.schedule ? JSON.stringify(eventDetails.schedule) : null,
            eventDetails.contacts ? JSON.stringify(eventDetails.contacts) : null,
            JSON.stringify({
                templateId: eventDetails.templateId || 'classic-gold', // Default template
                themeId: eventDetails.themeId || null,
                themeColor: eventDetails.themeColor,
                font: eventDetails.font,
                music: eventDetails.music,
                customMusicUrl: eventDetails.customMusicUrl
            }),
            event.id
        ).run();

        const headers = { 'Content-Type': 'application/json' };
        if (sessionResult?.newToken) {
            headers['Set-Cookie'] = createSessionCookie(sessionResult.newToken, sessionResult.newTokenExpiry);
            headers['X-Session-Refreshed'] = 'true';
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Butiran majlis berjaya disimpan',
            redirect: '/dashboard'
        }), {
            status: 200, headers: headers
        });

    } catch (error) {
        console.error('Update event details error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error', details: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/events/get-details?slug=xxx - Get event details by slug
 * Used for pre-populating form when navigating back with "Kembali" button
 */

import { getCurrentUser } from '../../lib/session.js';
import { EVENT_TYPE_ID_TO_KEY } from '../../lib/eventConfig.js';

export async function onRequestGet(context) {
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

    // Get slug from query params
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
        return new Response(JSON.stringify({ success: false, error: 'Missing slug parameter' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Fetch event with joined metadata
        const event = await db.prepare(`
            SELECT 
                e.id,
                e.event_type_id,
                e.event_name,
                e.event_date,
                e.start_time,
                e.venue_name,
                e.venue_address,
                e.map_link,
                em.host_name_1,
                em.host_name_2,
                em.parent_names_1,
                em.parent_names_2,
                em.invite_title,
                em.verse_text,
                em.verse_ref,
                em.hashtag,
                em.schedule_json,
                em.contacts_json,
                em.theme_json
            FROM events e
            LEFT JOIN event_metadata em ON e.id = em.event_id
            WHERE e.slug = ? AND e.created_by = ? AND e.deleted_at IS NULL
        `).bind(slug, user.id).first();

        if (!event) {
            return new Response(JSON.stringify({ success: false, error: 'Event not found' }), {
                status: 404, headers: { 'Content-Type': 'application/json' }
            });
        }

        // Map database fields back to form field names based on event type
        const eventTypeKey = EVENT_TYPE_ID_TO_KEY[event.event_type_id] || 'wedding';

        // Parse JSON fields safely
        const schedule = event.schedule_json ? JSON.parse(event.schedule_json) : [];
        const contacts = event.contacts_json ? JSON.parse(event.contacts_json) : [];
        const themeConfig = event.theme_json ? JSON.parse(event.theme_json) : {};

        let eventDetails = {
            // CRITICAL: Include event type for proper template rendering
            event_type: eventTypeKey,
            event_name: event.event_name,
            event_date: event.event_date,
            event_time: event.start_time,
            location: event.venue_name,
            venueAddress: event.venue_address,
            mapLink: event.map_link,
            // Metadata fields
            invite_title: event.invite_title,
            verse_text: event.verse_text,
            verse_ref: event.verse_ref,
            hashtag: event.hashtag,
            // JSON fields
            schedule: schedule,
            contacts: contacts,
            // Theme fields (flat map for easier frontend consumption)
            themeConfig: themeConfig,
            templateId: themeConfig.templateId || 'classic-gold', // Default template
            themeColor: themeConfig.themeColor || 'gold',
            font: themeConfig.font || 'inter',
            music: themeConfig.music || 'romantic',
            customMusicUrl: themeConfig.customMusicUrl || '',
        };

        // Map host names based on event type
        switch (eventTypeKey) {
            case 'wedding':
                eventDetails.groom_name = event.host_name_1;
                eventDetails.bride_name = event.host_name_2;
                eventDetails.parentNames1 = event.parent_names_1;
                eventDetails.parentNames2 = event.parent_names_2;
                break;
            case 'birthday':
                eventDetails.celebrant_name = event.host_name_1;
                eventDetails.age = event.host_name_2; // Age stored in host_name_2
                break;
            case 'corporate':
            case 'business':
                eventDetails.event_title = event.invite_title || event.event_name;
                eventDetails.organizer = event.host_name_1;
                break;
            default:
                eventDetails.event_title = event.invite_title || event.event_name;
                break;
        }

        return new Response(JSON.stringify({
            success: true,
            eventId: event.id,
            eventDetails: eventDetails
        }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get event details error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error', details: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/invitation/[slug]
 * Fetch complete invitation data by public slug
 * PUBLIC ENDPOINT - Rate limited by Cloudflare
 */

import { validateSlug, validationErrorResponse } from '../../lib/input-validation.js';

export async function onRequestGet(context) {
     const { params, env } = context;
     const slug = params.slug;

     // SECURITY FIX: Validate slug format
     const slugValidation = validateSlug(slug);
     if (!slugValidation.valid) {
         return validationErrorResponse(slugValidation.error);
     }

     try {
        // Get invitation by slug
        const invitation = await env.DB.prepare(`
            SELECT i.*, e.*
            FROM invitations i
            JOIN events e ON i.event_id = e.id
            WHERE i.public_slug = ? AND i.is_active = 1
        `).bind(slug).first();

        if (!invitation) {
            return new Response(JSON.stringify({ error: 'Invitation not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Increment view count
        await env.DB.prepare(`
            UPDATE invitations SET view_count = view_count + 1 WHERE public_slug = ?
        `).bind(slug).run();

        // Get event settings
        const settings = await env.DB.prepare(`
            SELECT * FROM event_settings WHERE event_id = ?
        `).bind(invitation.event_id).first();

        // Get schedule
        const scheduleResult = await env.DB.prepare(`
            SELECT time_slot, activity, description 
            FROM event_schedule 
            WHERE event_id = ? 
            ORDER BY sort_order ASC
        `).bind(invitation.event_id).all();

        // Get contacts
        const contactsResult = await env.DB.prepare(`
            SELECT role, name, phone, whatsapp_link 
            FROM event_contacts 
            WHERE event_id = ?
        `).bind(invitation.event_id).all();

        // Get recent messages/wishes
        const messagesResult = await env.DB.prepare(`
            SELECT guest_name, message, created_at 
            FROM guest_messages 
            WHERE event_id = ? AND is_approved = 1
            ORDER BY created_at DESC
            LIMIT 20
        `).bind(invitation.event_id).all();

        // Structure response
        const responseData = {
            event: {
                id: invitation.event_id,
                event_type_id: invitation.event_type_id,
                event_name: invitation.event_name,
                event_date: invitation.event_date,
                start_time: invitation.start_time,
                end_time: invitation.end_time,
                venue_name: invitation.venue_name,
                venue_address: invitation.venue_address,
                map_link: invitation.map_link,
                map_embed_url: invitation.map_embed_url,
                host_name_1: invitation.host_name_1,
                host_name_2: invitation.host_name_2,
                parent_names_1: invitation.parent_names_1,
                parent_names_2: invitation.parent_names_2
            },
            invitation: {
                slug: invitation.public_slug,
                invitation_title: invitation.invitation_title,
                invitation_message: invitation.invitation_message,
                verse_text: invitation.verse_text,
                verse_reference: invitation.verse_reference,
                hashtag: invitation.hashtag
            },
            settings: settings || {},
            schedule: scheduleResult?.results || [],
            contacts: contactsResult?.results || [],
            messages: messagesResult?.results || []
        };

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching invitation:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch invitation',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

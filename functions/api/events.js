/**
 * POST /api/events - Create new event
 * GET /api/events - List user's events
 */

import { getAuthUser, syncUserToD1 } from '../lib/auth.js';

// Generate random slug for invitation
function generatePublicSlug(prefix = '') {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let slug = prefix ? prefix + '-' : '';
    for (let i = 0; i < 8; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Please log in to create events'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Sync user to D1 and get their ID
        const userId = await syncUserToD1(env.DB, authUser);

        // ===== PACKAGE ACCESS CONTROL =====
        // Get user's subscription info
        const user = await env.DB.prepare(`
            SELECT active_package_id, events_remaining 
            FROM users WHERE id = ?
        `).bind(userId).first();

        const packageId = user?.active_package_id || 'free';
        const eventsRemaining = user?.events_remaining ?? 1;

        // Package to allowed event types mapping
        const PACKAGE_EVENT_TYPES = {
            'free': [1],           // Wedding only
            'basic': [1, 3, 4],    // Wedding, Family, Birthday
            'premium': [1, 3, 4],  // Wedding, Family, Birthday
            'business': [2, 5]     // Corporate, Community
        };

        const eventTypeId = parseInt(data.eventType) || 1;
        const allowedTypes = PACKAGE_EVENT_TYPES[packageId] || [1];

        // Check if event type is allowed for this package
        if (!allowedTypes.includes(eventTypeId)) {
            return new Response(JSON.stringify({
                error: 'Package restriction',
                message: 'Sila naik taraf pakej anda untuk mencipta jenis majlis ini.',
                upgrade_required: true,
                current_package: packageId,
                required_package: eventTypeId === 2 || eventTypeId === 5 ? 'business' : 'premium'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user has events remaining
        if (eventsRemaining <= 0) {
            return new Response(JSON.stringify({
                error: 'Limit exceeded',
                message: 'Anda telah mencapai had jemputan. Sila naik taraf pakej.',
                upgrade_required: true,
                current_package: packageId
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        // ===== END ACCESS CONTROL =====

        // Create event
        const eventResult = await env.DB.prepare(`
            INSERT INTO events (
                event_type_id, created_by, event_name, event_date, start_time,
                venue_name, venue_address, map_link,
                host_name_1, host_name_2, parent_names_1, parent_names_2,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `).bind(
            data.eventType || 1,
            userId,
            `${data.hostName1} & ${data.hostName2}`,
            data.eventDate,
            data.startTime || '11:00',
            data.venueName || '',
            data.venueAddress || '',
            data.mapLink || '',
            data.hostName1 || '',
            data.hostName2 || '',
            data.parentNames1 || '',
            data.parentNames2 || ''
        ).run();

        const eventId = eventResult.meta?.last_row_id;

        // Create event settings
        await env.DB.prepare(`
            INSERT INTO event_settings (event_id, theme_name)
            VALUES (?, ?)
        `).bind(eventId, data.theme || 'elegant-gold').run();

        // Create invitation
        const slug = data.slug || generatePublicSlug(data.hostName1?.toLowerCase());

        await env.DB.prepare(`
            INSERT INTO invitations (
                event_id, public_slug, invitation_title, 
                verse_text, verse_reference, hashtag, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `).bind(
            eventId,
            slug,
            data.inviteTitle || 'Perutusan Raja Sehari',
            data.verseText || '',
            data.verseRef || '',
            data.hashtag || ''
        ).run();

        // Create schedule items
        if (data.schedule && data.schedule.length > 0) {
            for (let i = 0; i < data.schedule.length; i++) {
                const item = data.schedule[i];
                await env.DB.prepare(`
                    INSERT INTO event_schedule (event_id, time_slot, activity, sort_order)
                    VALUES (?, ?, ?, ?)
                `).bind(eventId, item.time, item.activity, i).run();
            }
        }

        // Create contacts
        if (data.contacts && data.contacts.length > 0) {
            for (const contact of data.contacts) {
                const whatsapp = `https://wa.me/6${contact.phone.replace(/[^0-9]/g, '')}`;
                await env.DB.prepare(`
                    INSERT INTO event_contacts (event_id, role, name, phone, whatsapp_link)
                    VALUES (?, ?, ?, ?, ?)
                `).bind(eventId, contact.role, contact.name, contact.phone, whatsapp).run();
            }
        }

        // Decrement user's events_remaining
        await env.DB.prepare(`
            UPDATE users SET events_remaining = events_remaining - 1 
            WHERE id = ? AND events_remaining > 0
        `).bind(userId).run();

        return new Response(JSON.stringify({
            success: true,
            eventId: eventId,
            slug: slug,
            inviteUrl: `/inv/${slug}`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating event:', error);

        // Handle unique constraint violation (likely public_slug)
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return new Response(JSON.stringify({
                error: 'Slug verified',
                message: 'This invitation link URL is already taken. Please try again.'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            error: 'Failed to create event',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    const { request, env } = context;

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Please log in to view events'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Get user ID from D1
        const userId = await syncUserToD1(env.DB, authUser);

        // Get only this user's events
        const events = await env.DB.prepare(`
            SELECT 
                e.*,
                i.public_slug,
                i.view_count,
                (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as guest_count,
                (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND response = 'yes') as confirmed_count
            FROM events e
            LEFT JOIN invitations i ON e.id = i.event_id
            WHERE e.deleted_at IS NULL AND e.created_by = ?
            ORDER BY e.created_at DESC
        `).bind(userId).all();

        return new Response(JSON.stringify(events.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching events:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch events',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

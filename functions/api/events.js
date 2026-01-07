/**
 * POST /api/events - Create new event
 * GET /api/events - List user's events
 */

import { requireAuth } from '../lib/auth.js';
import { checkUserCanCreateEvent, trackPaymentAttempt } from '../lib/state-enforcement.js';

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

    // Authenticate user using D1 session cookies
    const { user, userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) {
        return errorResponse;
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
        // ===== ABUSE PREVENTION: Rate Limit Check =====
        const rateCheck = await checkUserCanCreateEvent(env.DB, userId);
        if (rateCheck.blocked) {
            return new Response(JSON.stringify({
                error: rateCheck.reason,
                message: rateCheck.reason_ms,
                code: rateCheck.code
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Track this event creation attempt for abuse detection
        await trackPaymentAttempt(env.DB, userId);

        // TRIGGER GLOBAL CLEANUP
        // Garbage collect ANY expired unpaid events to keep DB clean
        // This runs on every event creation to ensure "automatic" deletion
        await cleanupExpiredEvents(env.DB);

        // Check for existing slug usage by abandoned/pending events
        const slug = data.slug || generatePublicSlug(data.hostName1?.toLowerCase());

         // Find if this slug is taken by an ACTIVE (not deleted) event
         // CRITICAL FIX: Include deleted_at check to prevent slug reuse
         // Even if an old event is "archived", its slug remains reserved
         const existingInvite = await env.DB.prepare(`
       SELECT i.id, i.event_id, i.created_at, e.deleted_at, po.status as payment_status
       FROM invitations i
       JOIN events e ON i.event_id = e.id
       LEFT JOIN payment_orders po ON po.event_id = i.event_id
       WHERE i.public_slug = ? AND i.is_active = 1 AND e.deleted_at IS NULL
     `).bind(slug).first();

          if (existingInvite) {
             // CRITICAL FIX: NEVER reuse slugs - they are permanently reserved
             // Even old/deleted events keep their slugs to prevent confusion and IDOR
             // (See: Slug Reuse Vulnerability in security audit)
             const message = data.slug 
                 ? 'URL jemputan ini sudah digunakan. Sila pilih URL yang berbeza.'
                 : 'Slug yang dipilih sudah digunakan. Sila tunggu atau gunakan autogenerate.';
             
             return new Response(JSON.stringify({
                 error: 'URL sudah digunakan',
                 message: message,
                 suggestion: 'Try using auto-generated slug or pick a unique custom URL'
             }), {
                 status: 409,
                 headers: { 'Content-Type': 'application/json' }
             });
         }

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
            (data.hostName2 ? `${data.hostName1} & ${data.hostName2}` : data.hostName1),
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
            INSERT INTO event_settings (
                event_id, theme_name,
                gift_enabled, gift_bank_name, gift_account_number, gift_account_holder, gift_qr_image_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            eventId,
            data.theme || 'elegant-gold',
            data.giftEnabled ? 1 : 0,
            data.giftBankName || '',
            data.giftAccountNumber || '',
            data.giftAccountHolder || '',
            data.giftQrImage || ''
        ).run();

        // Create invitation
        // const slug = data.slug || ... (Already defined above)

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

        // NOTE: events_remaining decrement removed - column doesn't exist yet

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
                error: 'URL sudah digunakan',
                message: 'URL jemputan ini sudah digunakan. Sila pilih URL yang berbeza.'
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

    // Authenticate user using D1 session cookies
    const { user, userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) {
        return errorResponse;
    }

    try {
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

/**
 * Global Cleanup Helper
 * Soft-deletes all unpaid events that are:
 * 1. Older than 15 minutes
 * 2. Have NO verified payment (orphaned or pending/failed)
 * 
 * CRITICAL FIX: Uses soft-delete (mark deleted_at) instead of hard-delete
 * This prevents slug reuse - old invitation links remain associated with old event
 * Even if event is marked deleted, the slug remains reserved
 */
async function cleanupExpiredEvents(db) {
     try {
         const now = new Date();
         const fifteenMinutesAgo = new Date(now.getTime() - (15 * 60 * 1000)).toISOString();

         // 1. Identify Expired Event IDs (unpaid + old)
         // We select events created < 15 mins ago that aren't paid
         const expired = await db.prepare(`
             SELECT e.id 
             FROM events e
             LEFT JOIN payment_orders po ON po.event_id = e.id
             WHERE e.created_at < ? 
             AND e.deleted_at IS NULL -- Only target non-deleted events
             AND e.status != 'paid' -- Safety check on event status
             AND (
                 po.id IS NULL -- No payment order at all
                 OR 
                 po.status IN ('pending', 'failed', 'expired') -- Payment not successful
             )
         `).bind(fifteenMinutesAgo).all();

         const idsToDelete = expired.results?.map(r => r.id) || [];

         if (idsToDelete.length > 0) {
             console.log(`[Cleanup] Found ${idsToDelete.length} expired events to soft-delete: ${idsToDelete.join(',')}`);

             // 2. Soft-delete: Mark as deleted instead of removing from DB
             // This keeps the slug reserved and maintains historical records
             for (const id of idsToDelete) {
                 await db.prepare(`
                     UPDATE events 
                     SET deleted_at = CURRENT_TIMESTAMP,
                         status = 'archived'
                     WHERE id = ?
                 `).bind(id).run();

                 // Also mark related invitations as inactive
                 await db.prepare(`
                     UPDATE invitations
                     SET is_active = 0
                     WHERE event_id = ?
                 `).bind(id).run();
             }

             console.log('[Cleanup] Expired events archived successfully (soft-delete)');
         }
     } catch (error) {
         console.error('[Cleanup] Failed to cleanup expired events:', error);
         // Don't block the main request if cleanup fails
     }
}

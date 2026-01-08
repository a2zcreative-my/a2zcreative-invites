/**
 * GET /api/invitation/[slug]
 * Fetch complete invitation data by public slug
 * PUBLIC ENDPOINT - Rate limited by Cloudflare
 * 
 * SECURITY: Server-side enforcement of view limits
 * - Only published events are viewable
 * - View count incremented atomically (race-safe)
 * - Returns 429 when view limit reached
 * - Watermark status from event_access, not client
 */

import { validateSlug, validationErrorResponse } from '../../lib/input-validation.js';
import { PACKAGE_RULES } from '../../lib/packageRules.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const slug = params.slug;

    // SECURITY FIX: Validate slug format
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
        return validationErrorResponse(slugValidation.error);
    }

    try {
        // ===========================================
        // STEP 1: Get invitation with event and access data
        // Only fetch if event is published
        // ===========================================
        const invitation = await env.DB.prepare(`
            SELECT 
                i.*,
                e.*,
                e.id as event_id,
                e.status as event_status,
                ea.view_limit,
                ea.view_count,
                ea.guest_limit,
                ea.guest_count,
                ea.has_watermark,
                ea.features_json,
                ea.package_id,
                ea.paid_at
            FROM invitations i
            JOIN events e ON i.event_id = e.id
            LEFT JOIN event_access ea ON e.id = ea.event_id
            WHERE i.public_slug = ? AND i.is_active = 1
        `).bind(slug).first();

        if (!invitation) {
            return new Response(JSON.stringify({ 
                error: 'Jemputan tidak dijumpai',
                errorEn: 'Invitation not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ===========================================
        // STEP 2: Check event is published
        // Only published events are publicly viewable
        // ===========================================
        if (invitation.event_status !== 'published' && invitation.event_status !== 'active') {
            return new Response(JSON.stringify({ 
                error: 'Jemputan ini belum diterbitkan',
                errorEn: 'This invitation has not been published yet',
                status: invitation.event_status
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ===========================================
        // STEP 3: Atomically increment view count (race-safe)
        // Only increment if view_count < view_limit
        // ===========================================
        const viewLimit = invitation.view_limit ?? PACKAGE_RULES.free.viewLimit;
        const currentViewCount = invitation.view_count ?? 0;

        // Atomic increment with condition
        const updateResult = await env.DB.prepare(`
            UPDATE event_access 
            SET view_count = view_count + 1,
                current_views = current_views + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = ? 
            AND view_count < view_limit
        `).bind(invitation.event_id).run();

        // Also increment on invitations table for backwards compatibility
        await env.DB.prepare(`
            UPDATE invitations SET view_count = view_count + 1 WHERE public_slug = ?
        `).bind(slug).run();

        // Check if update was successful (changes > 0 means we were under limit)
        if (updateResult.meta?.changes === 0 && currentViewCount >= viewLimit) {
            // View limit reached
            return new Response(JSON.stringify({
                error: 'Had paparan jemputan telah dicapai',
                errorEn: 'View limit reached for this invitation',
                code: 'VIEW_LIMIT_REACHED',
                limit: viewLimit,
                upgradeMessage: 'Sila hubungi penganjur untuk naik taraf pakej'
            }), {
                status: 429,
                headers: { 
                    'Content-Type': 'application/json',
                    'Retry-After': '86400' // 24 hours
                }
            });
        }

        // ===========================================
        // STEP 4: Get additional data (settings, schedule, contacts, messages)
        // ===========================================
        const [settings, scheduleResult, contactsResult, messagesResult, metadataResult] = await Promise.all([
            env.DB.prepare(`
                SELECT * FROM event_settings WHERE event_id = ?
            `).bind(invitation.event_id).first(),

            env.DB.prepare(`
                SELECT time_slot, activity, description 
                FROM event_schedule 
                WHERE event_id = ? 
                ORDER BY sort_order ASC
            `).bind(invitation.event_id).all(),

            env.DB.prepare(`
                SELECT role, name, phone, whatsapp_link 
                FROM event_contacts 
                WHERE event_id = ?
            `).bind(invitation.event_id).all(),

            env.DB.prepare(`
                SELECT guest_name, message, created_at 
                FROM guest_messages 
                WHERE event_id = ? AND is_approved = 1
                ORDER BY created_at DESC
                LIMIT 20
            `).bind(invitation.event_id).all(),

            env.DB.prepare(`
                SELECT * FROM event_metadata WHERE event_id = ?
            `).bind(invitation.event_id).first()
        ]);

        // ===========================================
        // STEP 5: Determine watermark status from server (never trust client)
        // Priority: event_access.has_watermark > event_metadata.has_watermark > default
        // ===========================================
        let showWatermark = true; // Default to showing watermark
        
        if (invitation.has_watermark !== null && invitation.has_watermark !== undefined) {
            // Use event_access.has_watermark (authoritative)
            showWatermark = invitation.has_watermark === 1;
        } else if (metadataResult?.has_watermark !== null && metadataResult?.has_watermark !== undefined) {
            // Fallback to event_metadata.has_watermark
            showWatermark = metadataResult.has_watermark === 1;
        }

        // Parse features
        let features = {};
        try {
            features = invitation.features_json ? JSON.parse(invitation.features_json) : {};
        } catch {
            features = {};
        }

        // ===========================================
        // STEP 6: Structure response
        // Include watermark status from server, not client
        // ===========================================
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
                host_name_1: metadataResult?.host_name_1 || invitation.host_name_1,
                host_name_2: metadataResult?.host_name_2 || invitation.host_name_2,
                parent_names_1: metadataResult?.parent_names_1 || invitation.parent_names_1,
                parent_names_2: metadataResult?.parent_names_2 || invitation.parent_names_2
            },
            invitation: {
                slug: invitation.public_slug,
                invitation_title: metadataResult?.invite_title || invitation.invitation_title,
                invitation_message: invitation.invitation_message,
                verse_text: metadataResult?.verse_text || invitation.verse_text,
                verse_reference: metadataResult?.verse_ref || invitation.verse_reference,
                hashtag: metadataResult?.hashtag || invitation.hashtag
            },
            settings: settings || {},
            schedule: scheduleResult?.results || [],
            contacts: contactsResult?.results || [],
            messages: messagesResult?.results || [],
            // SERVER-DERIVED: Watermark status (never trust client)
            display: {
                showWatermark: showWatermark,
                packageId: invitation.package_id || 'free'
            },
            // Feature flags from server
            features: {
                qrEnabled: features.qr === true,
                // Don't expose all features to public endpoint
            }
        };

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching invitation:', error);
        return new Response(JSON.stringify({
            error: 'Gagal mendapatkan maklumat jemputan',
            errorEn: 'Failed to fetch invitation',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

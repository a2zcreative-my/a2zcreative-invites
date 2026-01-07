/**
 * GET /api/analytics/[event_id]
 * Get analytics data for an event
 * 
 * SECURITY: Requires authentication + event ownership verification
 */

import { requireAuth, requireEventOwnership } from '../../lib/auth.js';
import { validateNumericId, validationErrorResponse } from '../../lib/input-validation.js';

export async function onRequestGet(context) {
     const { request, params, env } = context;
     const eventId = params.event_id;

     // SECURITY FIX: Validate event ID format
     const idValidation = validateNumericId(eventId, 'Event ID');
     if (!idValidation.valid) {
         return validationErrorResponse(idValidation.error);
     }

     // 1. Authenticate user
     const { userId, errorResponse } = await requireAuth(request, env.DB);
     if (errorResponse) return errorResponse;

    // 2. Verify user owns this event
    const ownershipError = await requireEventOwnership(env.DB, eventId, userId);
    if (ownershipError) return ownershipError;

    try {
        // RSVP breakdown
        const rsvpStats = await env.DB.prepare(`
            SELECT 
                response,
                COUNT(*) as count,
                SUM(pax) as total_pax
            FROM rsvps
            WHERE event_id = ?
            GROUP BY response
        `).bind(eventId).all();

        // Check-in stats
        const checkinStats = await env.DB.prepare(`
            SELECT 
                COUNT(*) as checked_in_guests,
                SUM(g.pax) as checked_in_pax
            FROM attendance_logs al
            JOIN guests g ON al.guest_id = g.id
            WHERE al.event_id = ?
        `).bind(eventId).first();

        // Daily RSVP trend (last 7 days)
        const rsvpTrend = await env.DB.prepare(`
            SELECT 
                DATE(responded_at) as date,
                COUNT(*) as count
            FROM rsvps
            WHERE event_id = ?
            AND responded_at >= DATE('now', '-7 days')
            GROUP BY DATE(responded_at)
            ORDER BY date
        `).bind(eventId).all();

        // Arrival time distribution
        const arrivalDistribution = await env.DB.prepare(`
            SELECT 
                arrival_time,
                COUNT(*) as count
            FROM rsvps
            WHERE event_id = ? 
            AND response = 'yes'
            AND arrival_time IS NOT NULL
            GROUP BY arrival_time
        `).bind(eventId).all();

        // Total guests and pax
        const totals = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_guests,
                SUM(pax) as total_pax
            FROM guests
            WHERE event_id = ?
        `).bind(eventId).first();

        // Views
        const views = await env.DB.prepare(`
            SELECT view_count
            FROM invitations
            WHERE event_id = ?
        `).bind(eventId).first();

        return new Response(JSON.stringify({
            rsvp: {
                breakdown: rsvpStats.results || [],
                trend: rsvpTrend.results || []
            },
            checkin: {
                guests: checkinStats?.checked_in_guests || 0,
                pax: checkinStats?.checked_in_pax || 0
            },
            arrival: arrivalDistribution.results || [],
            totals: {
                guests: totals?.total_guests || 0,
                pax: totals?.total_pax || 0,
                views: views?.view_count || 0
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

     } catch (error) {
         console.error('Error fetching analytics:', error);
         return new Response(JSON.stringify({
             error: 'Failed to fetch analytics'
         }), {
             status: 500,
             headers: { 'Content-Type': 'application/json' }
         });
     }
}

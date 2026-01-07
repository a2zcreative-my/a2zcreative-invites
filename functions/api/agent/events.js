/**
 * GET /api/agent/events
 * 
 * Get events assigned to an agent (or all events for super_admin in monitor mode)
 * SECURITY: Agent or Super Admin only - enforced via requireAgentLevel()
 * 
 * NOTE: Future implementation should use an event_agents table for proper assignment.
 * Currently returns events based on a placeholder logic.
 */

import { requireAuth, requireAgentLevel } from '../../lib/auth.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    // Authenticate user
    const { user, userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) {
        return errorResponse;
    }

    // RBAC: Agent or Super Admin only
    const roleError = requireAgentLevel(user);
    if (roleError) {
        return roleError;
    }

    try {
        let events;

        if (user.role === 'super_admin') {
            // Super admin sees all active events (monitor mode)
            events = await env.DB.prepare(`
                SELECT 
                    e.id,
                    e.event_name,
                    e.event_date,
                    e.venue_name,
                    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as total_guests,
                    (SELECT COUNT(*) FROM attendance_logs WHERE event_id = e.id) as checked_in
                FROM events e
                WHERE e.deleted_at IS NULL 
                AND e.status = 'active'
                AND e.event_date >= DATE('now', '-1 day')
                ORDER BY e.event_date ASC
                LIMIT 20
            `).all();
        } else {
            // Agent sees only assigned events
            // TODO: Implement event_agents table for proper assignment
            // For now, return empty until assignment system is built
            events = { results: [] };
        }

        return new Response(JSON.stringify(events.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Agent events error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch events',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

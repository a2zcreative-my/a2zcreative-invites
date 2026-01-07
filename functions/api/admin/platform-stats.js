/**
 * GET /api/admin/platform-stats
 * 
 * Platform-wide statistics for God's Eye dashboard
 * SECURITY: Super Admin only - enforced via requireSuperAdmin()
 */

import { requireAuth, requireSuperAdmin } from '../../lib/auth.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    // Authenticate user
    const { user, userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) {
        return errorResponse;
    }

    // RBAC: Super Admin only
    const roleError = requireSuperAdmin(user);
    if (roleError) {
        return roleError;
    }

    try {
        // Get platform-wide statistics
        const [usersResult, eventsResult, guestsResult, rsvpsResult] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
            env.DB.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM events WHERE deleted_at IS NULL').first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM guests').first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM rsvps WHERE response = "yes"').first(),
        ]);

        // Get recent activity (last 10 events)
        const recentEvents = await env.DB.prepare(`
            SELECT 
                e.event_name,
                e.created_at,
                u.name as creator_name,
                u.email as creator_email
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.deleted_at IS NULL
            ORDER BY e.created_at DESC
            LIMIT 10
        `).all();

        const recentActivity = (recentEvents.results || []).map(event => ({
            type: 'Event Created',
            message: `${event.creator_name || event.creator_email} created "${event.event_name}"`,
            time: new Date(event.created_at).toLocaleString('ms-MY'),
        }));

        return new Response(JSON.stringify({
            totalUsers: usersResult?.count || 0,
            totalEvents: eventsResult?.total || 0,
            activeEvents: eventsResult?.active || 0,
            totalGuests: guestsResult?.count || 0,
            totalRSVPs: rsvpsResult?.count || 0,
            recentActivity,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Platform stats error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch platform stats',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

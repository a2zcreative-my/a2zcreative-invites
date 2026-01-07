/**
 * GET /api/admin/events
 * List all events (admin only)
 * 
 * SECURITY: Requires authentication + admin role verification
 */

import { requireAuth, requireAdmin } from '../../lib/auth.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Authenticate user
    const { userId, errorResponse: authError } = await requireAuth(request, db);
    if (authError) return authError;

    // 2. Verify user is admin
    const adminError = await requireAdmin(db, userId);
    if (adminError) return adminError;

    try {
        const query = `
            SELECT 
                e.id, 
                e.event_name, 
                e.event_date,
                e.start_time,
                e.end_time,
                e.status,
                e.payment_state,
                e.lifecycle_state,
                e.cooldown_until,
                e.disabled_at,
                e.archived_at,
                e.created_at,
                u.name as organizer_name,
                u.email as organizer_email,
                ea.package_id,
                ea.package_name,
                (SELECT COUNT(*) FROM guests g WHERE g.event_id = e.id) as guest_count,
                (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.response = 'yes') as confirmed_count
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN event_access ea ON e.id = ea.event_id
            WHERE e.lifecycle_state IS NULL OR e.lifecycle_state != 'PURGED'
            ORDER BY e.created_at DESC
        `;

        const { results } = await db.prepare(query).all();

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Admin events error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

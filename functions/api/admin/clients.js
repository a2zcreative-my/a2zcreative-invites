/**
 * GET /api/admin/clients
 * List all users (admin only)
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
        // List users with stats and account flags
        const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at,
                (SELECT COUNT(*) FROM events e WHERE e.created_by = u.id) as event_count,
                (SELECT COUNT(*) FROM events e WHERE e.created_by = u.id AND e.payment_state = 'PAID') as paid_event_count,
                af.is_flagged,
                af.is_rate_limited,
                af.is_suspended,
                af.expired_payment_count,
                af.total_payment_attempts
            FROM users u
            LEFT JOIN account_flags af ON af.user_id = u.id
            ORDER BY u.created_at DESC
        `;

        const { results } = await db.prepare(query).all();

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Admin clients error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

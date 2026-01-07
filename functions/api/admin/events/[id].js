
import { requireAuth, requireAdmin } from '../../../lib/auth.js';

/**
 * Handle Admin Event Actions
 * PUT /api/admin/events/[id] - Update status
 * DELETE /api/admin/events/[id] - Soft delete
 */
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const db = env.DB;
    const id = params.id;

    // Auth check
    const { userId, errorResponse } = await requireAuth(request, db);
    if (errorResponse) return errorResponse;
    const adminError = await requireAdmin(db, userId);
    if (adminError) return adminError;

    try {
        const { status } = await request.json();

        // Validate status
        const validStatuses = ['draft', 'active', 'completed', 'archived'];
        if (!validStatuses.includes(status)) {
            return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
        }

        const query = `UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const { success } = await db.prepare(query).bind(status, id).run();

        if (!success) {
            return new Response(JSON.stringify({ error: 'Failed to update event' }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Event status updated' }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { request, env, params } = context;
    const db = env.DB;
    const id = params.id;

    // Auth check
    const { userId, errorResponse } = await requireAuth(request, db);
    if (errorResponse) return errorResponse;
    const adminError = await requireAdmin(db, userId);
    if (adminError) return adminError;

    try {
        // Soft delete
        const query = `UPDATE events SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const { success } = await db.prepare(query).bind(id).run();

        if (!success) {
            return new Response(JSON.stringify({ error: 'Failed to delete event' }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Event deleted successfully' }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

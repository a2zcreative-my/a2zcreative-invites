import { getCurrentUser } from '../../lib/session.js';

/**
 * Session Check API
 * Returns current session status and appropriate redirect
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const user = await getCurrentUser(db, request);

        if (!user) {
            return new Response(JSON.stringify({
                authenticated: false
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Determine redirect based on role
        let redirect = '/dashboard/';

        if (user.role === 'super_admin') {
            redirect = '/admin/';
        } else if (user.role === 'admin') {
            // Check subscription status
            const activeSubscription = await db.prepare(`
                SELECT ea.* FROM event_access ea
                JOIN events e ON ea.event_id = e.id
                WHERE e.created_by = ? 
                AND ea.paid_at IS NOT NULL 
                AND (ea.expires_at IS NULL OR ea.expires_at > CURRENT_TIMESTAMP)
                LIMIT 1
            `).bind(user.id).first();

            if (!activeSubscription) {
                const hasEvents = await db.prepare(
                    "SELECT id FROM events WHERE created_by = ? LIMIT 1"
                ).bind(user.id).first();

                if (!hasEvents) {
                    redirect = '/pricing/';
                }
            }
        }

        return new Response(JSON.stringify({
            authenticated: true,
            redirect: redirect,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Session check error:', error);
        return new Response(JSON.stringify({
            authenticated: false,
            error: 'Session check failed'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

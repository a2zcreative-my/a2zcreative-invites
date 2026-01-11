import { getCurrentUser } from '../../lib/session.js';

/**
 * Session Check API
 * Returns current session status and appropriate redirect
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const sessionResult = await getCurrentUser(db, request);

        if (!sessionResult || !sessionResult.valid) {
            return new Response(JSON.stringify({
                authenticated: false
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = sessionResult.user;

        // Determine redirect based on role
        let redirect = '/pricing/';  // Default for 'user' role

        if (user.role === 'super_admin') {
            redirect = '/admin/';
        } else if (user.role === 'admin') {
            // Paid users go to dashboard
            redirect = '/dashboard/';
        }
        // 'user' role stays at /pricing/

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

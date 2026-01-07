import { destroySession, getSessionToken, createLogoutCookie } from '../../lib/session.js';

/**
 * Logout API Handler
 * Destroys session and clears cookie
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const sessionToken = getSessionToken(request);

        if (sessionToken) {
            await destroySession(db, sessionToken);
        }

        return new Response(JSON.stringify({
            success: true,
            redirect: '/auth/login.html'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': createLogoutCookie()
            }
        });

    } catch (error) {
        console.error('Logout error:', error);
        // Still clear cookie even on error
        return new Response(JSON.stringify({
            success: true,
            redirect: '/auth/login.html'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': createLogoutCookie()
            }
        });
    }
}

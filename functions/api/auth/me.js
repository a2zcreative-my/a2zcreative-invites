
import { getCurrentUser, createSessionCookie } from '../../lib/session.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const sessionResult = await getCurrentUser(db, request);

        if (!sessionResult || !sessionResult.valid) {
            // Return 200 with authenticated: false for public auth status check
            // This is NOT a protected endpoint - it's for checking auth state
            return new Response(JSON.stringify({
                authenticated: false,
                user: null
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');

        // If token was rotated, set the new cookie
        if (sessionResult.newToken && sessionResult.newTokenExpiry) {
            const cookieValue = createSessionCookie(sessionResult.newToken, sessionResult.newTokenExpiry);
            headers.set('Set-Cookie', cookieValue);
        }

        return new Response(JSON.stringify({
            authenticated: true,
            user: sessionResult.user
        }), {
            status: 200,
            headers: headers
        });

    } catch (error) {
        return new Response(JSON.stringify({
            authenticated: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

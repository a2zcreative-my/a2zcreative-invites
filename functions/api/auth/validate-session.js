/**
 * GET /api/auth/validate-session
 * 
 * Internal endpoint for middleware to validate session tokens.
 * Returns user role and ID if session is valid.
 * 
 * SECURITY: Uses D1 session lookup, never trusts client-provided role.
 */

export async function onRequestGet(context) {
    const { request, env } = context;

    // Parse session cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['a2z_session'];

    if (!sessionToken) {
        return new Response(JSON.stringify({
            valid: false,
            error: 'No session token'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // CRITICAL: Role comes from DB via session token, NEVER from client
        const session = await env.DB.prepare(`
            SELECT 
                s.user_id,
                u.email,
                u.name,
                u.role,
                s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();

        if (!session) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Invalid or expired session'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Return session info (role is server-derived, not client-provided)
        return new Response(JSON.stringify({
            valid: true,
            userId: session.user_id,
            email: session.email,
            name: session.name,
            role: session.role,
            expiresAt: session.expires_at
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Session validation error:', error);
        return new Response(JSON.stringify({
            valid: false,
            error: 'Validation failed'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name && rest.length) {
            cookies[name.trim()] = rest.join('=').trim();
        }
    });

    return cookies;
}

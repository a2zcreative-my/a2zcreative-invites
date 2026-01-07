import { verifyPassword, hashPassword, isHashedPassword } from '../../lib/password-utils.js';
import { createSession, createSessionCookie } from '../../lib/session.js';

/**
 * Login API Handler
 * Authenticates user and returns server-driven redirect
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: "Emel dan kata laluan diperlukan"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Query user from D1
        const user = await db.prepare(
            "SELECT id, name, email, password_hash, role FROM users WHERE email = ?"
        ).bind(email).first();

        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: "Emel atau kata laluan tidak sah"
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify password using secure comparison
        const passwordValid = await verifyPassword(password, user.password_hash);

        if (!passwordValid) {
            return new Response(JSON.stringify({
                success: false,
                error: "Emel atau kata laluan tidak sah"
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // If password was plaintext, upgrade to hashed (migration)
        if (!isHashedPassword(user.password_hash)) {
            const newHash = await hashPassword(password);
            await db.prepare(
                "UPDATE users SET password_hash = ? WHERE id = ?"
            ).bind(newHash, user.id).run();
        }

        // Create session
        const session = await createSession(db, user.id);

        // Determine redirect based on role
        let redirect = '/pricing/';  // Default for 'user' role

        if (user.role === 'super_admin') {
            redirect = '/admin/';
        } else if (user.role === 'admin') {
            // Paid users go to dashboard
            redirect = '/dashboard/';
        }
        // 'user' role stays at /pricing/

        // Prepare safe user object (never include password)
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Return success with session cookie
        return new Response(JSON.stringify({
            success: true,
            redirect: redirect,
            role: user.role,
            user: safeUser
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': createSessionCookie(session.token, session.expiresAt)
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: "Ralat pelayan. Sila cuba lagi."
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

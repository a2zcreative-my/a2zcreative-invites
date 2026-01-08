/**
 * Google OAuth Callback Handler
 * Syncs Supabase OAuth user to D1 and creates a D1 session
 */

import { createSession, createSessionCookie } from '../../lib/session.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { access_token } = await request.json();

        if (!access_token) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Access token required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hardcoded Supabase credentials to ensure reliability
        const supabaseUrl = 'https://bzxjsdtkoakscmeuthlu.supabase.co';
        const supabaseAnonKey = 'sb_publishable_ksSZeGQ4toGfqLttrL7Vsw_8Vq2AVxi';

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase configuration (should be hardcoded)');
            return new Response(JSON.stringify({
                success: false,
                error: 'Server configuration error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify the token with Supabase and get user info
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'apikey': supabaseAnonKey
            }
        });

        if (!userResponse.ok) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid or expired token'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabaseUser = await userResponse.json();

        if (!supabaseUser.email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User email not available'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user exists in D1
        let user = await db.prepare(
            "SELECT * FROM users WHERE email = ?"
        ).bind(supabaseUser.email).first();

        if (!user) {
            // Create new user in D1 from OAuth data
            // Default role 'user' until they pay for a package (becomes 'admin')
            const name = supabaseUser.user_metadata?.full_name ||
                supabaseUser.user_metadata?.name ||
                supabaseUser.email.split('@')[0];

            await db.prepare(`
                INSERT INTO users (email, name, password_hash, role, created_at)
                VALUES (?, ?, NULL, 'user', CURRENT_TIMESTAMP)
            `).bind(
                supabaseUser.email,
                name
            ).run();

            user = await db.prepare(
                "SELECT * FROM users WHERE email = ?"
            ).bind(supabaseUser.email).first();
        }
        // Note: We don't update existing users with provider info since those columns don't exist

        // Create D1 session
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

        // Create response with session cookie
        const response = new Response(JSON.stringify({
            success: true,
            redirect,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: supabaseUser.user_metadata?.avatar_url || null
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': createSessionCookie(session.token, session.expiresAt)
            }
        });

        return response;

    } catch (error) {
        console.error('OAuth callback error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Authentication failed'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

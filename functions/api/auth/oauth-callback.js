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

        // Verify the token with Supabase and get user info
        const supabaseUrl = 'https://bzxjsdtkoakscmeuthlu.supabase.co';
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eGpzZHRrb2Frc2NtZXV0aGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MDI1NzIsImV4cCI6MjA0OTA3ODU3Mn0.9QkFiGW1x0Gi8Mx-2t6tBqCbqMwqB4aGdlBXXKpxNNE'
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
            const name = supabaseUser.user_metadata?.full_name ||
                supabaseUser.user_metadata?.name ||
                supabaseUser.email.split('@')[0];

            const result = await db.prepare(`
                INSERT INTO users (email, name, password_hash, role, provider, provider_id, avatar_url, created_at)
                VALUES (?, ?, NULL, 'admin', 'google', ?, ?, CURRENT_TIMESTAMP)
            `).bind(
                supabaseUser.email,
                name,
                supabaseUser.id,
                supabaseUser.user_metadata?.avatar_url || null
            ).run();

            user = await db.prepare(
                "SELECT * FROM users WHERE email = ?"
            ).bind(supabaseUser.email).first();
        } else {
            // Update existing user with provider info if not set
            if (!user.provider) {
                await db.prepare(`
                    UPDATE users SET 
                        provider = 'google',
                        provider_id = ?,
                        avatar_url = COALESCE(avatar_url, ?)
                    WHERE id = ?
                `).bind(
                    supabaseUser.id,
                    supabaseUser.user_metadata?.avatar_url || null,
                    user.id
                ).run();
            }
        }

        // Create D1 session
        const session = await createSession(db, user.id);

        // Determine redirect based on role
        let redirect = '/dashboard/';
        if (user.role === 'super_admin') {
            redirect = '/admin/';
        }

        // Create response with session cookie
        const response = new Response(JSON.stringify({
            success: true,
            redirect,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url || supabaseUser.user_metadata?.avatar_url
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': createSessionCookie(session.token)
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

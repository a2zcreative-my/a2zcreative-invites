import { hashPassword } from '../../lib/password-utils.js';
import { createSession, createSessionCookie } from '../../lib/session.js';
import { sendEmail } from '../../lib/email.js';

/**
 * Register API Handler
 * Creates a new user account and logs them in
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { name, email, password } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: "Nama, emel dan kata laluan diperlukan"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({
                success: false,
                error: "Format emel tidak sah"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate password length
        if (password.length < 6) {
            return new Response(JSON.stringify({
                success: false,
                error: "Kata laluan mestilah sekurang-kurangnya 6 aksara"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if email already exists
        const existingUser = await db.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();

        if (existingUser) {
            return new Response(JSON.stringify({
                success: false,
                error: "Emel ini telah didaftarkan"
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user with 'user' role (unpaid)
        const result = await db.prepare(
            "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'user', datetime('now'))"
        ).bind(name, email, passwordHash).run();

        if (!result.success) {
            throw new Error('Failed to create user');
        }

        // Send Welcome Email
        const welcomeHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #d4af37;">Selamat Datang ke A2Z Creative!</h1>
                <p>Hai ${name},</p>
                <p>Terima kasih kerana mendaftar. Akaun anda telah berjaya dicipta.</p>
                <p>Anda kini boleh mula mencipta jemputan digital profesional untuk majlis anda.</p>
                <br/>
                <a href="https://a2zcreative.my/pricing/" style="background: #d4af37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Cipta Jemputan Sekarang</a>
                <br/><br/>
                <p>Jika anda mempunyai sebarang soalan, sila balas emel ini.</p>
            </div>
        `;

        // Non-blocking email send
        context.waitUntil(sendEmail(env, email, 'Selamat Datang ke A2Z Creative', welcomeHtml));

        // ===========================================
        // SUPABASE SHADOW REGISTRATION (For Password Reset)
        // ===========================================
        try {
            // These environment variables must be set in Cloudflare Dashboard
            if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
                const supabaseResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': env.SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        data: { name: name },
                        options: {
                            emailRedirectTo: 'https://a2zcreative.my/auth/confirmation-success.html'
                        }
                    })
                });

                if (!supabaseResponse.ok) {
                    console.warn('Supabase shadow registration warning:', await supabaseResponse.text());
                }
            } else {
                console.warn('Supabase env vars missing. Skipping shadow registration.');
            }
        } catch (e) {
            console.warn('Supabase sync error (non-blocking):', e);
        }

        const userId = result.meta.last_row_id;

        // Create session for auto-login
        const session = await createSession(db, userId);

        // Return success with session cookie
        return new Response(JSON.stringify({
            success: true,
            message: "Akaun berjaya didaftarkan!",
            redirect: '/pricing/',
            user: {
                id: userId,
                name: name,
                email: email,
                role: 'user'
            }
        }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': createSessionCookie(session.token, session.expiresAt)
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: "Ralat pelayan. Sila cuba lagi."
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

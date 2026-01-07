/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 * Generates a password reset token for the user
 */

import { generateSecureString } from '../../lib/security.js';
import { sendEmail } from '../../lib/email.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Alamat emel diperlukan'
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
                error: 'Format emel tidak sah'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find user by email
        const user = await db.prepare(
            'SELECT id, email, name FROM users WHERE email = ?'
        ).bind(email.toLowerCase().trim()).first();

        // Always return success to prevent email enumeration
        // Even if user doesn't exist, we don't reveal that
        if (!user) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Jika emel wujud dalam sistem, arahan reset telah dihantar.'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate secure reset token
        const resetToken = generateSecureString(32, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');

        // Token expires in 1 hour
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Delete any existing reset tokens for this user
        await db.prepare(
            'DELETE FROM password_resets WHERE user_id = ?'
        ).bind(user.id).run();

        // Store the reset token
        await db.prepare(`
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).bind(user.id, resetToken, expiresAt.toISOString()).run();

        // Send the reset email via Resend
        const baseUrl = new URL(request.url).origin;
        const resetLink = `${baseUrl}/auth/reset-password/?token=${resetToken}`;

        const resetHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #d4af37;">Reset Kata Laluan</h1>
                <p>Hai ${user.name || 'Pengguna'},</p>
                <p>Kami menerima permintaan untuk reset kata laluan anda.</p>
                <p>Sila klik pautan di bawah untuk cipta kata laluan baharu:</p>
                <br/>
                <a href="${resetLink}" style="background: #d4af37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Kata Laluan</a>
                <br/><br/>
                <p style="color: #666; font-size: 0.9em;">Pautan ini akan luput dalam masa 1 jam.</p>
                <p style="color: #666; font-size: 0.9em;">Jika anda tidak meminta ini, sila abaikan emel ini.</p>
            </div>
        `;

        // Send email (awaiting here to ensure delivery, or use waitUntil if preferred)
        await sendEmail(env, email, 'Reset Kata Laluan A2Z Creative', resetHtml); // Sending synchronously to report errors if needed or use waitUntil

        console.log(`[Forgot Password] Reset token generated for ${email}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Jika emel wujud dalam sistem, arahan reset telah dihantar.'
        }), { // Removed debug object for security
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Ralat pelayan. Sila cuba lagi.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

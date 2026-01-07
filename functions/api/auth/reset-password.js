/**
 * Reset Password API
 * POST /api/auth/reset-password
 * Validates token and updates password
 */

import { hashPassword } from '../../lib/password-utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { token, password } = await request.json();

        if (!token) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Token reset diperlukan'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!password || password.length < 6) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Kata laluan mestilah sekurang-kurangnya 6 aksara'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find valid reset token
        const resetRecord = await db.prepare(`
            SELECT pr.*, u.email, u.name
            FROM password_resets pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.token = ? AND pr.expires_at > CURRENT_TIMESTAMP
        `).bind(token).first();

        if (!resetRecord) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Token tidak sah atau telah tamat tempoh. Sila minta token reset baru.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Hash the new password
        const passwordHash = await hashPassword(password);

        // Update user password and delete reset token in a transaction
        await db.batch([
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                .bind(passwordHash, resetRecord.user_id),
            db.prepare('DELETE FROM password_resets WHERE user_id = ?')
                .bind(resetRecord.user_id)
        ]);

        // Also invalidate all existing sessions for security
        await db.prepare('DELETE FROM sessions WHERE user_id = ?')
            .bind(resetRecord.user_id).run();

        console.log(`[Reset Password] Password reset successful for user ${resetRecord.user_id}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Kata laluan berjaya dikemaskini. Sila log masuk dengan kata laluan baru.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Ralat pelayan. Sila cuba lagi.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Validates if a token is still valid
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.DB;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return new Response(JSON.stringify({
            valid: false,
            error: 'Token diperlukan'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const resetRecord = await db.prepare(`
        SELECT pr.expires_at, u.email
        FROM password_resets pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.token = ? AND pr.expires_at > CURRENT_TIMESTAMP
    `).bind(token).first();

    if (!resetRecord) {
        return new Response(JSON.stringify({
            valid: false,
            error: 'Token tidak sah atau telah tamat tempoh'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        valid: true,
        email: resetRecord.email,
        expiresAt: resetRecord.expires_at
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

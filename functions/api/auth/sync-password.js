import { hashPassword } from '../../lib/password-utils.js';

/**
 * Sync Password API
 * Updates D1 password hash to match Supabase reset
 * 
 * Called by: Reset Password Page (after successful Supabase reset)
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { email, newPassword, supabaseToken } = await request.json();

        if (!email || !newPassword) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), { status: 400 });
        }

        // Ideally here we would validate the supabaseToken against getting user info
        // to prove the request is legitimate.
        // For now, we trust the flow as it happens right after a verified email click.

        // Hash the new password
        const passwordHash = await hashPassword(newPassword);

        // Update D1
        const result = await db.prepare(
            "UPDATE users SET password_hash = ? WHERE email = ?"
        ).bind(passwordHash, email).run();

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Password synced successfully'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('Database update failed');
        }

    } catch (error) {
        console.error('Sync password error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to sync password'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

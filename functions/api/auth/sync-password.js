import { hashPassword } from '../../lib/password-utils.js';

/**
 * Sync Password API
 * Updates D1 password hash to match Supabase reset
 * 
 * Called by: Reset Password Page (after successful Supabase reset)
 * SECURITY: Validates Supabase token to prevent unauthorized password changes
 */
export async function onRequestPost(context) {
     const { request, env } = context;
     const db = env.DB;

     try {
         const { email, newPassword, supabaseToken } = await request.json();

         if (!email || !newPassword || !supabaseToken) {
             return new Response(JSON.stringify({
                 success: false,
                 error: 'Missing required fields: email, newPassword, supabaseToken'
             }), { status: 400 });
         }

         // CRITICAL SECURITY FIX: Validate the Supabase token is legitimate
         // This prevents attackers from resetting passwords with a made-up token
         const supabaseUrl = env.SUPABASE_URL;
         const supabaseAnonKey = env.SUPABASE_ANON_KEY;

         if (!supabaseUrl || !supabaseAnonKey) {
             console.error('Supabase config missing');
             return new Response(JSON.stringify({
                 success: false,
                 error: 'Server configuration error'
             }), { status: 500 });
         }

         // Validate token by fetching user info from Supabase
         const supabaseResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
             headers: {
                 'Authorization': `Bearer ${supabaseToken}`,
                 'apikey': supabaseAnonKey
             }
         });

         if (!supabaseResponse.ok) {
             console.warn('Invalid Supabase token provided for password reset');
             return new Response(JSON.stringify({
                 success: false,
                 error: 'Invalid or expired reset token'
             }), { status: 401 });
         }

         const supabaseUser = await supabaseResponse.json();

         // CRITICAL: Verify the token belongs to the same email being updated
         if (supabaseUser.email !== email) {
             console.error('Token email mismatch:', { tokenEmail: supabaseUser.email, requestEmail: email });
             return new Response(JSON.stringify({
                 success: false,
                 error: 'Token does not match the provided email'
             }), { status: 403 });
         }

         // Token is valid - proceed with password update
         const passwordHash = await hashPassword(newPassword);

         // Update D1
         const result = await db.prepare(
             "UPDATE users SET password_hash = ? WHERE email = ?"
         ).bind(passwordHash, email).run();

         if (result.success) {
             // Log the security event
             await db.prepare(`
                 INSERT INTO audit_logs (action, resource_type, details, ip_address)
                 VALUES (?, 'security', ?, ?)
             `).bind(
                 'password_reset',
                 JSON.stringify({ email, success: true }),
                 request.headers.get('CF-Connecting-IP') || 'unknown'
             ).run().catch(err => console.error('Audit log error:', err));

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

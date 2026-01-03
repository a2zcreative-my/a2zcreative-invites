/**
 * Migration Script: D1 Users -> Supabase Auth
 * 
 * Purpose: Import existing users from D1 into Supabase so they can use "Forgot Password".
 * Note: Since we don't have their raw passwords, we create them with a dummy password.
 *       Their real login still works via D1. This just enables the email service.
 * 
 * Usage: POST /api/admin/migrate-users
 *        Body: { "secret": "migration-secret-2026" }
 */
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { secret } = await request.json();

        // Simple protection
        if (secret !== 'migration-secret-2026') {
            return new Response('Unauthorized', { status: 401 });
        }

        const db = env.DB;

        // 1. Get all users from D1
        const { results: users } = await db.prepare("SELECT * FROM users").all();

        const report = {
            total: users.length,
            success: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };

        // 2. Loop and creating in Supabase
        for (const user of users) {
            // Generate a random secure dummy password for Supabase
            // (User will never validly use this, they will rely on D1 valdiation or reset it)
            const dummyPassword = `Migrated_${Date.now()}_${Math.random().toString(36).slice(-8)}`;

            try {
                const response = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': env.SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        email: user.email,
                        password: dummyPassword,
                        data: { name: user.name, migrated: true }
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    report.success++;
                } else {
                    // If error is "User already registered", that's fine/skipped
                    if (data.msg?.includes('already registered') || data.error_description?.includes('already registered')) {
                        report.skipped++;
                    } else {
                        report.failed++;
                        report.errors.push(`${user.email}: ${data.msg || data.error_description || 'Unknown error'}`);
                    }
                }

            } catch (err) {
                report.failed++;
                report.errors.push(`${user.email}: Network/Exception error`);
            }
        }

        return new Response(JSON.stringify(report, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

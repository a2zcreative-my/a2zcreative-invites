export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: "Missing credentials" }), { status: 400 });
        }

        // Query user from D1
        // Note: hashing is recommended in production, but for this specific request 
        // we are matching the plain text stored in seed.sql
        const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

        if (!user) {
            return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
        }

        // Check password (simple comparison for now as requested)
        // In prod: await bcrypt.compare(password, user.password_hash)
        if (user.password_hash !== password) {
            return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
        }

        // Success - return user info (excluding password)
        const { password_hash, ...safeUser } = user;

        return new Response(JSON.stringify({
            user: safeUser,
            token: "d1_session_" + Date.now() // Mock token for client-side storage
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

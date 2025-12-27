export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // 2. Authentication
    const authHeader = request.headers.get("Authorization");
    // Note: For Pages, env vars are set in the Dashboard (Settings -> Environment variables)
    // We cannot set them in wrangler.toml for Pages the same way.
    // We will assume ADMIN_PASSWORD is set there.
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    // 3. Database Query
    try {
        // Ensure the DB binding is named 'DB' in Pages settings manually
        const result = await env.DB.prepare("SELECT * FROM clients ORDER BY id ASC").all();
        return new Response(JSON.stringify(result.results), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

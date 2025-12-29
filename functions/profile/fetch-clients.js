export async function onRequest(context) {
    const { request, env } = context;

    // Authentication
    const authHeader = request.headers.get("Authorization");
    // Note: For Pages, env vars are set in the Dashboard (Settings -> Environment variables)
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Database Query
    try {
        const result = await env.DB.prepare("SELECT * FROM clients ORDER BY id ASC").all();
        return new Response(JSON.stringify(result.results), {
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

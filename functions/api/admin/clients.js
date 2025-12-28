export async function onRequestGet(context) {
    const { env } = context;
    const db = env.DB;

    try {
        // List users with simple stats
        // Assuming we join with events to get a count
        const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at,
                (SELECT COUNT(*) FROM events e WHERE e.created_by = u.id) as event_count
            FROM users u
            ORDER BY u.created_at DESC
        `;

        const { results } = await db.prepare(query).all();

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

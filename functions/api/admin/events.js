export async function onRequestGet(context) {
    const { env } = context;
    const db = env.DB;

    try {
        const query = `
            SELECT 
                e.id, 
                e.event_name, 
                e.event_date,
                e.status,
                e.created_at,
                u.name as organizer_name,
                u.email as organizer_email,
                (SELECT COUNT(*) FROM guests g WHERE g.event_id = e.id) as guest_count
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            ORDER BY e.created_at DESC
        `;

        const { results } = await db.prepare(query).all();

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

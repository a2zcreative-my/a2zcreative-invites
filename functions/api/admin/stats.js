export async function onRequestGet(context) {
    const { env } = context;
    const db = env.DB;

    // TODO: Add Auth Check (Verify if user is super_admin)

    try {
        // Parallelize queries for performance
        const [
            usersResult,
            eventsResult,
            guestsResult
        ] = await Promise.all([
            db.prepare("SELECT COUNT(*) as count FROM users").first(),
            db.prepare("SELECT status, COUNT(*) as count FROM events GROUP BY status").all(),
            db.prepare("SELECT COUNT(*) as count FROM guests").first()
        ]);

        // Process event counts
        let totalEvents = 0;
        const eventsByStatus = {
            draft: 0,
            active: 0,
            completed: 0,
            archived: 0
        };

        eventsResult.results.forEach(row => {
            eventsByStatus[row.status] = row.count;
            totalEvents += row.count;
        });

        // Recent activity (mocked or simple query)
        // For now, let's just get the 5 most recently created events
        const recentEvents = await db.prepare(`
            SELECT e.id, e.event_name, e.created_at, u.name as created_by_name
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            ORDER BY e.created_at DESC
            LIMIT 5
        `).all();

        return new Response(JSON.stringify({
            stats: {
                total_users: usersResult.count,
                total_events: totalEvents,
                total_guests: guestsResult.count,
                events_by_status: eventsByStatus
            },
            recent_activity: recentEvents.results
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

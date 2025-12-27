/**
 * GET /api/guests - List guests for an event
 * GET /api/guests/search - Search guests
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const eventId = url.searchParams.get('event_id') || 1;
    const search = url.searchParams.get('q');

    try {
        let query;
        let bindings;

        if (search) {
            // Search by name or phone
            query = `
                SELECT 
                    g.id, g.name, g.phone, g.pax, g.checkin_token,
                    r.response, r.arrival_time, r.message,
                    al.check_in_time IS NOT NULL as checked_in
                FROM guests g
                LEFT JOIN rsvps r ON g.id = r.guest_id
                LEFT JOIN attendance_logs al ON g.id = al.guest_id AND g.event_id = al.event_id
                WHERE g.event_id = ? 
                AND (g.name LIKE ? OR g.phone LIKE ?)
                ORDER BY g.created_at DESC
            `;
            bindings = [eventId, `%${search}%`, `%${search}%`];
        } else {
            query = `
                SELECT 
                    g.id, g.name, g.phone, g.pax, g.checkin_token,
                    r.response, r.arrival_time, r.message,
                    al.check_in_time IS NOT NULL as checked_in
                FROM guests g
                LEFT JOIN rsvps r ON g.id = r.guest_id
                LEFT JOIN attendance_logs al ON g.id = al.guest_id AND g.event_id = al.event_id
                WHERE g.event_id = ?
                ORDER BY g.created_at DESC
            `;
            bindings = [eventId];
        }

        const stmt = env.DB.prepare(query);
        const result = await stmt.bind(...bindings).all();

        return new Response(JSON.stringify(result.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching guests:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch guests',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

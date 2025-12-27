/**
 * GET /api/messages/[slug]
 * Fetch guest messages/wishes for an event
 * 
 * POST /api/messages/[slug]
 * Add a new guest message
 */

export async function onRequestGet(context) {
    const { params, env } = context;
    const slug = params.slug;

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Get event ID from slug
        const invitation = await env.DB.prepare(`
            SELECT event_id FROM invitations WHERE public_slug = ?
        `).bind(slug).first();

        if (!invitation) {
            return new Response(JSON.stringify({ error: 'Invitation not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get approved messages
        const result = await env.DB.prepare(`
            SELECT guest_name, message, created_at
            FROM guest_messages
            WHERE event_id = ? AND is_approved = 1
            ORDER BY created_at DESC
            LIMIT 50
        `).bind(invitation.event_id).all();

        return new Response(JSON.stringify(result.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch messages',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { params, request, env } = context;
    const slug = params.slug;

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { name, message } = data;

    if (!slug || !name || !message) {
        return new Response(JSON.stringify({
            error: 'Missing required fields',
            required: ['name', 'message']
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Get event ID from slug
        const invitation = await env.DB.prepare(`
            SELECT event_id FROM invitations WHERE public_slug = ?
        `).bind(slug).first();

        if (!invitation) {
            return new Response(JSON.stringify({ error: 'Invitation not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert message
        await env.DB.prepare(`
            INSERT INTO guest_messages (event_id, guest_name, message)
            VALUES (?, ?, ?)
        `).bind(invitation.event_id, name.trim(), message.trim()).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Message added successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error adding message:', error);
        return new Response(JSON.stringify({
            error: 'Failed to add message',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

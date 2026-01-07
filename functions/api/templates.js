/**
 * Template API for user invitation templates
 * 
 * GET /api/templates - List user's templates
 * POST /api/templates - Create a new template
 * 
 * SECURITY: Requires authentication, templates are filtered by user_id
 */

import { requireAuth } from '../lib/auth.js';

/**
 * GET /api/templates - List templates for authenticated user
 */
export async function onRequestGet(context) {
    const { request, env } = context;

    // 1. Authenticate user
    const { userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) return errorResponse;

    const url = new URL(request.url);
    const eventTypeId = url.searchParams.get('event_type_id');

    try {
        let query;
        let bindings;

        if (eventTypeId) {
            // Filter by event type
            query = `
                SELECT id, name, event_type_id, theme, is_default, created_at, updated_at
                FROM templates
                WHERE user_id = ? AND event_type_id = ?
                ORDER BY is_default DESC, updated_at DESC
            `;
            bindings = [userId, eventTypeId];
        } else {
            // Get all user's templates
            query = `
                SELECT id, name, event_type_id, theme, is_default, created_at, updated_at
                FROM templates
                WHERE user_id = ?
                ORDER BY updated_at DESC
            `;
            bindings = [userId];
        }

        const result = await env.DB.prepare(query).bind(...bindings).all();

        return new Response(JSON.stringify(result.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching templates:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch templates',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/templates - Create a new template
 */
export async function onRequestPost(context) {
    const { request, env } = context;

    // 1. Authenticate user
    const { userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) return errorResponse;

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { name, eventTypeId, theme, templateData, isDefault } = data;

    if (!name || !templateData) {
        return new Response(JSON.stringify({
            error: 'Missing required fields',
            required: ['name', 'templateData']
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // If setting as default, unset other defaults for this event type
        if (isDefault && eventTypeId) {
            await env.DB.prepare(`
                UPDATE templates 
                SET is_default = 0 
                WHERE user_id = ? AND event_type_id = ?
            `).bind(userId, eventTypeId).run();
        }

        // Insert new template (user_id from JWT, not from request)
        const result = await env.DB.prepare(`
            INSERT INTO templates (user_id, name, event_type_id, theme, template_data, is_default)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            userId,  // ✅ SECURE: userId from JWT
            name,
            eventTypeId || null,
            theme || 'elegant-gold',
            typeof templateData === 'string' ? templateData : JSON.stringify(templateData),
            isDefault ? 1 : 0
        ).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Template created successfully',
            templateId: result.meta?.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating template:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create template',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

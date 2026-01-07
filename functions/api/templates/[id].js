/**
 * Template API for single template operations
 * 
 * GET /api/templates/[id] - Get template details
 * PUT /api/templates/[id] - Update a template
 * DELETE /api/templates/[id] - Delete a template
 * 
 * SECURITY: Requires authentication + ownership verification
 */

import { requireAuth } from '../../lib/auth.js';
import { validateNumericId, validationErrorResponse } from '../../lib/input-validation.js';

/**
 * Verify user owns a specific template
 */
async function verifyTemplateOwnership(db, templateId, userId) {
    if (!templateId || !userId) return null;

    const template = await db.prepare(`
        SELECT id, user_id FROM templates WHERE id = ? AND user_id = ?
    `).bind(templateId, userId).first();

    return template;
}

/**
 * GET /api/templates/[id] - Get single template with full data
 */
export async function onRequestGet(context) {
     const { request, params, env } = context;
     const templateId = params.id;

     // SECURITY FIX: Validate template ID format
     const idValidation = validateNumericId(templateId, 'Template ID');
     if (!idValidation.valid) {
         return validationErrorResponse(idValidation.error);
     }

     // 1. Authenticate user
     const { userId, errorResponse } = await requireAuth(request, env.DB);
     if (errorResponse) return errorResponse;

     try {
        // 2. Get template and verify ownership in one query
        const template = await env.DB.prepare(`
            SELECT * FROM templates WHERE id = ? AND user_id = ?
        `).bind(templateId, userId).first();

        if (!template) {
            return new Response(JSON.stringify({
                error: 'Template not found or access denied'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse template_data if it's a string
        let templateData = template.template_data;
        try {
            if (typeof templateData === 'string') {
                templateData = JSON.parse(templateData);
            }
        } catch (e) {
            // Keep as string if parsing fails
        }

        return new Response(JSON.stringify({
            ...template,
            template_data: templateData
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

     } catch (error) {
         console.error('Error fetching template:', error);
         return new Response(JSON.stringify({
             error: 'Failed to fetch template'
         }), {
             status: 500,
             headers: { 'Content-Type': 'application/json' }
         });
     }
}

/**
 * PUT /api/templates/[id] - Update a template
 */
export async function onRequestPut(context) {
     const { request, params, env } = context;
     const templateId = params.id;

     // SECURITY FIX: Validate template ID format
     const idValidation = validateNumericId(templateId, 'Template ID');
     if (!idValidation.valid) {
         return validationErrorResponse(idValidation.error);
     }

    // 1. Authenticate user
    const { userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) return errorResponse;

    // 2. Verify ownership
    const template = await verifyTemplateOwnership(env.DB, templateId, userId);
    if (!template) {
        return new Response(JSON.stringify({
            error: 'Template not found or access denied'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

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

    try {
        // If setting as default, unset other defaults for this event type
        if (isDefault && eventTypeId) {
            await env.DB.prepare(`
                UPDATE templates 
                SET is_default = 0 
                WHERE user_id = ? AND event_type_id = ? AND id != ?
            `).bind(userId, eventTypeId, templateId).run();
        }

        // Build update query dynamically based on provided fields
        const updates = [];
        const bindings = [];

        if (name !== undefined) {
            updates.push('name = ?');
            bindings.push(name);
        }
        if (eventTypeId !== undefined) {
            updates.push('event_type_id = ?');
            bindings.push(eventTypeId);
        }
        if (theme !== undefined) {
            updates.push('theme = ?');
            bindings.push(theme);
        }
        if (templateData !== undefined) {
            updates.push('template_data = ?');
            bindings.push(typeof templateData === 'string' ? templateData : JSON.stringify(templateData));
        }
        if (isDefault !== undefined) {
            updates.push('is_default = ?');
            bindings.push(isDefault ? 1 : 0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        bindings.push(templateId);
        bindings.push(userId);  // Extra safety: include userId in WHERE

        await env.DB.prepare(`
            UPDATE templates 
            SET ${updates.join(', ')}
            WHERE id = ? AND user_id = ?
        `).bind(...bindings).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Template updated successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

     } catch (error) {
         console.error('Error updating template:', error);
         return new Response(JSON.stringify({
             error: 'Failed to update template'
         }), {
             status: 500,
             headers: { 'Content-Type': 'application/json' }
         });
     }
}

/**
 * DELETE /api/templates/[id] - Delete a template
 */
export async function onRequestDelete(context) {
     const { request, params, env } = context;
     const templateId = params.id;

     // SECURITY FIX: Validate template ID format
     const idValidation = validateNumericId(templateId, 'Template ID');
     if (!idValidation.valid) {
         return validationErrorResponse(idValidation.error);
     }

    // 1. Authenticate user
    const { userId, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) return errorResponse;

    // 2. Verify ownership
    const template = await verifyTemplateOwnership(env.DB, templateId, userId);
    if (!template) {
        return new Response(JSON.stringify({
            error: 'Template not found or access denied'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Delete template (with userId in WHERE for extra safety)
        await env.DB.prepare(`
            DELETE FROM templates WHERE id = ? AND user_id = ?
        `).bind(templateId, userId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Template deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

     } catch (error) {
         console.error('Error deleting template:', error);
         return new Response(JSON.stringify({
             error: 'Failed to delete template'
         }), {
             status: 500,
             headers: { 'Content-Type': 'application/json' }
         });
     }
}

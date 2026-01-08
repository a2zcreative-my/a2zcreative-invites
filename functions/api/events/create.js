/**
 * Event Create API
 * POST /api/events/create - Create a new event draft
 */

import { getCurrentUser } from '../../lib/session.js';

// Strict Plan Availability Rules (Must match frontend)
const PLAN_AVAILABILITY = {
    wedding: ['free', 'basic', 'premium'],
    birthday: ['free', 'basic', 'premium'],
    family: ['free', 'basic', 'premium'],
    business: ['free', 'basic', 'business'],
    community: ['free', 'basic', 'business']
};

// Plan Entitlements (Server-side 'Truth')
const PLAN_ENTITLEMENTS = {
    free: { guest_limit: 10, view_limit: 50, has_watermark: 1 },
    basic: { guest_limit: 100, view_limit: 500, has_watermark: 0 },
    premium: { guest_limit: 300, view_limit: 2000, has_watermark: 0 },
    business: { guest_limit: 1000, view_limit: 10000, has_watermark: 0 }
};

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Auth Check
    const user = await getCurrentUser(db, request);
    if (!user) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Sila log masuk untuk mencipta jemputan'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }

    const { eventType, planId } = data;

    // 2. Validate Inputs
    if (!eventType || !planId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Sila pilih jenis majlis dan pakej'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Strict Rule Enforcement
    const allowedPlans = PLAN_AVAILABILITY[eventType];
    if (!allowedPlans) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Jenis majlis tidak sah'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!allowedPlans.includes(planId)) {
        return new Response(JSON.stringify({
            success: false,
            error: `Pakej '${planId}' tidak tersedia untuk majlis '${eventType}'`
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Generate Draft Slug (Temporary)
    // Use random string + timestamp to ensure uniqueness
    const randomStr = crypto.randomUUID().split('-')[0];
    const slug = `draft-${randomStr}-${Date.now()}`;

    try {
        // 5. Create Event (Draft Status)
        const result = await db.prepare(`
            INSERT INTO events (
                event_name,
                slug,
                event_type_id,
                created_by,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP)
        `).bind(
            'Majlis Baru', // Default name
            slug,
            eventType,
            user.id
        ).run();

        const eventId = result.meta?.last_row_id;
        if (!eventId) throw new Error('Failed to create event record');

        // 6. Set Entitlements in event_access
        const limits = PLAN_ENTITLEMENTS[planId];
        await db.prepare(`
            INSERT INTO event_access (
                event_id,
                package_id,
                guest_limit,
                view_limit,
                has_watermark
            ) VALUES (?, ?, ?, ?, ?)
        `).bind(
            eventId,
            planId,
            limits.guest_limit,
            limits.view_limit,
            limits.has_watermark
        ).run();

        // 7. Initialize Metadata (Empty but ready)
        await db.prepare(`
            INSERT INTO event_metadata (event_id) VALUES (?)
        `).bind(eventId).run();

        // 8. Audit Log
        await db.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'event_created', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ userId: user.id, planId, eventType }),
            request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();

        return new Response(JSON.stringify({
            success: true,
            eventId,
            slug,
            redirect: `/dashboard/edit/${slug}` // Future proofing
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create event error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Gagal mencipta jemputan. Sila cuba lagi.',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/user/subscription - Get current user's subscription status
 * POST /api/user/subscription - Activate/upgrade subscription
 */

import { getAuthUser, syncUserToD1 } from '../../lib/auth.js';

// Package to event type mapping
const PACKAGE_EVENT_TYPES = {
    'free': [1],              // Wedding only (1 free event)
    'basic': [1, 2, 3, 4, 5], // ALL 5 types
    'premium': [1, 3, 4],     // Wedding, Family, Birthday
    'business': [2, 5]        // Corporate, Community
};

// Package limits
const PACKAGE_LIMITS = {
    'free': { events: 1, guests: 10, views: 50 },
    'basic': { events: 3, guests: 100, views: 500 },
    'premium': { events: 10, guests: 300, views: 2000 },
    'business': { events: 50, guests: 1000, views: 10000 }
};

export async function onRequestGet(context) {
    const { request, env } = context;

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Please log in to view subscription'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const userId = await syncUserToD1(env.DB, authUser);

        // Get user's subscription info
        const user = await env.DB.prepare(`
            SELECT 
                id, email, name, role,
                active_package_id,
                subscription_expires_at,
                events_remaining
            FROM users WHERE id = ?
        `).bind(userId).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const packageId = user.active_package_id || 'free';
        const limits = PACKAGE_LIMITS[packageId] || PACKAGE_LIMITS['free'];

        // Count user's existing events
        const eventCount = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM events WHERE created_by = ? AND deleted_at IS NULL
        `).bind(userId).first();

        const response = {
            package_id: packageId,
            package_name: packageId.charAt(0).toUpperCase() + packageId.slice(1),
            expires_at: user.subscription_expires_at,
            events_remaining: user.events_remaining ?? limits.events,
            events_created: eventCount?.count || 0,
            allowed_event_types: PACKAGE_EVENT_TYPES[packageId] || [1],
            limits: limits,
            is_active: !user.subscription_expires_at || new Date(user.subscription_expires_at) > new Date()
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching subscription:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch subscription',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Please log in to manage subscription'
        }), {
            status: 401,
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

    try {
        const userId = await syncUserToD1(env.DB, authUser);
        const packageId = data.package_id;

        if (!PACKAGE_LIMITS[packageId]) {
            return new Response(JSON.stringify({ error: 'Invalid package' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // For free package, activate immediately
        if (packageId === 'free') {
            await env.DB.prepare(`
                UPDATE users 
                SET active_package_id = ?,
                    events_remaining = ?,
                    subscription_created_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(packageId, PACKAGE_LIMITS[packageId].events, userId).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'Free trial activated',
                package_id: packageId,
                redirect: '/create/'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // For paid packages, redirect to payment
        return new Response(JSON.stringify({
            success: true,
            requires_payment: true,
            package_id: packageId,
            amount: PACKAGE_LIMITS[packageId] === 'basic' ? 4900 :
                packageId === 'premium' ? 9900 : 19900,
            redirect: `/pricing/checkout/?package=${packageId}`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating subscription:', error);
        return new Response(JSON.stringify({
            error: 'Failed to update subscription',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Export package constants for use in other modules
export { PACKAGE_EVENT_TYPES, PACKAGE_LIMITS };

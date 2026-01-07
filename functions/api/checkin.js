/**
 * Check-in API with access control
 * POST /api/checkin - Record guest check-in (token-based)
 * GET /api/checkin - Get check-in stats (requires auth + ownership)
 * 
 * SECURITY: POST uses token, GET requires authentication + ownership
 */

import { checkAccess } from '../lib/access-control.js';
import { getClientIP, errorResponse, successResponse } from '../lib/security.js';
import { requireAuth, requireEventOwnership } from '../lib/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const clientIP = getClientIP(request);

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return errorResponse('Invalid JSON body', 400);
    }

    const { token, method = 'qr_scan' } = data;

    if (!token) {
        return errorResponse('Check-in token is required', 400);
    }

    try {
        // Find guest by token
        const guest = await env.DB.prepare(`
            SELECT g.*, e.event_name, e.id as event_id
            FROM guests g
            JOIN events e ON g.event_id = e.id
            WHERE g.checkin_token = ?
        `).bind(token).first();

        if (!guest) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Token tidak sah',
                errorMs: 'Token tidak dijumpai'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if check-in is enabled for this event
        const accessCheck = await checkAccess(env, guest.event_id, 'checkin');
        if (!accessCheck.allowed) {
            return new Response(JSON.stringify({
                error: accessCheck.reasonMs || accessCheck.reason,
                code: accessCheck.code,
                requiredPackage: accessCheck.requiredPackage
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if already checked in
        const existingCheckin = await env.DB.prepare(`
            SELECT id, check_in_time FROM attendance_logs
            WHERE guest_id = ? AND event_id = ?
        `).bind(guest.id, guest.event_id).first();

        if (existingCheckin) {
            return new Response(JSON.stringify({
                success: false,
                alreadyCheckedIn: true,
                error: 'Tetamu sudah check-in',
                checkedInAt: existingCheckin.check_in_time,
                guest: {
                    name: guest.name,
                    pax: guest.pax
                }
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Record check-in
        await env.DB.prepare(`
            INSERT INTO attendance_logs (event_id, guest_id, check_in_method, checked_in_by)
            VALUES (?, ?, ?, 1)
        `).bind(guest.event_id, guest.id, method).run();

        // Log audit
        await env.DB.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'guest_checked_in', ?, ?)
        `).bind(
            guest.event_id,
            JSON.stringify({ guestId: guest.id, guestName: guest.name, pax: guest.pax, method }),
            clientIP
        ).run();

        return successResponse({
            success: true,
            message: 'Check-in berjaya!',
            guest: {
                id: guest.id,
                name: guest.name,
                pax: guest.pax,
                phone: guest.phone
            },
            event: {
                name: guest.event_name
            }
        });

    } catch (error) {
        console.error('Check-in error:', error);
        return errorResponse('Failed to process check-in', 500);
    }
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const eventId = url.searchParams.get('event_id');

    if (!eventId) {
        return errorResponse('Event ID is required', 400);
    }

    // 1. Authenticate user
    const { userId, errorResponse: authError } = await requireAuth(request, env.DB);
    if (authError) return authError;

    // 2. Verify user owns this event
    const ownershipError = await requireEventOwnership(env.DB, eventId, userId);
    if (ownershipError) return ownershipError;

    try {
        // Get stats
        const stats = await env.DB.prepare(`
            SELECT 
                COUNT(DISTINCT g.id) as totalGuests,
                COALESCE(SUM(g.pax), 0) as totalPax,
                COUNT(DISTINCT al.guest_id) as checkedInGuests,
                COALESCE(SUM(CASE WHEN al.id IS NOT NULL THEN g.pax ELSE 0 END), 0) as checkedInPax
            FROM guests g
            LEFT JOIN attendance_logs al ON g.id = al.guest_id AND g.event_id = al.event_id
            WHERE g.event_id = ?
        `).bind(eventId).first();

        // Get recent check-ins
        const recentCheckins = await env.DB.prepare(`
            SELECT 
                g.name, g.pax, al.check_in_time
            FROM attendance_logs al
            JOIN guests g ON al.guest_id = g.id
            WHERE al.event_id = ?
            ORDER BY al.check_in_time DESC
            LIMIT 10
        `).bind(eventId).all();

        const percentage = stats.totalGuests > 0
            ? Math.round((stats.checkedInGuests / stats.totalGuests) * 100)
            : 0;

        return successResponse({
            stats: {
                totalGuests: stats.totalGuests || 0,
                totalPax: stats.totalPax || 0,
                checkedInGuests: stats.checkedInGuests || 0,
                checkedInPax: stats.checkedInPax || 0,
                percentage
            },
            recentCheckins: recentCheckins.results || []
        });

    } catch (error) {
        console.error('Check-in stats error:', error);
        return errorResponse('Failed to get check-in stats', 500);
    }
}

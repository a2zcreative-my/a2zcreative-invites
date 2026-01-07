/**
 * GET /api/export/guests
 * Export guest list with security checks
 * 
 * SECURITY: Requires authentication + event ownership verification
 */

import { checkRateLimit, getClientIP, errorResponse } from '../../lib/security.js';
import { checkAccess } from '../../lib/access-control.js';
import { requireAuth, requireEventOwnership } from '../../lib/auth.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const eventId = url.searchParams.get('event_id');
    const format = url.searchParams.get('format') || 'csv';
    const clientIP = getClientIP(request);

    if (!eventId) {
        return errorResponse('Event ID is required', 400);
    }

    // 1. Authenticate user
    const { userId, errorResponse: authError } = await requireAuth(request, env.DB);
    if (authError) return authError;

    // 2. Verify user owns this event
    const ownershipError = await requireEventOwnership(env.DB, eventId, userId);
    if (ownershipError) return ownershipError;

    // Rate limiting for exports
    const rateCheck = checkRateLimit(clientIP, 'export');
    if (!rateCheck.allowed) {
        return errorResponse(rateCheck.message, 429, 'RATE_LIMITED');
    }

    // Check access - export requires premium
    const accessCheck = await checkAccess(env, eventId, 'export');
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

    try {
        // Get all guests with RSVP and check-in data
        const guests = await env.DB.prepare(`
            SELECT 
                g.id,
                g.name,
                g.phone,
                g.email,
                g.pax,
                r.response,
                r.arrival_time,
                r.message as wishes,
                r.responded_at,
                al.check_in_time,
                al.check_in_method
            FROM guests g
            LEFT JOIN rsvps r ON g.id = r.guest_id
            LEFT JOIN attendance_logs al ON g.id = al.guest_id AND g.event_id = al.event_id
            WHERE g.event_id = ?
            ORDER BY g.name
        `).bind(eventId).all();

        const data = guests.results || [];

        // Log export
        await env.DB.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'data_exported', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ format, recordCount: data.length, userId }),
            clientIP
        ).run();

        if (format === 'json') {
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="guests.json"'
                }
            });
        }

        // Generate CSV
        const statusLabels = {
            'yes': 'Akan Hadir',
            'no': 'Tidak Hadir',
            'maybe': 'Belum Pasti'
        };

        const headers = [
            'Nama',
            'Telefon',
            'Email',
            'Status RSVP',
            'Bilangan Pax',
            'Waktu Ketibaan',
            'Ucapan',
            'Tarikh RSVP',
            'Status Check-in',
            'Waktu Check-in'
        ];

        const rows = data.map(g => [
            g.name || '',
            g.phone || '',
            g.email || '',
            statusLabels[g.response] || 'Tidak Diketahui',
            g.pax || 0,
            g.arrival_time || '',
            (g.wishes || '').replace(/"/g, '""'),
            g.responded_at || '',
            g.check_in_time ? 'Sudah Check-in' : 'Belum Check-in',
            g.check_in_time || ''
        ]);

        // Build CSV with BOM for Excel compatibility
        const csv = '\ufeff' + [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\r\n');

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="senarai-tetamu.csv"'
            }
        });

    } catch (error) {
        console.error('Error exporting guests:', error);
        return errorResponse('Failed to export guests', 500);
    }
}

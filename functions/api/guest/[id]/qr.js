/**
 * GET /api/guest/:id/qr
 * Generate QR code for guest check-in (with access control)
 */

import { checkAccess } from '../../../lib/access-control.js';
import { errorResponse } from '../../../lib/security.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const guestId = params.id;

    if (!guestId) {
        return errorResponse('Guest ID is required', 400);
    }

    try {
        // Get guest and event info
        const guest = await env.DB.prepare(`
            SELECT g.*, e.id as event_id
            FROM guests g
            JOIN events e ON g.event_id = e.id
            WHERE g.id = ?
        `).bind(guestId).first();

        if (!guest) {
            return errorResponse('Guest not found', 404);
        }

        if (!guest.checkin_token) {
            return errorResponse('No check-in token available for this guest', 400);
        }

        // Check if QR is enabled for this event
        const accessCheck = await checkAccess(env, guest.event_id, 'qr');
        if (!accessCheck.allowed) {
            return new Response(JSON.stringify({
                error: accessCheck.reasonMs || accessCheck.reason,
                code: accessCheck.code,
                requiredPackage: accessCheck.requiredPackage,
                upgradeUrl: `/pricing/?event_id=${guest.event_id}`
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate QR code using external API
        const qrData = `a2z://checkin/${guest.checkin_token}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=svg`;

        // Fetch the QR code
        const qrResponse = await fetch(qrUrl);

        if (!qrResponse.ok) {
            return errorResponse('Failed to generate QR code', 500);
        }

        const qrSvg = await qrResponse.text();

        return new Response(qrSvg, {
            status: 200,
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        console.error('Error generating QR:', error);
        return errorResponse('Failed to generate QR code', 500);
    }
}

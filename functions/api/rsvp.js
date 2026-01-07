/**
 * POST /api/rsvp
 * Submit RSVP response with security checks
 */

import {
     checkRateLimit,
     checkRateLimitMulti,
     getClientIP,
     validateRsvpSubmission,
     sanitizeInput,
     logSecurityEvent,
     errorResponse,
     successResponse,
     generateSecureString
} from '../lib/security.js';
import { checkAccess, incrementUsage } from '../lib/access-control.js';

const CHECKIN_TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const CHECKIN_TOKEN_LENGTH = 12;

export async function onRequestPost(context) {
     const { request, env } = context;
     const clientIP = getClientIP(request);

     let data;
     try {
         data = await request.json();
     } catch (e) {
         return errorResponse('Invalid JSON body', 400);
     }

     // Validate required fields early for rate limiting context
     const { slug, name, phone, attendance } = data;

    if (!slug || !name || !phone || !attendance) {
        return errorResponse('Missing required fields', 400);
    }

    // Sanitize inputs
    const cleanName = sanitizeInput(name);
    const cleanPhone = sanitizeInput(phone);
    const cleanWishes = sanitizeInput(data.wishes || '');

    // Validate RSVP data
    const validation = validateRsvpSubmission({
        name: cleanName,
        phone: cleanPhone,
        response: attendance,
        message: cleanWishes
    }, clientIP);

    if (!validation.valid) {
        return errorResponse(validation.errors.join(', '), 400, 'VALIDATION_ERROR');
    }

    if (!['yes', 'no', 'maybe'].includes(attendance)) {
        return errorResponse('Invalid attendance value', 400);
    }

     try {
         // Get event ID from invitation slug
         const invitation = await env.DB.prepare(`
             SELECT i.event_id, i.is_active, e.status
             FROM invitations i
             JOIN events e ON i.event_id = e.id
             WHERE i.public_slug = ?
         `).bind(slug).first();

         if (!invitation) {
             return errorResponse('Invitation not found', 404);
         }

         if (!invitation.is_active) {
             return errorResponse('This invitation is no longer active', 403);
         }

         const eventId = invitation.event_id;

         // CRITICAL FIX: Multi-factor rate limiting (IP + event + phone)
         // This prevents distributed attacks and phone enumeration
         const rateCheck = checkRateLimitMulti({
             ip: clientIP,
             eventId: eventId,
             phone: phone,
             action: 'rsvp'
         });

         if (!rateCheck.allowed) {
             await logSecurityEvent(env, 'rate_limit_exceeded', {
                 ip: clientIP,
                 eventId: eventId,
                 phone: phone,
                 action: 'rsvp',
                 limitedBy: rateCheck.limitedBy,
                 message: rateCheck.message
             });
             return errorResponse(rateCheck.message, 429, 'RATE_LIMITED');
         }

        // Check event access (RSVP limits)
        const accessCheck = await checkAccess(env, eventId, 'rsvp');
        if (!accessCheck.allowed) {
            return errorResponse(
                accessCheck.reasonMs || accessCheck.reason,
                403,
                accessCheck.code
            );
        }

        const pax = attendance === 'yes' ? Math.min(data.pax || 1, 10) : 0; // Max 10 pax
        const arrivalTime = data.arrivalTime || null;

        // Check if guest already exists (by phone)
        const existingGuest = await env.DB.prepare(`
            SELECT id, checkin_token FROM guests WHERE event_id = ? AND phone = ?
        `).bind(eventId, cleanPhone).first();

        let guestId;
        let checkinToken;
        let isNewGuest = false;

        if (existingGuest) {
            // Update existing guest
            guestId = existingGuest.id;
            checkinToken = existingGuest.checkin_token;

            // Generate token if doesn't exist and attending
            if (!checkinToken && attendance === 'yes' && accessCheck.features?.qr) {
                checkinToken = generateSecureString(CHECKIN_TOKEN_LENGTH, CHECKIN_TOKEN_CHARS);
                await env.DB.prepare(`
                    UPDATE guests SET name = ?, pax = ?, checkin_token = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(cleanName, pax, checkinToken, guestId).run();
            } else {
                await env.DB.prepare(`
                    UPDATE guests SET name = ?, pax = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(cleanName, pax, guestId).run();
            }

            // Update RSVP
            await env.DB.prepare(`
                INSERT OR REPLACE INTO rsvps (guest_id, event_id, response, pax, arrival_time, message, responded_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(guestId, eventId, attendance, pax, arrivalTime, cleanWishes).run();

        } else {
            // New guest - check if QR is enabled before generating token
            checkinToken = (attendance === 'yes' && accessCheck.features?.qr)
                ? generateSecureString(CHECKIN_TOKEN_LENGTH, CHECKIN_TOKEN_CHARS)
                : null;

            // Create new guest
            const guestResult = await env.DB.prepare(`
                INSERT INTO guests (event_id, name, phone, pax, checkin_token)
                VALUES (?, ?, ?, ?, ?)
            `).bind(eventId, cleanName, cleanPhone, pax, checkinToken).run();

            guestId = guestResult.meta?.last_row_id;
            isNewGuest = true;

            // Create RSVP
            await env.DB.prepare(`
                INSERT INTO rsvps (guest_id, event_id, response, pax, arrival_time, message)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(guestId, eventId, attendance, pax, arrivalTime, cleanWishes).run();

            // Increment usage counters
            await incrementUsage(env, eventId, 'guests');
            await incrementUsage(env, eventId, 'rsvps');
        }

        // If there's a wish/message, add it to guest_messages
        if (cleanWishes && cleanWishes.trim()) {
            await env.DB.prepare(`
                INSERT INTO guest_messages (event_id, guest_name, message)
                VALUES (?, ?, ?)
            `).bind(eventId, cleanName, cleanWishes.trim()).run();
        }

        // Log the RSVP
        await env.DB.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'rsvp_submitted', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ guestId, attendance, isNewGuest }),
            clientIP
        ).run();

        return successResponse({
            success: true,
            message: 'RSVP recorded successfully',
            guestId: guestId,
            checkinToken: checkinToken,
            qrUrl: checkinToken ? `/api/guest/${guestId}/qr` : null
        });

    } catch (error) {
        console.error('Error submitting RSVP:', error);
        return errorResponse('Failed to submit RSVP', 500);
    }
}

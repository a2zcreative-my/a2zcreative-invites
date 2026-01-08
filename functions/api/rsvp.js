/**
 * POST /api/rsvp
 * Submit RSVP response with security checks
 * 
 * SECURITY: Server-side enforcement of guest limits
 * - Only published events accept RSVPs
 * - Guest count incremented atomically (race-safe)
 * - Returns 429 when guest limit reached
 * - Compensation logic if insert fails after increment
 */

import {
    checkRateLimitMulti,
    getClientIP,
    validateRsvpSubmission,
    sanitizeInput,
    logSecurityEvent,
    errorResponse,
    successResponse,
    generateSecureString
} from '../lib/security.js';
import { PACKAGE_RULES, parseFeatures } from '../lib/packageRules.js';

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
        return errorResponse('Medan wajib tidak lengkap', 400, 'MISSING_FIELDS');
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
        return errorResponse('Nilai kehadiran tidak sah', 400);
    }

    try {
        // ===========================================
        // STEP 1: Get event by invitation slug with access data
        // ===========================================
        const invitation = await env.DB.prepare(`
            SELECT 
                i.event_id, 
                i.is_active, 
                e.status,
                ea.guest_limit,
                ea.guest_count,
                ea.features_json,
                ea.package_id
            FROM invitations i
            JOIN events e ON i.event_id = e.id
            LEFT JOIN event_access ea ON e.id = ea.event_id
            WHERE i.public_slug = ?
        `).bind(slug).first();

        if (!invitation) {
            return errorResponse('Jemputan tidak dijumpai', 404);
        }

        if (!invitation.is_active) {
            return errorResponse('Jemputan ini tidak lagi aktif', 403);
        }

        // ===========================================
        // STEP 2: Ensure event is published (SECURITY)
        // ===========================================
        if (invitation.status !== 'published' && invitation.status !== 'active') {
            return errorResponse('Jemputan ini belum diterbitkan. RSVP tidak dapat diterima.', 403, 'NOT_PUBLISHED');
        }

        const eventId = invitation.event_id;

        // ===========================================
        // STEP 3: Multi-factor rate limiting (IP + event + phone)
        // ===========================================
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

        // ===========================================
        // STEP 4: Check if this is a new guest or existing
        // ===========================================
        const existingGuest = await env.DB.prepare(`
            SELECT id, checkin_token FROM guests WHERE event_id = ? AND phone = ?
        `).bind(eventId, cleanPhone).first();

        const isNewGuest = !existingGuest;
        const guestLimit = invitation.guest_limit ?? PACKAGE_RULES.free.guestLimit;
        const currentGuestCount = invitation.guest_count ?? 0;

        // Parse features from server
        const features = parseFeatures(invitation.features_json);

        // ===========================================
        // STEP 5: For NEW guests only - atomic guest limit enforcement
        // ===========================================
        let guestCountIncremented = false;

        if (isNewGuest) {
            // Atomic increment with condition - only if under limit
            const updateResult = await env.DB.prepare(`
                UPDATE event_access 
                SET guest_count = guest_count + 1,
                    current_guests = current_guests + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE event_id = ? 
                AND guest_count < guest_limit
            `).bind(eventId).run();

            // Check if increment was successful
            if (updateResult.meta?.changes === 0) {
                // Either no event_access row, or limit reached
                // Check if it's because limit reached
                if (currentGuestCount >= guestLimit) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Had tetamu telah dicapai untuk majlis ini',
                        errorEn: 'Guest limit reached for this event',
                        code: 'GUEST_LIMIT_REACHED',
                        limit: guestLimit,
                        upgradeMessage: 'Sila hubungi penganjur untuk naik taraf pakej'
                    }), {
                        status: 429,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Retry-After': '86400'
                        }
                    });
                }
                // If no event_access row exists, continue (legacy support)
            } else {
                guestCountIncremented = true;
            }
        }

        const pax = attendance === 'yes' ? Math.min(data.pax || 1, 10) : 0;
        const arrivalTime = data.arrivalTime || null;

        let guestId;
        let checkinToken;

        try {
            if (existingGuest) {
                // ===========================================
                // STEP 6a: Update existing guest
                // ===========================================
                guestId = existingGuest.id;
                checkinToken = existingGuest.checkin_token;

                // Generate token if doesn't exist and attending and QR enabled
                if (!checkinToken && attendance === 'yes' && features.qr) {
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

                // Update or insert RSVP
                await env.DB.prepare(`
                    INSERT OR REPLACE INTO rsvps (guest_id, event_id, response, pax, arrival_time, message, responded_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).bind(guestId, eventId, attendance, pax, arrivalTime, cleanWishes).run();

            } else {
                // ===========================================
                // STEP 6b: Create new guest
                // ===========================================
                checkinToken = (attendance === 'yes' && features.qr)
                    ? generateSecureString(CHECKIN_TOKEN_LENGTH, CHECKIN_TOKEN_CHARS)
                    : null;

                const guestResult = await env.DB.prepare(`
                    INSERT INTO guests (event_id, name, phone, pax, checkin_token)
                    VALUES (?, ?, ?, ?, ?)
                `).bind(eventId, cleanName, cleanPhone, pax, checkinToken).run();

                guestId = guestResult.meta?.last_row_id;

                if (!guestId) {
                    throw new Error('Failed to create guest record');
                }

                // Create RSVP record
                await env.DB.prepare(`
                    INSERT INTO rsvps (guest_id, event_id, response, pax, arrival_time, message)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(guestId, eventId, attendance, pax, arrivalTime, cleanWishes).run();
            }

        } catch (insertError) {
            // ===========================================
            // COMPENSATION: If insert fails after increment, decrement the count
            // ===========================================
            if (guestCountIncremented) {
                try {
                    await env.DB.prepare(`
                        UPDATE event_access 
                        SET guest_count = guest_count - 1,
                            current_guests = current_guests - 1,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE event_id = ? AND guest_count > 0
                    `).bind(eventId).run();
                } catch (compensationError) {
                    console.error('Failed to compensate guest count:', compensationError);
                }
            }
            throw insertError;
        }

        // ===========================================
        // STEP 7: Save wishes/message to guest_messages
        // ===========================================
        if (cleanWishes && cleanWishes.trim()) {
            await env.DB.prepare(`
                INSERT INTO guest_messages (event_id, guest_name, message)
                VALUES (?, ?, ?)
            `).bind(eventId, cleanName, cleanWishes.trim()).run();
        }

        // ===========================================
        // STEP 8: Log audit
        // ===========================================
        await env.DB.prepare(`
            INSERT INTO audit_logs (event_id, action, details, ip_address)
            VALUES (?, 'rsvp_submitted', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({ 
                guestId, 
                attendance, 
                isNewGuest,
                pax,
                guestCountIncremented
            }),
            clientIP
        ).run();

        return successResponse({
            success: true,
            message: 'RSVP berjaya direkodkan',
            messageEn: 'RSVP recorded successfully',
            guestId: guestId,
            checkinToken: checkinToken,
            qrUrl: checkinToken ? `/api/guest/${guestId}/qr` : null
        });

    } catch (error) {
        console.error('Error submitting RSVP:', error);
        return errorResponse('Gagal menghantar RSVP', 500);
    }
}

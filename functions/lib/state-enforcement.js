/**
 * State Enforcement Library
 * 
 * Authoritative state checks for payment and lifecycle enforcement.
 * Frontend signals are NEVER trusted - all checks happen server-side.
 */

/**
 * Actions that require PAID payment state
 */
const ACTIONS_REQUIRE_PAID = [
    'publish',
    'invite',
    'upload_media',
    'add_guests',
    'send_blast',
    'generate_qr'
];

/**
 * Actions allowed during COOLING period (14 days post-event)
 */
const ACTIONS_ALLOWED_IN_COOLING = [
    'view',
    'export',
    'download'
];

/**
 * Lifecycle states that block all client actions
 */
const BLOCKED_LIFECYCLE_STATES = ['DISABLED', 'ARCHIVED', 'PURGED'];

/**
 * Check if an event allows a specific action
 * 
 * @param {D1Database} db - Database instance
 * @param {number} eventId - Event ID to check
 * @param {string} action - Action to validate
 * @returns {Object} { allowed: boolean, reason?: string, code?: string }
 */
export async function checkEventAction(db, eventId, action) {
    const event = await db.prepare(`
        SELECT 
            e.id,
            e.payment_state,
            e.lifecycle_state,
            e.cooldown_until,
            e.created_by
        FROM events e
        WHERE e.id = ?
    `).bind(eventId).first();

    if (!event) {
        return {
            allowed: false,
            reason: 'Event not found',
            reason_ms: 'Acara tidak dijumpai',
            code: 'EVENT_NOT_FOUND'
        };
    }

    // 1. Check if lifecycle state blocks all actions
    if (BLOCKED_LIFECYCLE_STATES.includes(event.lifecycle_state)) {
        return {
            allowed: false,
            reason: `Event is ${event.lifecycle_state.toLowerCase()}`,
            reason_ms: 'Acara tidak lagi boleh diakses',
            code: 'EVENT_INACCESSIBLE'
        };
    }

    // 2. Check payment state for actions that require payment
    if (ACTIONS_REQUIRE_PAID.includes(action)) {
        if (event.payment_state !== 'PAID') {
            return {
                allowed: false,
                reason: 'Payment required for this action',
                reason_ms: 'Bayaran diperlukan untuk tindakan ini',
                code: 'PAYMENT_REQUIRED'
            };
        }
    }

    // 3. Check COOLING state restrictions
    if (event.lifecycle_state === 'COOLING' || event.lifecycle_state === 'ENDED') {
        if (!ACTIONS_ALLOWED_IN_COOLING.includes(action)) {
            return {
                allowed: false,
                reason: 'Event is in cooling period. Only export/download allowed.',
                reason_ms: 'Acara dalam tempoh penyimpanan. Hanya muat turun dibenarkan.',
                code: 'COOLING_PERIOD'
            };
        }
    }

    return { allowed: true };
}

/**
 * Check if a user is blocked from creating events
 * 
 * @param {D1Database} db - Database instance
 * @param {number} userId - User ID to check
 * @returns {Object} { blocked: boolean, reason?: string, code?: string }
 */
export async function checkUserCanCreateEvent(db, userId) {
    // 1. Check account flags
    const flags = await db.prepare(`
        SELECT * FROM account_flags WHERE user_id = ?
    `).bind(userId).first();

    if (flags?.is_suspended) {
        return {
            blocked: true,
            reason: 'Account suspended',
            reason_ms: 'Akaun digantung',
            code: 'ACCOUNT_SUSPENDED'
        };
    }

    if (flags?.is_rate_limited) {
        return {
            blocked: true,
            reason: 'Rate limited due to suspicious activity',
            reason_ms: 'Dihadkan sementara kerana aktiviti mencurigakan',
            code: 'RATE_LIMITED'
        };
    }

    // 2. Check events created in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentEvents = await db.prepare(`
        SELECT COUNT(*) as count 
        FROM events 
        WHERE created_by = ? 
        AND created_at > ?
    `).bind(userId, oneHourAgo).first();

    // Rate limit: max 10 events per hour
    if (recentEvents.count >= 10) {
        // Auto rate-limit user
        const now = new Date().toISOString();
        await db.prepare(`
            INSERT INTO account_flags (user_id, is_rate_limited, events_created_last_hour, last_event_created_at, updated_at)
            VALUES (?, 1, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                is_rate_limited = 1,
                events_created_last_hour = ?,
                updated_at = ?
        `).bind(userId, recentEvents.count, now, now, recentEvents.count, now).run();

        return {
            blocked: true,
            reason: 'Too many events created. Please try again later.',
            reason_ms: 'Terlalu banyak acara dicipta. Sila cuba lagi kemudian.',
            code: 'RATE_LIMIT_EXCEEDED'
        };
    }

    return { blocked: false };
}

/**
 * Update payment state on event after payment verification
 * 
 * @param {D1Database} db - Database instance
 * @param {number} eventId - Event ID
 * @param {string} newPaymentState - 'PAID' or 'NO_PAID'
 */
export async function updatePaymentState(db, eventId, newPaymentState) {
    const now = new Date().toISOString();

    // Determine lifecycle state based on payment
    let newLifecycleState = 'DRAFT';
    if (newPaymentState === 'PAID') {
        // Check if event should be LIVE or SCHEDULED
        const event = await db.prepare(`
            SELECT event_date, start_time, end_time FROM events WHERE id = ?
        `).bind(eventId).first();

        if (event) {
            const eventStart = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
            const eventEnd = new Date(`${event.event_date}T${event.end_time || '23:59'}`);
            const nowDate = new Date();

            if (nowDate >= eventEnd) {
                newLifecycleState = 'ENDED';
            } else if (nowDate >= eventStart) {
                newLifecycleState = 'LIVE';
            } else {
                newLifecycleState = 'SCHEDULED';
            }
        } else {
            newLifecycleState = 'SCHEDULED';
        }
    }

    await db.prepare(`
        UPDATE events 
        SET payment_state = ?,
            lifecycle_state = ?,
            updated_at = ?
        WHERE id = ?
    `).bind(newPaymentState, newLifecycleState, now, eventId).run();

    // Log state transition
    await db.prepare(`
        INSERT INTO audit_logs (event_id, action, details, created_at)
        VALUES (?, 'PAYMENT_STATE_CHANGE', ?, ?)
    `).bind(
        eventId,
        JSON.stringify({
            payment_state: newPaymentState,
            lifecycle_state: newLifecycleState
        }),
        now
    ).run();

    return { payment_state: newPaymentState, lifecycle_state: newLifecycleState };
}

/**
 * Track payment attempt for abuse detection
 * 
 * @param {D1Database} db - Database instance
 * @param {number} userId - User ID
 */
export async function trackPaymentAttempt(db, userId) {
    const now = new Date().toISOString();

    await db.prepare(`
        INSERT INTO account_flags (user_id, total_payment_attempts, last_event_created_at, updated_at)
        VALUES (?, 1, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            total_payment_attempts = total_payment_attempts + 1,
            last_event_created_at = ?,
            events_created_last_hour = events_created_last_hour + 1,
            updated_at = ?
    `).bind(userId, now, now, now, now).run();
}

/**
 * Error response helper with consistent format
 */
export function stateErrorResponse(statusCode, message, extras = {}) {
    return new Response(JSON.stringify({
        error: message,
        ...extras
    }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
    });
}

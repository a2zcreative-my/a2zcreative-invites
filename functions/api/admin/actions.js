/**
 * Admin Actions API
 * POST /api/admin/actions
 * 
 * Super Admin actions for event and user management:
 * - restore_user: Unsuspend a user account
 * - restore_event: Restore a disabled event to SCHEDULED
 * - archive_event: Move event to ARCHIVED state
 * - purge_event: Permanently mark event for deletion (irreversible)
 * - unflag_user: Remove abuse flag from user
 * - rate_limit_user: Manually rate-limit a user
 * 
 * SECURITY: Requires super_admin role. All actions are logged immutably.
 */

import { requireAuth, requireAdmin } from '../../lib/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Authenticate user
    const { userId, errorResponse: authError } = await requireAuth(request, db);
    if (authError) return authError;

    // 2. Verify super_admin role
    const adminError = await requireAdmin(db, userId);
    if (adminError) return adminError;

    // 3. Parse request body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({
            error: 'Invalid JSON body'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { action, target_id, reason } = body;
    const now = new Date().toISOString();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // 4. Validate action
    const validActions = [
        'restore_user',
        'restore_event',
        'archive_event',
        'purge_event',
        'unflag_user',
        'rate_limit_user'
    ];

    if (!validActions.includes(action)) {
        return new Response(JSON.stringify({
            error: 'Invalid action',
            valid_actions: validActions
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!target_id) {
        return new Response(JSON.stringify({
            error: 'target_id is required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        let result;

        switch (action) {
            case 'restore_user':
                result = await restoreUser(db, userId, target_id, reason, now, ip);
                break;
            case 'restore_event':
                result = await restoreEvent(db, userId, target_id, reason, now, ip);
                break;
            case 'archive_event':
                result = await archiveEvent(db, userId, target_id, reason, now, ip);
                break;
            case 'purge_event':
                result = await purgeEvent(db, userId, target_id, reason, now, ip);
                break;
            case 'unflag_user':
                result = await unflagUser(db, userId, target_id, reason, now, ip);
                break;
            case 'rate_limit_user':
                result = await rateLimitUser(db, userId, target_id, reason, now, ip);
                break;
        }

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(`Admin action error (${action}):`, error);

        // Log failed action
        await logAdminAction(db, userId, target_id, `${action.toUpperCase()}_FAILED`, {
            error: error.message,
            reason
        }, ip, now);

        return new Response(JSON.stringify({
            error: `Action '${action}' failed`,
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Restore a suspended user account
 */
async function restoreUser(db, adminId, targetUserId, reason, now, ip) {
    const user = await db.prepare(`
        SELECT u.*, af.is_suspended 
        FROM users u
        LEFT JOIN account_flags af ON af.user_id = u.id
        WHERE u.id = ?
    `).bind(targetUserId).first();

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.is_suspended) {
        throw new Error('User is not suspended');
    }

    await db.batch([
        db.prepare(`
            UPDATE account_flags 
            SET is_suspended = 0,
                admin_notes = COALESCE(admin_notes, '') || '\n[' || ? || '] RESTORED: ' || ?,
                updated_at = ?
            WHERE user_id = ?
        `).bind(now, reason || 'No reason provided', now, targetUserId),

        db.prepare(`
            INSERT INTO audit_logs (
                user_id, target_user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'USER_RESTORED', 'super_admin', 1, ?, ?, ?)
        `).bind(
            adminId,
            targetUserId,
            JSON.stringify({ reason, user_email: user.email }),
            ip,
            now
        )
    ]);

    return {
        success: true,
        action: 'restore_user',
        message: `User ${user.name} (${user.email}) has been restored`,
        target_id: targetUserId
    };
}

/**
 * Restore a disabled event back to SCHEDULED
 */
async function restoreEvent(db, adminId, eventId, reason, now, ip) {
    const event = await db.prepare(`
        SELECT e.*, po.status as payment_status
        FROM events e
        LEFT JOIN payment_orders po ON po.event_id = e.id
        WHERE e.id = ?
    `).bind(eventId).first();

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.lifecycle_state !== 'DISABLED') {
        throw new Error(`Cannot restore event in state: ${event.lifecycle_state}`);
    }

    // Determine appropriate state based on payment
    const newState = event.payment_status === 'verified' ? 'SCHEDULED' : 'DRAFT';
    const newPaymentState = event.payment_status === 'verified' ? 'PAID' : 'NO_PAID';

    await db.batch([
        db.prepare(`
            UPDATE events 
            SET lifecycle_state = ?,
                payment_state = ?,
                disabled_at = NULL,
                updated_at = ?
            WHERE id = ?
        `).bind(newState, newPaymentState, now, eventId),

        db.prepare(`
            INSERT INTO audit_logs (
                event_id, user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'EVENT_RESTORED', 'super_admin', 1, ?, ?, ?)
        `).bind(
            eventId,
            adminId,
            JSON.stringify({
                reason,
                from_state: 'DISABLED',
                to_state: newState,
                event_name: event.event_name
            }),
            ip,
            now
        )
    ]);

    return {
        success: true,
        action: 'restore_event',
        message: `Event "${event.event_name}" restored to ${newState}`,
        target_id: eventId,
        new_state: newState
    };
}

/**
 * Archive an event (read-only, Super Admin access only)
 */
async function archiveEvent(db, adminId, eventId, reason, now, ip) {
    const event = await db.prepare(`
        SELECT * FROM events WHERE id = ?
    `).bind(eventId).first();

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.lifecycle_state === 'PURGED') {
        throw new Error('Cannot archive a purged event');
    }

    await db.batch([
        db.prepare(`
            UPDATE events 
            SET lifecycle_state = 'ARCHIVED',
                archived_at = ?,
                updated_at = ?
            WHERE id = ?
        `).bind(now, now, eventId),

        db.prepare(`
            INSERT INTO audit_logs (
                event_id, user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'EVENT_ARCHIVED', 'super_admin', 1, ?, ?, ?)
        `).bind(
            eventId,
            adminId,
            JSON.stringify({
                reason,
                from_state: event.lifecycle_state,
                event_name: event.event_name
            }),
            ip,
            now
        )
    ]);

    return {
        success: true,
        action: 'archive_event',
        message: `Event "${event.event_name}" has been archived`,
        target_id: eventId
    };
}

/**
 * Purge an event (mark for permanent deletion - IRREVERSIBLE)
 */
async function purgeEvent(db, adminId, eventId, reason, now, ip) {
    if (!reason || reason.length < 20) {
        throw new Error('Purge requires detailed reason (minimum 20 characters)');
    }

    const event = await db.prepare(`
        SELECT * FROM events WHERE id = ?
    `).bind(eventId).first();

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.lifecycle_state === 'PURGED') {
        throw new Error('Event is already purged');
    }

    // Store final snapshot in audit before purge
    await db.batch([
        db.prepare(`
            UPDATE events 
            SET lifecycle_state = 'PURGED',
                updated_at = ?
            WHERE id = ?
        `).bind(now, eventId),

        db.prepare(`
            INSERT INTO audit_logs (
                event_id, user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'EVENT_PURGED', 'super_admin', 1, ?, ?, ?)
        `).bind(
            eventId,
            adminId,
            JSON.stringify({
                reason,
                from_state: event.lifecycle_state,
                event_snapshot: {
                    id: event.id,
                    name: event.event_name,
                    created_by: event.created_by,
                    created_at: event.created_at
                },
                warning: 'IRREVERSIBLE ACTION'
            }),
            ip,
            now
        )
    ]);

    return {
        success: true,
        action: 'purge_event',
        message: `Event "${event.event_name}" has been PURGED (irreversible)`,
        target_id: eventId,
        warning: 'This action cannot be undone'
    };
}

/**
 * Remove abuse flag from a user
 */
async function unflagUser(db, adminId, targetUserId, reason, now, ip) {
    await db.batch([
        db.prepare(`
            UPDATE account_flags 
            SET is_flagged = 0,
                admin_notes = COALESCE(admin_notes, '') || '\n[' || ? || '] UNFLAGGED: ' || ?,
                updated_at = ?
            WHERE user_id = ?
        `).bind(now, reason || 'No reason provided', now, targetUserId),

        db.prepare(`
            INSERT INTO audit_logs (
                user_id, target_user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'USER_UNFLAGGED', 'super_admin', 1, ?, ?, ?)
        `).bind(adminId, targetUserId, JSON.stringify({ reason }), ip, now)
    ]);

    return {
        success: true,
        action: 'unflag_user',
        message: 'User has been unflagged',
        target_id: targetUserId
    };
}

/**
 * Manually rate-limit a user
 */
async function rateLimitUser(db, adminId, targetUserId, reason, now, ip) {
    await db.batch([
        db.prepare(`
            INSERT INTO account_flags (user_id, is_rate_limited, admin_notes, flagged_by, flagged_at, updated_at)
            VALUES (?, 1, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                is_rate_limited = 1,
                admin_notes = COALESCE(admin_notes, '') || '\n[' || ? || '] RATE LIMITED: ' || ?,
                flagged_by = ?,
                flagged_at = ?,
                updated_at = ?
        `).bind(
            targetUserId,
            `[${now}] RATE LIMITED: ${reason || 'Admin action'}`,
            adminId, now, now,
            now, reason || 'Admin action', adminId, now, now
        ),

        db.prepare(`
            INSERT INTO audit_logs (
                user_id, target_user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'USER_RATE_LIMITED', 'super_admin', 1, ?, ?, ?)
        `).bind(adminId, targetUserId, JSON.stringify({ reason }), ip, now)
    ]);

    return {
        success: true,
        action: 'rate_limit_user',
        message: 'User has been rate-limited',
        target_id: targetUserId
    };
}

/**
 * Helper to log admin actions
 */
async function logAdminAction(db, adminId, targetId, action, details, ip, now) {
    try {
        await db.prepare(`
            INSERT INTO audit_logs (
                user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'super_admin', 1, ?, ?, ?)
        `).bind(adminId, action, JSON.stringify({ target_id: targetId, ...details }), ip, now).run();
    } catch (e) {
        console.error('Failed to log admin action:', e);
    }
}

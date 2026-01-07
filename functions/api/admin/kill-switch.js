/**
 * Emergency Kill Switch API
 * POST /api/admin/kill-switch
 * 
 * Super Admin only - Immediately disable a client:
 * 1. Suspend account
 * 2. Revoke all sessions (force logout)
 * 3. Freeze all events and templates
 * 4. Log immutable audit record
 * 
 * SECURITY: Requires super_admin role. All actions are logged immutably.
 */

import { requireAuth, requireAdmin } from '../../lib/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Authenticate user
    const { userId, user, errorResponse: authError } = await requireAuth(request, db);
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

    const { target_user_id, reason } = body;

    // 4. Validate required fields
    if (!target_user_id) {
        return new Response(JSON.stringify({
            error: 'target_user_id is required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!reason || reason.trim().length < 10) {
        return new Response(JSON.stringify({
            error: 'reason is required (minimum 10 characters)'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 5. Prevent self-suspension
    if (target_user_id === userId) {
        return new Response(JSON.stringify({
            error: 'Cannot suspend yourself'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const now = new Date().toISOString();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        // 6. Verify target user exists
        const targetUser = await db.prepare(`
            SELECT id, name, email, role FROM users WHERE id = ?
        `).bind(target_user_id).first();

        if (!targetUser) {
            return new Response(JSON.stringify({
                error: 'Target user not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 7. Prevent suspension of other super_admins
        if (targetUser.role === 'super_admin') {
            return new Response(JSON.stringify({
                error: 'Cannot suspend another super_admin'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 8. Get counts before action for audit
        const eventCount = await db.prepare(`
            SELECT COUNT(*) as count FROM events 
            WHERE created_by = ? 
            AND lifecycle_state NOT IN ('DISABLED', 'ARCHIVED', 'PURGED')
        `).bind(target_user_id).first();

        const sessionCount = await db.prepare(`
            SELECT COUNT(*) as count FROM sessions WHERE user_id = ?
        `).bind(target_user_id).first();

        // 9. Execute kill switch
        await db.batch([
            // a. Suspend account in account_flags
            db.prepare(`
                INSERT INTO account_flags (
                    user_id, is_suspended, admin_notes, flagged_by, flagged_at, updated_at
                )
                VALUES (?, 1, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    is_suspended = 1,
                    admin_notes = COALESCE(admin_notes, '') || '\n[' || ? || '] KILL SWITCH: ' || ?,
                    flagged_by = ?,
                    flagged_at = ?,
                    updated_at = ?
            `).bind(
                target_user_id,
                `[${now}] KILL SWITCH: ${reason}`,
                userId, now, now,
                now, reason, userId, now, now
            ),

            // b. Revoke all sessions (force logout)
            db.prepare(`
                DELETE FROM sessions WHERE user_id = ?
            `).bind(target_user_id),

            // c. Disable all active events
            db.prepare(`
                UPDATE events 
                SET lifecycle_state = 'DISABLED',
                    disabled_at = ?,
                    updated_at = ?
                WHERE created_by = ?
                AND lifecycle_state NOT IN ('DISABLED', 'ARCHIVED', 'PURGED')
            `).bind(now, now, target_user_id),

            // d. Immutable audit log (super admin action)
            db.prepare(`
                INSERT INTO audit_logs (
                    user_id, target_user_id, action, actor_role, 
                    is_super_admin_action, details, ip_address, created_at
                )
                VALUES (?, ?, 'EMERGENCY_KILL_SWITCH', 'super_admin', 1, ?, ?, ?)
            `).bind(
                userId,
                target_user_id,
                JSON.stringify({
                    reason: reason,
                    target_user: {
                        id: targetUser.id,
                        name: targetUser.name,
                        email: targetUser.email
                    },
                    actions_taken: {
                        account_suspended: true,
                        sessions_revoked: sessionCount?.count || 0,
                        events_disabled: eventCount?.count || 0
                    }
                }),
                ip,
                now
            )
        ]);

        console.log(`[KillSwitch] User ${userId} suspended user ${target_user_id}: ${reason}`);

        return new Response(JSON.stringify({
            success: true,
            message: `User ${targetUser.name} (${targetUser.email}) has been suspended`,
            timestamp: now,
            actions_taken: {
                account_suspended: true,
                sessions_revoked: sessionCount?.count || 0,
                events_disabled: eventCount?.count || 0
            },
            target_user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Kill switch error:', error);

        // Log failed attempt
        await db.prepare(`
            INSERT INTO audit_logs (
                user_id, target_user_id, action, actor_role,
                is_super_admin_action, details, ip_address, created_at
            )
            VALUES (?, ?, 'KILL_SWITCH_FAILED', 'super_admin', 1, ?, ?, ?)
        `).bind(
            userId,
            target_user_id,
            JSON.stringify({ reason, error: error.message }),
            ip,
            now
        ).run();

        return new Response(JSON.stringify({
            error: 'Kill switch failed',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

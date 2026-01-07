/**
 * Super Admin Dashboard API
 * GET /api/admin/dashboard
 * 
 * Provides "God Eyes" observability into:
 * 1. Unpaid templates past 15 minutes
 * 2. Verified payments with scheduled events
 * 3. Events ending in 48 hours
 * 4. Events eligible for disable today (cooldown ended)
 * 5. Abuse patterns (repeated expired payments)
 * 
 * SECURITY: Requires super_admin role
 */

import { requireAuth, requireAdmin } from '../../lib/auth.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.DB;

    // 1. Authenticate user
    const { userId, errorResponse: authError } = await requireAuth(request, db);
    if (authError) return authError;

    // 2. Verify super_admin role
    const adminError = await requireAdmin(db, userId);
    if (adminError) return adminError;

    try {
        const now = new Date();
        const nowISO = now.toISOString();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

        // Execute all dashboard queries in parallel
        const [
            unpaidTemplates,
            scheduledEvents,
            endingSoon,
            disableToday,
            abusePatterns,
            systemStats
        ] = await Promise.all([
            // 1. Unpaid templates past 15 minutes
            db.prepare(`
                SELECT 
                    e.id,
                    e.event_name,
                    e.created_at,
                    e.payment_state,
                    u.id as user_id,
                    u.name as user_name,
                    u.email,
                    po.order_ref,
                    po.amount_cents,
                    po.status as payment_status,
                    po.expires_at,
                    ROUND((julianday('now') - julianday(e.created_at)) * 24 * 60) as minutes_since_created
                FROM events e
                JOIN users u ON e.created_by = u.id
                LEFT JOIN payment_orders po ON po.event_id = e.id
                WHERE (e.payment_state = 'NO_PAID' OR e.payment_state IS NULL)
                AND e.created_at < ?
                AND e.lifecycle_state != 'PURGED'
                ORDER BY e.created_at DESC
                LIMIT 50
            `).bind(fifteenMinutesAgo).all(),

            // 2. Verified payments - Events scheduled (paid and waiting)
            db.prepare(`
                SELECT 
                    e.id,
                    e.event_name,
                    e.event_date,
                    e.start_time,
                    e.lifecycle_state,
                    u.name as user_name,
                    u.email,
                    po.paid_at,
                    po.amount_cents,
                    ROUND(julianday(e.event_date) - julianday('now')) as days_until_event
                FROM events e
                JOIN users u ON e.created_by = u.id
                JOIN payment_orders po ON po.event_id = e.id
                WHERE po.status = 'verified'
                AND e.lifecycle_state = 'SCHEDULED'
                ORDER BY e.event_date ASC
                LIMIT 50
            `).all(),

            // 3. Events ending in 48 hours (LIVE events about to end)
            db.prepare(`
                SELECT 
                    e.id,
                    e.event_name,
                    e.event_date,
                    e.end_time,
                    e.lifecycle_state,
                    u.name as user_name,
                    u.email,
                    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as guest_count,
                    (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND response = 'yes') as confirmed_count,
                    i.view_count
                FROM events e
                JOIN users u ON e.created_by = u.id
                LEFT JOIN invitations i ON i.event_id = e.id
                WHERE e.lifecycle_state = 'LIVE'
                AND datetime(e.event_date || ' ' || COALESCE(e.end_time, '23:59')) <= datetime(?)
                ORDER BY e.event_date ASC
            `).bind(in48Hours).all(),

            // 4. Events eligible for disable today (cooldown ended)
            db.prepare(`
                SELECT 
                    e.id,
                    e.event_name,
                    e.event_date,
                    e.cooldown_until,
                    e.lifecycle_state,
                    u.name as user_name,
                    u.email,
                    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as guest_count
                FROM events e
                JOIN users u ON e.created_by = u.id
                WHERE e.lifecycle_state IN ('ENDED', 'COOLING')
                AND e.cooldown_until IS NOT NULL
                AND datetime(e.cooldown_until) <= datetime('now')
                ORDER BY e.cooldown_until ASC
            `).all(),

            // 5. Abuse patterns (users with high expire rates)
            db.prepare(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.created_at as user_since,
                    af.expired_payment_count,
                    af.total_payment_attempts,
                    ROUND(af.expired_payment_count * 100.0 / 
                          NULLIF(af.total_payment_attempts, 0), 1) as expire_rate_percent,
                    af.is_flagged,
                    af.is_rate_limited,
                    af.is_suspended,
                    af.admin_notes,
                    af.flagged_at,
                    (SELECT COUNT(*) FROM events WHERE created_by = u.id) as total_events
                FROM account_flags af
                JOIN users u ON af.user_id = u.id
                WHERE af.expired_payment_count >= 3
                OR (af.total_payment_attempts >= 5 
                    AND af.expired_payment_count * 100.0 / af.total_payment_attempts > 50)
                ORDER BY af.expired_payment_count DESC
                LIMIT 20
            `).all(),

            // 6. System-wide statistics
            Promise.all([
                db.prepare('SELECT COUNT(*) as count FROM users').first(),
                db.prepare('SELECT COUNT(*) as count FROM events WHERE lifecycle_state != "PURGED"').first(),
                db.prepare('SELECT COUNT(*) as count FROM events WHERE payment_state = "PAID"').first(),
                db.prepare('SELECT SUM(amount_cents) as total FROM payment_orders WHERE status = "verified"').first(),
                db.prepare('SELECT COUNT(*) as count FROM account_flags WHERE is_flagged = 1').first(),
                db.prepare('SELECT COUNT(*) as count FROM account_flags WHERE is_suspended = 1').first(),
                // Revenue breakdown for last 7 days
                db.prepare(`
                    SELECT 
                        SUM(CASE WHEN status = 'verified' THEN amount_cents ELSE 0 END) as verified_cents,
                        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
                        SUM(CASE WHEN status IN ('pending', 'processing') THEN amount_cents ELSE 0 END) as pending_cents,
                        COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) as pending_count,
                        SUM(CASE WHEN status = 'expired' THEN amount_cents ELSE 0 END) as expired_cents,
                        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
                        SUM(CASE WHEN status = 'refunded' THEN amount_cents ELSE 0 END) as refunded_cents,
                        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count
                    FROM payment_orders
                    WHERE created_at >= datetime('now', '-7 days')
                `).first()
            ])
        ]);

        // Format system stats
        const [users, events, paidEvents, revenue, flagged, suspended, revenueBreakdown] = systemStats;

        return new Response(JSON.stringify({
            timestamp: nowISO,
            system_stats: {
                total_users: users?.count || 0,
                total_events: events?.count || 0,
                paid_events: paidEvents?.count || 0,
                total_revenue_cents: revenue?.total || 0,
                flagged_accounts: flagged?.count || 0,
                suspended_accounts: suspended?.count || 0,
                // Revenue breakdown for last 7 days
                revenue_breakdown: {
                    period_days: 7,
                    verified_cents: revenueBreakdown?.verified_cents || 0,
                    verified_count: revenueBreakdown?.verified_count || 0,
                    pending_cents: revenueBreakdown?.pending_cents || 0,
                    pending_count: revenueBreakdown?.pending_count || 0,
                    expired_cents: revenueBreakdown?.expired_cents || 0,
                    expired_count: revenueBreakdown?.expired_count || 0,
                    refunded_cents: revenueBreakdown?.refunded_cents || 0,
                    refunded_count: revenueBreakdown?.refunded_count || 0
                }
            },
            panels: {
                unpaid_templates: {
                    title: 'Unpaid Templates (>15 min)',
                    description: 'Events created but payment expired or pending',
                    severity: 'warning',
                    count: unpaidTemplates.results?.length || 0,
                    data: unpaidTemplates.results || []
                },
                scheduled_events: {
                    title: 'Paid & Scheduled Events',
                    description: 'Verified payments awaiting event date',
                    severity: 'info',
                    count: scheduledEvents.results?.length || 0,
                    data: scheduledEvents.results || []
                },
                ending_soon: {
                    title: 'Events Ending in 48 Hours',
                    description: 'LIVE events about to transition to ENDED',
                    severity: 'info',
                    count: endingSoon.results?.length || 0,
                    data: endingSoon.results || []
                },
                disable_eligible: {
                    title: 'Ready for Disable',
                    description: 'Cooldown period ended, eligible for DISABLED transition',
                    severity: 'info',
                    count: disableToday.results?.length || 0,
                    data: disableToday.results || []
                },
                abuse_patterns: {
                    title: 'Abuse Patterns Detected',
                    description: 'Users with repeated expired payments or suspicious activity',
                    severity: 'danger',
                    count: abusePatterns.results?.length || 0,
                    data: abusePatterns.results || []
                }
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        return new Response(JSON.stringify({
            error: 'Dashboard query failed',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

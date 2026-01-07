/**
 * Payment Expiration Scheduled Worker
 * Cron: /5 * * * * (every 5 minutes)
 * 
 * Responsibilities:
 * 1. Find all payment_orders where now() > expires_at AND status IN('pending', 'processing')
    * 2. Update payment_orders.status = 'expired'
        * 3. Update events.payment_state = 'NO_PAID', lifecycle_state = 'DRAFT'
            * 4. Update abuse tracking in account_flags
                * 5. Log all transitions to audit_logs
                    * 
 * This is the AUTHORITATIVE enforcement - frontend timers are NOT trusted.
 */

export default {
    async scheduled(event, env, ctx) {
        const db = env.DB;
        const now = new Date().toISOString();

        console.log(`[Cron:PaymentExpiration] Starting at ${now}`);

        try {
            // 1. Find expired pending/processing payments
            const expired = await db.prepare(`
                SELECT 
                    po.id,
                    po.event_id,
                    po.order_ref,
                    po.user_id,
                    po.amount_cents,
                    po.created_at,
                    po.expires_at
                FROM payment_orders po
                WHERE po.expires_at < ?
                AND po.status IN ('pending', 'processing')
            `).bind(now).all();

            const expiredCount = expired.results?.length || 0;

            if (expiredCount === 0) {
                console.log('[Cron:PaymentExpiration] No expired payments found');
                return;
            }

            console.log(`[Cron:PaymentExpiration] Found ${expiredCount} expired payments`);

            // 2. Process each expired payment
            for (const order of expired.results) {
                try {
                    await processExpiredPayment(db, order, now);
                } catch (orderError) {
                    console.error(`[Cron:PaymentExpiration] Failed to process order ${order.order_ref}:`, orderError);
                    // Continue processing other orders
                }
            }

            // 3. Update rate limit counters (reset hourly counters if needed)
            await resetHourlyCounters(db, now);

            console.log(`[Cron:PaymentExpiration] Completed. Processed ${expiredCount} payments.`);

        } catch (error) {
            console.error('[Cron:PaymentExpiration] Fatal error:', error);
            throw error; // Re-throw to signal failure to Cloudflare
        }
    }
};

/**
 * Process a single expired payment order
 */
async function processExpiredPayment(db, order, now) {
    await db.batch([
        // 1. Mark payment as expired
        db.prepare(`
            UPDATE payment_orders 
            SET status = 'expired',
                updated_at = ?
            WHERE id = ?
        `).bind(now, order.id),

        // 2. Lock the event (NO_PAID, DRAFT)
        db.prepare(`
            UPDATE events 
            SET payment_state = 'NO_PAID',
                lifecycle_state = 'DRAFT',
                updated_at = ?
            WHERE id = ?
        `).bind(now, order.event_id),

        // 3. Immutable audit log
        db.prepare(`
            INSERT INTO audit_logs 
            (event_id, user_id, action, details, created_at)
            VALUES (?, ?, 'PAYMENT_EXPIRED', ?, ?)
        `).bind(
            order.event_id,
            order.user_id,
            JSON.stringify({
                order_ref: order.order_ref,
                amount_cents: order.amount_cents,
                created_at: order.created_at,
                expires_at: order.expires_at,
                message: '15-minute payment window expired'
            }),
            now
        ),

        // 4. Update abuse tracking
        db.prepare(`
            INSERT INTO account_flags (user_id, expired_payment_count, total_payment_attempts, updated_at)
            VALUES (?, 1, 1, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                expired_payment_count = expired_payment_count + 1,
                updated_at = ?
        `).bind(order.user_id, now, now)
    ]);

    console.log(`[Cron:PaymentExpiration] Expired order ${order.order_ref} for event ${order.event_id}`);

    // 5. Check if user should be flagged for abuse
    await checkAbuseThreshold(db, order.user_id, now);
}

/**
 * Check if user has crossed abuse thresholds and flag if needed
 */
async function checkAbuseThreshold(db, userId, now) {
    const flags = await db.prepare(`
        SELECT expired_payment_count, total_payment_attempts
        FROM account_flags
        WHERE user_id = ?
    `).bind(userId).first();

    if (!flags) return;

    const expireRate = flags.total_payment_attempts > 0
        ? (flags.expired_payment_count / flags.total_payment_attempts) * 100
        : 0;

    // Abuse thresholds:
    // - 3+ expired payments, OR
    // - 5+ attempts with >50% expire rate
    const shouldFlag =
        flags.expired_payment_count >= 3 ||
        (flags.total_payment_attempts >= 5 && expireRate > 50);

    if (shouldFlag) {
        await db.prepare(`
            UPDATE account_flags 
            SET is_flagged = 1,
                updated_at = ?
            WHERE user_id = ?
            AND is_flagged = 0
        `).bind(now, userId).run();

        console.log(`[Cron:PaymentExpiration] Flagged user ${userId} for abuse pattern`);
    }
}

/**
 * Reset hourly rate limit counters (runs every 5 min, but only resets after 1 hour)
 */
async function resetHourlyCounters(db, now) {
    const oneHourAgo = new Date(new Date(now).getTime() - 60 * 60 * 1000).toISOString();

    // Reset events_created_last_hour for users whose last_event_created_at is > 1 hour ago
    await db.prepare(`
        UPDATE account_flags
        SET events_created_last_hour = 0,
            is_rate_limited = 0,
            updated_at = ?
        WHERE last_event_created_at < ?
        AND (events_created_last_hour > 0 OR is_rate_limited = 1)
    `).bind(now, oneHourAgo).run();
}

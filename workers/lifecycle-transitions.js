/**
 * Lifecycle Transition Scheduled Worker
 * Cron: 0 * * * * (every hour)
 * 
 * Responsibilities:
 * 1. SCHEDULED → LIVE: When event_date + start_time <= now()
 * 2. LIVE → ENDED: When event_date + end_time < now()
 * 3. ENDED → COOLING: Set cooldown_until = event_date + 14 days
 * 4. COOLING → DISABLED: When now() > cooldown_until
 * 
 * Only events with payment_state = 'PAID' can progress through lifecycle.
 */

export default {
    async scheduled(event, env, ctx) {
        const db = env.DB;
        const now = new Date();
        const nowISO = now.toISOString();

        console.log(`[Cron:Lifecycle] Starting at ${nowISO}`);

        try {
            // 1. SCHEDULED → LIVE
            const scheduledToLive = await transitionScheduledToLive(db, nowISO);

            // 2. LIVE → ENDED
            const liveToEnded = await transitionLiveToEnded(db, nowISO);

            // 3. COOLING → DISABLED (after 14 days)
            const coolingToDisabled = await transitionCoolingToDisabled(db, nowISO);

            console.log(`[Cron:Lifecycle] Completed. Transitions: SCHEDULED→LIVE: ${scheduledToLive}, LIVE→ENDED: ${liveToEnded}, COOLING→DISABLED: ${coolingToDisabled}`);

        } catch (error) {
            console.error('[Cron:Lifecycle] Fatal error:', error);
            throw error;
        }
    }
};

/**
 * Transition SCHEDULED → LIVE when event starts
 */
async function transitionScheduledToLive(db, now) {
    // Find events that should go LIVE
    const result = await db.prepare(`
        UPDATE events 
        SET lifecycle_state = 'LIVE',
            updated_at = ?
        WHERE payment_state = 'PAID'
        AND lifecycle_state = 'SCHEDULED'
        AND datetime(event_date || ' ' || COALESCE(start_time, '00:00')) <= datetime(?)
    `).bind(now, now).run();

    const count = result.meta?.changes || 0;

    if (count > 0) {
        // Log transitions
        await db.prepare(`
            INSERT INTO audit_logs (action, details, created_at)
            VALUES ('LIFECYCLE_BATCH_TRANSITION', ?, ?)
        `).bind(
            JSON.stringify({
                from: 'SCHEDULED',
                to: 'LIVE',
                count,
                trigger: 'cron'
            }),
            now
        ).run();
    }

    return count;
}

/**
 * Transition LIVE → ENDED when event ends
 * Also sets cooldown_until for 14 days
 */
async function transitionLiveToEnded(db, now) {
    // Find events that have ended
    const endedEvents = await db.prepare(`
        SELECT id, event_date
        FROM events
        WHERE lifecycle_state = 'LIVE'
        AND datetime(event_date || ' ' || COALESCE(end_time, '23:59')) < datetime(?)
    `).bind(now).all();

    const count = endedEvents.results?.length || 0;

    if (count === 0) return 0;

    // Update each event with proper cooldown_until
    for (const event of endedEvents.results) {
        const eventDate = new Date(event.event_date);
        const cooldownDate = new Date(eventDate.getTime() + 14 * 24 * 60 * 60 * 1000);

        await db.prepare(`
            UPDATE events 
            SET lifecycle_state = 'ENDED',
                cooldown_until = ?,
                updated_at = ?
            WHERE id = ?
        `).bind(cooldownDate.toISOString(), now, event.id).run();
    }

    // Log batch transition
    await db.prepare(`
        INSERT INTO audit_logs (action, details, created_at)
        VALUES ('LIFECYCLE_BATCH_TRANSITION', ?, ?)
    `).bind(
        JSON.stringify({
            from: 'LIVE',
            to: 'ENDED',
            count,
            cooldown_days: 14,
            trigger: 'cron'
        }),
        now
    ).run();

    return count;
}

/**
 * Transition COOLING → DISABLED when cooldown expires
 * - Detach large data
 * - Summarize guest lists
 * - Preserve metadata only
 */
async function transitionCoolingToDisabled(db, now) {
    // Find events past cooldown
    const cooledEvents = await db.prepare(`
        SELECT id, event_name
        FROM events
        WHERE lifecycle_state IN ('ENDED', 'COOLING')
        AND cooldown_until IS NOT NULL
        AND datetime(cooldown_until) < datetime(?)
    `).bind(now).all();

    const count = cooledEvents.results?.length || 0;

    if (count === 0) return 0;

    for (const event of cooledEvents.results) {
        await transitionToDisabled(db, event.id, now);
    }

    return count;
}

/**
 * Transition a single event to DISABLED state
 * Includes D1 optimization: summarize and detach large data
 */
async function transitionToDisabled(db, eventId, now) {
    // 1. Get guest summary before cleanup
    const guestSummary = await db.prepare(`
        SELECT 
            COUNT(*) as total_guests,
            SUM(g.pax) as total_pax,
            SUM(CASE WHEN r.response = 'yes' THEN 1 ELSE 0 END) as confirmed_count,
            SUM(CASE WHEN r.response = 'no' THEN 1 ELSE 0 END) as declined_count,
            SUM(CASE WHEN r.response = 'maybe' THEN 1 ELSE 0 END) as maybe_count,
            (SELECT COUNT(*) FROM attendance_logs WHERE event_id = ?) as checkin_count,
            (SELECT COUNT(*) FROM guest_messages WHERE event_id = ?) as message_count
        FROM guests g
        LEFT JOIN rsvps r ON g.id = r.guest_id
        WHERE g.event_id = ?
    `).bind(eventId, eventId, eventId).first();

    // 2. Get view count from invitation
    const invitation = await db.prepare(`
        SELECT view_count FROM invitations WHERE event_id = ?
    `).bind(eventId).first();

    // 3. Store summary as JSON in event
    const summary = {
        archived_at: now,
        final_stats: {
            total_guests: guestSummary?.total_guests || 0,
            total_pax: guestSummary?.total_pax || 0,
            confirmed: guestSummary?.confirmed_count || 0,
            declined: guestSummary?.declined_count || 0,
            maybe: guestSummary?.maybe_count || 0,
            checkins: guestSummary?.checkin_count || 0,
            messages: guestSummary?.message_count || 0,
            views: invitation?.view_count || 0
        }
    };

    await db.batch([
        // Update event state
        db.prepare(`
            UPDATE events 
            SET lifecycle_state = 'DISABLED',
                disabled_at = ?,
                updated_at = ?
            WHERE id = ?
        `).bind(now, now, eventId),

        // Audit log with summary
        db.prepare(`
            INSERT INTO audit_logs (event_id, action, details, created_at)
            VALUES (?, 'EVENT_DISABLED', ?, ?)
        `).bind(
            eventId,
            JSON.stringify({
                reason: 'Cooldown period expired (14 days)',
                summary: summary.final_stats,
                data_detached: true
            }),
            now
        )
    ]);

    // Optional: Delete individual guest records to optimize D1 storage
    // Uncomment if you want aggressive cleanup:
    // await db.batch([
    //     db.prepare('DELETE FROM rsvps WHERE event_id = ?').bind(eventId),
    //     db.prepare('DELETE FROM guests WHERE event_id = ?').bind(eventId),
    //     db.prepare('DELETE FROM attendance_logs WHERE event_id = ?').bind(eventId),
    //     db.prepare('DELETE FROM guest_messages WHERE event_id = ?').bind(eventId)
    // ]);

    console.log(`[Cron:Lifecycle] Disabled event ${eventId}, summary preserved`);
}

-- ============================================
-- Migration: Add State Machine Columns
-- Run: npx wrangler d1 execute invites-db --local --file=migrations/010_add_state_columns.sql
-- Prod: npx wrangler d1 execute invites-db-prod --file=migrations/010_add_state_columns.sql
-- ============================================

-- =============================================
-- 1. Events State Columns
-- =============================================

-- Payment state: The authoritative payment status
-- NO_PAID = locked, PAID = unlocked
ALTER TABLE events ADD COLUMN payment_state TEXT DEFAULT 'NO_PAID';

-- Lifecycle state: Event progression
ALTER TABLE events ADD COLUMN lifecycle_state TEXT DEFAULT 'DRAFT';

-- Cooldown tracking for 14-day post-event window
ALTER TABLE events ADD COLUMN cooldown_until DATETIME;

-- State transition timestamps
ALTER TABLE events ADD COLUMN disabled_at DATETIME;
ALTER TABLE events ADD COLUMN archived_at DATETIME;

-- =============================================
-- 2. Account Flags Table (Abuse Tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS account_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    
    -- Abuse metrics
    expired_payment_count INTEGER DEFAULT 0,
    total_payment_attempts INTEGER DEFAULT 0,
    
    -- Flags
    is_flagged INTEGER DEFAULT 0,
    is_rate_limited INTEGER DEFAULT 0,
    is_suspended INTEGER DEFAULT 0,
    
    -- Rate limiting
    last_event_created_at DATETIME,
    events_created_last_hour INTEGER DEFAULT 0,
    
    -- Admin notes
    admin_notes TEXT,
    flagged_by INTEGER,
    flagged_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (flagged_by) REFERENCES users(id)
);

-- =============================================
-- 3. Enhanced Audit Logs
-- =============================================

-- Add actor role for Super Admin tracking
ALTER TABLE audit_logs ADD COLUMN actor_role TEXT;

-- Track target user for admin actions
ALTER TABLE audit_logs ADD COLUMN target_user_id INTEGER;

-- Flag super admin actions for immutability audits
ALTER TABLE audit_logs ADD COLUMN is_super_admin_action INTEGER DEFAULT 0;

-- =============================================
-- 4. Performance Indexes
-- =============================================

-- Payment expiration queries
CREATE INDEX IF NOT EXISTS idx_payment_orders_expires ON payment_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_expires ON payment_orders(status, expires_at);

-- Event state queries
CREATE INDEX IF NOT EXISTS idx_events_payment_state ON events(payment_state);
CREATE INDEX IF NOT EXISTS idx_events_lifecycle ON events(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_events_cooldown ON events(cooldown_until);

-- Abuse tracking
CREATE INDEX IF NOT EXISTS idx_account_flags_user ON account_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_account_flags_flagged ON account_flags(is_flagged);
CREATE INDEX IF NOT EXISTS idx_account_flags_suspended ON account_flags(is_suspended);

-- =============================================
-- 5. Backfill Existing Verified Events
-- =============================================

-- Set payment_state = 'PAID' for events with verified payments
UPDATE events SET 
    payment_state = 'PAID',
    lifecycle_state = CASE
        WHEN datetime(event_date || ' ' || COALESCE(end_time, '23:59')) < datetime('now') 
            THEN 'ENDED'
        WHEN datetime(event_date || ' ' || COALESCE(start_time, '00:00')) <= datetime('now')
            THEN 'LIVE'
        ELSE 'SCHEDULED'
    END
WHERE id IN (
    SELECT event_id FROM payment_orders WHERE status = 'verified'
);

-- Set cooldown_until for ended events (14 days from event date)
UPDATE events SET 
    cooldown_until = datetime(event_date, '+14 days')
WHERE lifecycle_state = 'ENDED'
AND cooldown_until IS NULL;

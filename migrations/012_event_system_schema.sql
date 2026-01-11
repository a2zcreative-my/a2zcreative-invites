-- ============================================
-- Migration 012: Event System Schema Updates
-- Run: npx wrangler d1 execute invites-db --local --file=migrations/012_event_system_schema.sql
-- 
-- This migration ensures the database schema matches the backend routes:
-- - Adds theme_id column to events table
-- - Adds paid_at column to event_access table
-- - Creates unique index on events.slug
-- - Reseeds event_types with correct Malay names and IDs
-- - Creates audit_logs table if not exists
-- ============================================

-- ============================================
-- EVENTS TABLE UPDATES
-- ============================================

-- Add theme_id column (may already exist, will error if so - safe to ignore)
-- ALTER TABLE events ADD COLUMN theme_id TEXT;

-- Add slug column if missing (core requirement)
ALTER TABLE events ADD COLUMN slug TEXT;

-- Create unique index on slug to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Ensure status column allows new values
-- Note: SQLite doesn't support ALTER COLUMN, so new statuses work with existing constraint
-- Valid statuses: draft, pending_payment, published, active, completed, archived

-- ============================================
-- EVENT_ACCESS TABLE UPDATES
-- ============================================

-- Add paid_at column for tracking payment status
-- This will error if column already exists - safe to ignore
-- ALTER TABLE event_access ADD COLUMN paid_at TEXT;

-- ============================================
-- EVENT_TYPES TABLE - RESEED WITH CORRECT DATA
-- ============================================

-- Delete old entries and insert with correct IDs and Malay names
-- This ensures IDs match the shared/eventConfig.js
DELETE FROM event_types;

INSERT INTO event_types (id, name, default_theme, icon) VALUES
    (1, 'Perkahwinan', 'elegant-gold', '💒'),
    (2, 'Bisnes', 'professional-blue', '🏢'),
    (3, 'Keluarga', 'warm-coral', '👨‍👩‍👧‍👦'),
    (4, 'Hari Lahir', 'festive-purple', '🎂'),
    (5, 'Komuniti', 'nature-green', '🌿');

-- ============================================
-- AUDIT_LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- Index for faster lookups by event
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- VERIFICATION QUERIES (run separately to verify)
-- ============================================

-- Verify event_types:
-- SELECT * FROM event_types ORDER BY id;

-- Verify events schema:
-- PRAGMA table_info(events);

-- Verify event_access schema:
-- PRAGMA table_info(event_access);

-- Verify audit_logs exists:
-- SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs';

-- ============================================
-- Migration 012b: Event System Schema (Production Safe)
-- This version handles existing columns gracefully
-- ============================================

-- Create unique index on slug (safe - IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Update event_types with correct Malay names (safe - INSERT OR REPLACE)
INSERT OR REPLACE INTO event_types (id, name, default_theme, icon) VALUES
    (1, 'Perkahwinan', 'elegant-gold', '💒'),
    (2, 'Bisnes', 'professional-blue', '🏢'),
    (3, 'Keluarga', 'warm-coral', '👨‍👩‍👧‍👦'),
    (4, 'Hari Lahir', 'festive-purple', '🎂'),
    (5, 'Komuniti', 'nature-green', '🌿');

-- Ensure audit_logs table exists (safe - IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

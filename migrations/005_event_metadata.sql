-- Migration: Add event_metadata table for storing additional event details
-- This stores host names, parent names, schedule, contacts, etc.

CREATE TABLE IF NOT EXISTS event_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL UNIQUE,
    host_name_1 TEXT,
    host_name_2 TEXT,
    parent_names_1 TEXT,
    parent_names_2 TEXT,
    invite_title TEXT,
    verse_text TEXT,
    verse_ref TEXT,
    hashtag TEXT,
    schedule_json TEXT,
    contacts_json TEXT,
    has_watermark INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Index for fast lookup by event_id
CREATE INDEX IF NOT EXISTS idx_event_metadata_event_id ON event_metadata(event_id);

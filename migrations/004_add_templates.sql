-- Migration 004: Add templates table for user invitation templates
-- This table stores saved templates with proper user isolation

CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,              -- Owner of this template (FK to users)
    name TEXT NOT NULL,                    -- Template name
    event_type_id INTEGER,                 -- Event type (1=Wedding, 2=Corporate, etc.)
    theme TEXT DEFAULT 'elegant-gold',     -- Theme name
    
    -- Template data stored as JSON
    template_data TEXT NOT NULL,           -- JSON blob of all settings
    
    -- Metadata
    is_public BOOLEAN DEFAULT 0,           -- If shareable with others (future feature)
    is_default BOOLEAN DEFAULT 0,          -- Default template for event type
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys (note: SQLite doesn't enforce these, but documents intent)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id)
);

-- Index for fast user lookup - CRITICAL for multi-tenancy
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

-- Index for finding templates by event type
CREATE INDEX IF NOT EXISTS idx_templates_event_type ON templates(event_type_id);

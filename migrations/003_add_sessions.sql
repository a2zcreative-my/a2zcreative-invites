-- Migration: Add sessions table for server-side authentication
-- Run this on existing databases to add session support

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Note: SQLite doesn't support ALTER COLUMN to change CHECK constraints
-- The existing 'event_admin' value will continue to work with the old schema
-- New users will be created with 'admin' role once schema is recreated
-- For now, both 'event_admin' and 'admin' should be treated as equivalent in code

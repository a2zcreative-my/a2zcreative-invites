-- Migration 003: Add Supabase UUID support
-- Adds supabase_id column to sync with Supabase Auth

-- Add supabase_id to users table (without UNIQUE - SQLite limitation)
ALTER TABLE users ADD COLUMN supabase_id TEXT;

-- Create unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);

-- Note: existing users (like admin) won't have supabase_id yet
-- They will be linked on first Supabase login

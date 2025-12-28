-- Migration 003: Add Supabase UUID support
-- Adds supabase_id column to sync with Supabase Auth

-- Add supabase_id to users table
ALTER TABLE users ADD COLUMN supabase_id TEXT UNIQUE;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);

-- Note: existing users (like admin) won't have supabase_id yet
-- They will be linked on first Supabase login

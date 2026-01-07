-- ============================================
-- Migration: Add User Subscription Fields
-- Run: npx wrangler d1 execute invites-db --local --file=migrations/004_add_user_subscription.sql
-- ============================================

-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN active_package_id TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME;
ALTER TABLE users ADD COLUMN events_remaining INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN subscription_created_at DATETIME;

-- Create index for package lookups
CREATE INDEX IF NOT EXISTS idx_users_package ON users(active_package_id);

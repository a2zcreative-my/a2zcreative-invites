-- ============================================
-- Migration 011: Package Enforcement Columns
-- Run: npx wrangler d1 execute invites-db --local --file=migrations/011_package_enforcement.sql
-- 
-- This migration adds columns needed for server-side package enforcement:
-- - features_json: Stores feature flags as JSON
-- - has_watermark: Server-derived watermark status (not client)
-- - guest_limit: Clearer naming for guest limit
-- - view_limit: Clearer naming for view limit
-- - guest_count: Current guest count for atomic enforcement
-- - view_count: Current view count for atomic enforcement
-- ============================================

-- Add features_json column for storing package features
ALTER TABLE event_access ADD COLUMN features_json TEXT DEFAULT '{}';

-- Add has_watermark column (server-derived, not from client)
-- 1 = watermark ON, 0 = watermark OFF
ALTER TABLE event_access ADD COLUMN has_watermark INTEGER DEFAULT 1;

-- Add explicit limit columns (these may duplicate max_guests/max_views but provide clarity)
-- If max_guests/max_views already exist, these serve as the authoritative source
ALTER TABLE event_access ADD COLUMN guest_limit INTEGER DEFAULT 10;
ALTER TABLE event_access ADD COLUMN view_limit INTEGER DEFAULT 50;

-- Add count columns if not existing (these may duplicate current_guests/current_views)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so these may fail if columns exist
-- In that case, run these manually or skip if current_guests/current_views exist

-- Ensure view_count column exists (use current_views if this fails)
ALTER TABLE event_access ADD COLUMN view_count INTEGER DEFAULT 0;

-- Ensure guest_count column exists (use current_guests if this fails)  
ALTER TABLE event_access ADD COLUMN guest_count INTEGER DEFAULT 0;

-- Create unique index on event_id if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_access_event_id ON event_access(event_id);

-- Migrate existing data: sync has_watermark from remove_watermark
UPDATE event_access 
SET has_watermark = CASE WHEN remove_watermark = 1 THEN 0 ELSE 1 END
WHERE has_watermark IS NULL OR has_watermark = 1;

-- Migrate existing data: sync guest_limit from max_guests
UPDATE event_access 
SET guest_limit = COALESCE(max_guests, 10)
WHERE guest_limit IS NULL OR guest_limit = 10;

-- Migrate existing data: sync view_limit from max_views  
UPDATE event_access 
SET view_limit = COALESCE(max_views, 50)
WHERE view_limit IS NULL OR view_limit = 50;

-- Migrate existing data: sync counts
UPDATE event_access 
SET view_count = COALESCE(current_views, 0),
    guest_count = COALESCE(current_guests, 0)
WHERE view_count = 0 AND guest_count = 0;

-- Set default features_json for existing packages
UPDATE event_access 
SET features_json = '{"qr":false,"qrScanner":false,"exportCsv":false,"multipleEvents":false,"prioritySupport":false}'
WHERE package_id = 'free' AND (features_json IS NULL OR features_json = '{}');

UPDATE event_access 
SET features_json = '{"qr":true,"qrScanner":false,"exportCsv":false,"multipleEvents":false,"prioritySupport":false}'
WHERE package_id = 'basic' AND (features_json IS NULL OR features_json = '{}');

UPDATE event_access 
SET features_json = '{"qr":true,"qrScanner":true,"exportCsv":true,"multipleEvents":false,"prioritySupport":false}'
WHERE package_id IN ('premium', 'popular') AND (features_json IS NULL OR features_json = '{}');

UPDATE event_access 
SET features_json = '{"qr":true,"qrScanner":true,"exportCsv":true,"multipleEvents":true,"prioritySupport":true}'
WHERE package_id = 'business' AND (features_json IS NULL OR features_json = '{}');

-- Add status column to events table if not exists (for pending_payment support)
-- SQLite trick: try to add, will fail silently if exists
-- This may have been added in a previous migration
-- ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'draft';

-- Update events status check constraint to include new statuses
-- Note: SQLite doesn't support modifying constraints, so new events will use the new statuses
-- Existing data with old statuses will still work

-- Add index for efficient active event count queries (for multipleEvents enforcement)
CREATE INDEX IF NOT EXISTS idx_events_created_by_status ON events(created_by, status);

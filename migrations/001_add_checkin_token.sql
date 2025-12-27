-- =============================================
-- Migration: Add checkin_token to guests table
-- Run this to add QR check-in support to existing database
-- =============================================

ALTER TABLE guests ADD COLUMN checkin_token TEXT UNIQUE;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(checkin_token);

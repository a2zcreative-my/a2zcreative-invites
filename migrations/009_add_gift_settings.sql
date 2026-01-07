-- =============================================
-- Migration: Add Gift Settings Fields
-- Allows users to configure their bank/e-wallet details for the Hadiah feature
-- =============================================

-- Add gift-related fields to event_settings table
ALTER TABLE event_settings ADD COLUMN gift_enabled INTEGER DEFAULT 1;
ALTER TABLE event_settings ADD COLUMN gift_bank_name TEXT;
ALTER TABLE event_settings ADD COLUMN gift_account_number TEXT;
ALTER TABLE event_settings ADD COLUMN gift_account_holder TEXT;
ALTER TABLE event_settings ADD COLUMN gift_qr_image_url TEXT;

-- Note: background_music_url and auto_play_music already exist in the schema

-- Migration: Add theme_json column to event_metadata
-- Stores theme preferences including themeId, custom settings, etc.

ALTER TABLE event_metadata ADD COLUMN theme_json TEXT;

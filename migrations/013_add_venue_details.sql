-- Migration 013: Add Venue Details
-- Adds venue_address and map_link columns to events table

ALTER TABLE events ADD COLUMN venue_address TEXT;
ALTER TABLE events ADD COLUMN map_link TEXT;

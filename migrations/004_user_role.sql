-- Migration: Add 'user' role for unpaid signups
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- However, for D1 we can just insert with NULL role (no constraint check in D1)
-- Or we can add the role to the check constraint for new deployments

-- For existing database, we'll update users who haven't paid to role = NULL
-- The application will check role + subscription status together

-- Note: D1 doesn't strictly enforce CHECK constraints at runtime in the same way
-- So we can insert 'user' role and update the schema.sql for new deployments

-- Nothing to do here for existing data - the oauth-callback will now use NULL role
-- for new signups until they pay

SELECT 1; -- Placeholder migration

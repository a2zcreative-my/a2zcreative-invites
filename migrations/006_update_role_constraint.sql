-- Migration: Update users table to allow NULL role
-- Handle foreign key constraints properly

-- Step 1: Disable foreign key checks
PRAGMA foreign_keys = OFF;

-- Step 2: Create new users table with correct constraint
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT NULL CHECK(role IS NULL OR role IN ('super_admin', 'admin', 'event_admin')),
    company_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Copy data from old table
INSERT INTO users_new (id, name, email, password_hash, role, company_id, created_at, updated_at)
SELECT id, name, email, password_hash, role, company_id, created_at, updated_at
FROM users;

-- Step 4: Drop old table
DROP TABLE users;

-- Step 5: Rename new table
ALTER TABLE users_new RENAME TO users;

-- Step 6: Re-enable foreign key checks
PRAGMA foreign_keys = ON;

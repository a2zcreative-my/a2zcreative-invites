-- Migration 007: Add 'user' role to CHECK constraint
-- Updates the role constraint to include 'user' as a valid role for new unpaid users

-- Step 1: Disable foreign key checks
PRAGMA foreign_keys = OFF;

-- Step 2: Create new users table with updated constraint (includes 'user')
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'user' CHECK(role IS NULL OR role IN ('user', 'super_admin', 'admin', 'event_admin')),
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

-- Step 6: Update existing NULL role users to 'user'
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 7: Re-enable foreign key checks
PRAGMA foreign_keys = ON;

-- Migration 008: Consolidate roles - remove legacy 'event_admin'
-- Simplifies role system to: user, admin, super_admin

-- Step 1: Disable foreign key checks
PRAGMA foreign_keys = OFF;

-- Step 2: Create new users table with simplified constraint
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'super_admin')),
    company_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Copy data from old table and map roles
INSERT INTO users_new (id, name, email, password_hash, role, company_id, created_at, updated_at)
SELECT 
    id, 
    name, 
    email, 
    password_hash, 
    CASE WHEN role = 'event_admin' THEN 'admin' ELSE role END, 
    company_id, 
    created_at, 
    updated_at
FROM users;

-- Step 5: Drop old table
DROP TABLE users;

-- Step 6: Rename new table
ALTER TABLE users_new RENAME TO users;

-- Step 7: Re-enable foreign key checks
PRAGMA foreign_keys = ON;

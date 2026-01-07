-- ============================================
-- Migration: Add Payment & Access Control Tables
-- Run: npx wrangler d1 execute invites-db --local --file=migrations/002_add_payment_tables.sql
-- ============================================

-- Payment Orders Table
CREATE TABLE IF NOT EXISTS payment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Order details
    order_ref TEXT UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'MYR',
    package_id TEXT NOT NULL,
    
    -- Payment method
    payment_method TEXT,
    gateway_ref TEXT,
    gateway_url TEXT,
    
    -- Status: pending, processing, verified, failed, refunded, expired
    status TEXT DEFAULT 'pending',
    
    -- DuitNow specific
    receipt_image_url TEXT,
    receipt_hash TEXT,
    receipt_verified_at DATETIME,
    verified_by INTEGER,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    expires_at DATETIME,
    
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Event Access Control Table
CREATE TABLE IF NOT EXISTS event_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL UNIQUE,
    payment_order_id INTEGER,
    
    -- Package details
    package_id TEXT NOT NULL DEFAULT 'free',
    package_name TEXT,
    
    -- Tier limits
    max_guests INTEGER DEFAULT 10,
    max_views INTEGER DEFAULT 50,
    max_rsvps INTEGER DEFAULT 10,
    
    -- Feature flags
    qr_enabled INTEGER DEFAULT 0,
    checkin_enabled INTEGER DEFAULT 0,
    export_enabled INTEGER DEFAULT 0,
    custom_slug INTEGER DEFAULT 0,
    remove_watermark INTEGER DEFAULT 0,
    whatsapp_blast INTEGER DEFAULT 0,
    
    -- Access window
    paid_at DATETIME,
    activated_at DATETIME,
    expires_at DATETIME,
    
    -- Usage tracking
    current_guests INTEGER DEFAULT 0,
    current_views INTEGER DEFAULT 0,
    current_rsvps INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (payment_order_id) REFERENCES payment_orders(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id INTEGER,
    
    -- Action details
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id INTEGER,
    details TEXT,
    
    -- Request info
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Download Tokens Table (one-time use)
CREATE TABLE IF NOT EXISTS download_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Token details
    token TEXT UNIQUE NOT NULL,
    file_type TEXT NOT NULL,
    
    -- Usage
    used_at DATETIME,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 1,
    
    -- Expiry
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Pricing Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ms TEXT NOT NULL,
    description TEXT,
    description_ms TEXT,
    
    -- Pricing
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'MYR',
    
    -- Limits
    max_guests INTEGER NOT NULL,
    max_views INTEGER NOT NULL,
    max_rsvps INTEGER NOT NULL,
    
    -- Features
    qr_enabled INTEGER DEFAULT 0,
    checkin_enabled INTEGER DEFAULT 0,
    export_enabled INTEGER DEFAULT 0,
    custom_slug INTEGER DEFAULT 0,
    remove_watermark INTEGER DEFAULT 0,
    whatsapp_blast INTEGER DEFAULT 0,
    
    -- Display
    is_popular INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add status column to events if not exists
-- SQLite doesn't support IF NOT EXISTS for columns, handle in code

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_event ON payment_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_ref ON payment_orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_event_access_event ON event_access(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);

-- Insert default packages
INSERT OR IGNORE INTO packages (id, name, name_ms, price_cents, max_guests, max_views, max_rsvps, qr_enabled, checkin_enabled, export_enabled, custom_slug, remove_watermark, sort_order, is_popular) VALUES
('free', 'Free Trial', 'Percuma', 0, 10, 50, 10, 0, 0, 0, 0, 0, 0, 0),
('basic', 'Basic', 'Asas', 4900, 100, 500, 100, 1, 0, 0, 0, 1, 1, 0),
('premium', 'Premium', 'Premium', 9900, 300, 2000, 300, 1, 1, 1, 1, 1, 2, 1),
('business', 'Business', 'Bisnes', 19900, 1000, 10000, 1000, 1, 1, 1, 1, 1, 3, 0);

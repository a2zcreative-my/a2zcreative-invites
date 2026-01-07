-- =============================================
-- A2Z Creative Invites - D1 Database Schema
-- Phase 1: Public Invitation + RSVP
-- =============================================

-- Users table (for future auth integration)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT NULL CHECK(role IS NULL OR role IN ('super_admin', 'admin', 'event_admin')),
    company_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table (for corporate tenants)
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    subscription_plan TEXT DEFAULT 'free' CHECK(subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
    max_events INTEGER DEFAULT 5,
    max_guests_per_event INTEGER DEFAULT 200,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event types with default themes
CREATE TABLE IF NOT EXISTS event_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    default_theme TEXT DEFAULT 'elegant-gold',
    icon TEXT
);

-- Insert default event types
INSERT OR IGNORE INTO event_types (id, name, default_theme, icon) VALUES 
    (1, 'Wedding', 'elegant-gold', '💒'),
    (2, 'Corporate', 'professional-blue', '🏢'),
    (3, 'Family', 'warm-coral', '👨‍👩‍👧‍👦'),
    (4, 'Birthday', 'festive-purple', '🎂'),
    (5, 'Community', 'nature-green', '🌿');

-- Events table (core entity)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type_id INTEGER NOT NULL DEFAULT 1,
    company_id INTEGER,
    created_by INTEGER,
    
    -- Event Details
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    
    -- Location
    venue_name TEXT,
    venue_address TEXT,
    map_link TEXT,
    map_embed_url TEXT,
    
    -- Couple/Host Names (for wedding)
    host_name_1 TEXT,
    host_name_2 TEXT,
    
    -- Parents (for wedding)
    parent_names_1 TEXT,
    parent_names_2 TEXT,
    
    -- Settings
    rsvp_deadline DATE,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'archived')),
    
    -- Tenant isolation
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_type_id) REFERENCES event_types(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Event settings/customization
CREATE TABLE IF NOT EXISTS event_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER UNIQUE NOT NULL,
    
    -- Theme
    theme_name TEXT DEFAULT 'elegant-gold',
    primary_color TEXT DEFAULT '#d4af37',
    secondary_color TEXT DEFAULT '#0a192f',
    font_family TEXT DEFAULT 'Cormorant Garamond',
    
    -- Media
    background_image_url TEXT,
    background_music_url TEXT,
    auto_play_music INTEGER DEFAULT 0,
    
    -- RSVP Settings
    language TEXT DEFAULT 'ms',
    allow_plus_one INTEGER DEFAULT 1,
    max_plus_one INTEGER DEFAULT 5,
    show_guest_count INTEGER DEFAULT 1,
    require_phone INTEGER DEFAULT 1,
    
    -- Display Options
    show_countdown INTEGER DEFAULT 1,
    show_schedule INTEGER DEFAULT 1,
    show_wishes INTEGER DEFAULT 1,
    show_gallery INTEGER DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Invitations (public links)
CREATE TABLE IF NOT EXISTS invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    
    -- Public access
    public_slug TEXT UNIQUE NOT NULL,
    qr_code_data TEXT,
    
    -- Content
    invitation_title TEXT,
    invitation_message TEXT,
    verse_text TEXT,
    verse_reference TEXT,
    hashtag TEXT,
    
    -- Security
    access_password TEXT,
    expires_at DATETIME,
    is_active INTEGER DEFAULT 1,
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event schedule/itinerary
CREATE TABLE IF NOT EXISTS event_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    time_slot TEXT NOT NULL,
    activity TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Guests
CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    
    -- Guest info
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    
    -- Attendance
    pax INTEGER DEFAULT 1,
    is_walk_in INTEGER DEFAULT 0,
    
    -- QR Check-in
    checkin_token TEXT UNIQUE,
    
    -- Tenant isolation (denormalized)
    company_id INTEGER,
    created_by INTEGER,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- RSVP responses
CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER UNIQUE NOT NULL,
    event_id INTEGER NOT NULL,
    
    response TEXT NOT NULL CHECK(response IN ('yes', 'no', 'maybe')),
    pax INTEGER DEFAULT 1,
    arrival_time TEXT,
    dietary_requirements TEXT,
    message TEXT,
    
    responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Attendance/Check-in logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    
    check_in_method TEXT DEFAULT 'manual' CHECK(check_in_method IN ('qr', 'manual', 'self')),
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    checked_in_by INTEGER,
    
    notes TEXT,
    
    UNIQUE(guest_id, event_id),
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Guest messages/wishes
CREATE TABLE IF NOT EXISTS guest_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    
    guest_name TEXT NOT NULL,
    message TEXT NOT NULL,
    
    is_approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event media/gallery
CREATE TABLE IF NOT EXISTS event_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    
    media_type TEXT DEFAULT 'photo' CHECK(media_type IN ('photo', 'video')),
    file_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Contact persons for event
CREATE TABLE IF NOT EXISTS event_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    
    role TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_link TEXT,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_guests_event ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(public_slug);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_event ON guest_messages(event_id);

-- =============================================
-- Sessions table for server-side auth
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- =============================================
-- Password Reset Tokens
-- =============================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

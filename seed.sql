-- =============================================
-- Seed Data for Development/Demo
-- =============================================

-- Create a demo user
-- NOTE: Password 'Admin@2025' will be auto-hashed on first login
INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES 
    (1, 'Demo Admin', 'demo@a2zcreative.my', NULL, 'admin'),
    (999, 'Super Admin', 'admin@a2zcreative.my', 'Admin@2025', 'super_admin');

-- Force update to ensure password is set (in case row existed)
-- Password will be automatically hashed on first successful login
UPDATE users SET password_hash = 'Admin@2025' WHERE email = 'admin@a2zcreative.my';


-- Create a demo event (Wedding)
INSERT OR IGNORE INTO events (
    id, event_type_id, created_by, event_name, event_date, start_time, end_time,
    venue_name, venue_address, map_link, map_embed_url,
    host_name_1, host_name_2, parent_names_1, parent_names_2,
    rsvp_deadline, status
) VALUES (
    1, 1, 1, 'Majlis Perkahwinan', '2025-02-22', '11:00', '16:00',
    'Dewan Seri Angkasa', 'Jalan Angkasa, 50470 Kuala Lumpur', 
    'https://maps.google.com/?q=Dewan+Seri+Angkasa',
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.123!2d101.123!3d3.123',
    'AIMAN', 'RAFHANAH',
    'EN. AHMAD BIN MOHD & PN. FATIMAH BINTI ALI',
    'EN. RAHMAN BIN HASSAN & PN. SITI BINTI YUSOF',
    '2025-02-15', 'active'
);

-- Create event settings
INSERT OR IGNORE INTO event_settings (
    event_id, theme_name, primary_color, secondary_color, font_family,
    language, allow_plus_one, max_plus_one, show_countdown, show_wishes
) VALUES (
    1, 'elegant-gold', '#d4af37', '#0a192f', 'Cormorant Garamond',
    'ms', 1, 5, 1, 1
);

-- Create invitation with public slug
INSERT OR IGNORE INTO invitations (
    id, event_id, public_slug, invitation_title, invitation_message,
    verse_text, verse_reference, hashtag, is_active
) VALUES (
    1, 1, 'aiman-rafhanah',
    'PERUTUSAN RAJA SEHARI',
    'Dengan segala hormatnya kami menjemput Dato'' / Datin / Tuan / Puan / Encik / Cik ke majlis perkahwinan putera kami.',
    '"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."',
    'Ar-Rum: 21',
    '#RafhanahFoundHerMan',
    1
);

-- Create event schedule
INSERT OR IGNORE INTO event_schedule (event_id, time_slot, activity, sort_order) VALUES 
    (1, '11:00 AM', 'Ketibaan Tetamu / Jamuan Makan', 1),
    (1, '12:30 PM', 'Ketibaan Pengantin / Acara Menepung Tawar', 2),
    (1, '04:00 PM', 'Majlis Bersurai', 3);

-- Create contacts
INSERT OR IGNORE INTO event_contacts (event_id, role, name, phone, whatsapp_link) VALUES 
    (1, 'Bapa Pengantin Lelaki', 'En. Ahmad', '60123456789', 'https://wa.me/60123456789'),
    (1, 'Ibu Pengantin Lelaki', 'Pn. Fatimah', '60198765432', 'https://wa.me/60198765432');

-- Sample guest messages
INSERT OR IGNORE INTO guest_messages (event_id, guest_name, message) VALUES 
    (1, 'Siti Aminah', 'Tahniah kepada pengantin! Semoga berbahagia hingga ke akhir hayat. ❤️'),
    (1, 'Ahmad Faizal', 'Selamat pengantin baru! Semoga kekal hingga ke Jannah.');

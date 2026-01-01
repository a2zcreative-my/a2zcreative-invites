/**
 * A2Z Creative - Preview Loader
 * Receives form data via PostMessage and renders preview
 * (Does NOT fetch from API - receives data from parent wizard)
 */

// Event Type Content Configuration - Controls what shows for each event type
const EVENT_CONTENT_CONFIG = {
    1: { // Perkahwinan
        showParents: true,
        showDoa: true,
        showVerse: true,
        showAmpersand: true,
        showWishes: true,
        doaTitle: 'Doa Buat Pengantin',
        introText: 'Dengan segala hormatnya kami menjemput Dato\' / Datin / Tuan / Puan / Encik / Cik ke majlis perkahwinan putera/puteri kami:'
    },
    2: { // Korporat
        showParents: false,
        showDoa: false,
        showVerse: false,
        showAmpersand: false,
        showWishes: true,
        doaTitle: '',
        introText: 'Dengan hormatnya, kami menjemput Tuan/Puan ke majlis:'
    },
    3: { // Keluarga
        showParents: false,
        showDoa: false,
        showVerse: false,
        showAmpersand: false,
        showWishes: true,
        doaTitle: '',
        introText: 'Dengan penuh hormat, kami menjemput keluarga dan sahabat ke majlis:'
    },
    4: { // Hari Lahir
        showParents: false,
        showDoa: false,
        showVerse: false,
        showAmpersand: false,
        showAgeDisplay: true,
        showWishes: true,
        doaTitle: '',
        introText: 'Anda dijemput ke majlis sambutan hari lahir:'
    },
    5: { // Komuniti
        showParents: false,
        showDoa: false,
        showVerse: false,
        showAmpersand: false,
        showWishes: true,
        doaTitle: '',
        introText: 'Dengan hormatnya, anda dijemput ke majlis:'
    }
};

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
        'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

    return {
        day: days[date.getDay()],
        date: date.getDate(),
        month: months[date.getMonth()],
        year: date.getFullYear(),
        full: `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`,
        monthYear: `${months[date.getMonth()].toUpperCase()} ${date.getFullYear()}`
    };
}

// Generate calendar strip
function generateCalendarStrip(eventDate) {
    const date = new Date(eventDate);
    const strip = document.getElementById('calendar-strip');
    if (!strip) return;

    strip.innerHTML = '';
    const days = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

    for (let i = -2; i <= 2; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() + i);

        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day' + (i === 0 ? ' active' : '');
        dayEl.innerHTML = `
            <span class="day-name">${days[d.getDay()]}</span>
            <span class="day-number">${d.getDate()}</span>
        `;
        strip.appendChild(dayEl);
    }
}

// Helper to set text content
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
}

function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html || '';
}

// Render preview with form data
function renderPreview(data) {
    console.log('Rendering preview with data:', data);

    // Apply theme to .invitation-page element for CSS selectors to work
    if (data.theme) {
        const invitationPage = document.querySelector('.invitation-page');
        if (invitationPage) {
            invitationPage.dataset.theme = data.theme;
        } else {
            document.body.dataset.theme = data.theme;
        }
    }

    // Format date
    const dateInfo = formatDate(data.eventDate);

    // Event type logic
    const eventType = parseInt(data.eventType) || 1;
    const isWedding = eventType === 1;
    const isBirthday = eventType === 4;

    // Cover section
    setText('cover-label', data.inviteTitle || 'Jemputan Istimewa');

    // Handle name display based on event type
    const coverName1 = document.getElementById('cover-name1');
    const coverName2 = document.getElementById('cover-name2');
    const coverAmpersand = document.querySelector('.cover-content .ampersand');

    if (isWedding && data.hostName2) {
        // Wedding: First Name 1 & First Name 2
        setText('cover-name1', (data.hostName1 || 'PENGANTIN').split(' ')[0].toUpperCase());
        setText('cover-name2', data.hostName2.split(' ')[0].toUpperCase());
        if (coverName2) coverName2.style.display = '';
        if (coverAmpersand) coverAmpersand.style.display = '';
    } else if (isBirthday && data.hostName2) {
        // Birthday: Name + Age display (using dedicated age element)
        setText('cover-name1', (data.hostName1 || 'NAMA').toUpperCase());
        if (coverName2) coverName2.style.display = 'none';
        if (coverAmpersand) coverAmpersand.style.display = 'none';
        const coverAge = document.getElementById('cover-age');
        if (coverAge) {
            coverAge.textContent = `${data.hostName2} Tahun`;
            coverAge.style.display = '';
        }
    } else {
        // Other event types: Full Name only
        setText('cover-name1', (data.hostName1 || 'NAMA').toUpperCase());
        if (coverName2) coverName2.style.display = 'none';
        if (coverAmpersand) coverAmpersand.style.display = 'none';
    }

    setText('cover-date', dateInfo.day ? `${dateInfo.day.toUpperCase()} • ${data.eventDate?.replace(/-/g, '.')}` : '');

    // Hero section
    setText('invite-label', data.inviteTitle || 'Jemputan Istimewa');

    const heroName1 = document.getElementById('name1');
    const heroName2 = document.getElementById('name2');
    const heroAmpersand = document.querySelector('.hero-section .ampersand');

    if (isWedding && data.hostName2) {
        // Wedding: First Name 1 & First Name 2
        setText('name1', (data.hostName1 || '').split(' ')[0].toUpperCase());
        setText('name2', data.hostName2.split(' ')[0].toUpperCase());
        if (heroName2) heroName2.style.display = '';
        if (heroAmpersand) heroAmpersand.style.display = '';
    } else if (isBirthday && data.hostName2) {
        // Birthday: Name + Age (using dedicated age element)
        setText('name1', (data.hostName1 || '').toUpperCase());
        if (heroName2) heroName2.style.display = 'none';
        if (heroAmpersand) heroAmpersand.style.display = 'none';
        const ageDisplay = document.getElementById('age-display');
        if (ageDisplay) {
            ageDisplay.textContent = `${data.hostName2} Tahun`;
            ageDisplay.style.display = '';
        }
    } else {
        // Other: Full Name only
        setText('name1', (data.hostName1 || '').toUpperCase());
        if (heroName2) heroName2.style.display = 'none';
        if (heroAmpersand) heroAmpersand.style.display = 'none';
    }

    // Calendar
    setText('calendar-month', dateInfo.monthYear || '');
    setText('full-date', dateInfo.full || '');
    if (data.eventDate) {
        generateCalendarStrip(data.eventDate);
    }

    // Hashtag
    setText('hashtag', data.hashtag || '');

    // Parents section (Wedding only) - Use config instead of isWedding check
    const parentsSection = document.getElementById('parents');
    if (parentsSection) {
        if (isWedding && data.parentNames1) {
            parentsSection.style.display = '';
            setText('parent1', data.parentNames1 || '');
            setText('parent2', data.parentNames2 || '');
            setText('full-name1', (data.hostName1 || '').toUpperCase());
            setText('full-name2', (data.hostName2 || '').toUpperCase());
        } else {
            parentsSection.style.display = 'none';
        }
    }

    // Verse - Only show for wedding when there's verse text AND config allows
    const verseSection = document.querySelector('.verse-section');
    if (verseSection) {
        if (isWedding && data.verseText) {
            verseSection.style.display = '';
            setText('verse-text', data.verseText);
            setText('verse-ref', data.verseRef || '');
        } else {
            // Hide for non-wedding events regardless of verse text
            verseSection.style.display = 'none';
        }
    }

    // Venue
    setText('venue-name', (data.venueName || 'LOKASI MAJLIS').toUpperCase());
    setHtml('venue-address', (data.venueAddress || '').replace(/\n/g, '<br>'));

    // Schedule - FIXED: Use correct element ID 'schedule-list'
    const scheduleList = document.getElementById('schedule-list');
    if (scheduleList && data.schedule && data.schedule.length > 0) {
        scheduleList.innerHTML = data.schedule.map(item => `
            <div class="schedule-item">
                <span class="schedule-time">${item.time || ''}</span>
                <span class="schedule-dot"></span>
                <span class="schedule-activity">${item.activity || ''}</span>
            </div>
        `).join('');
    }

    // Map handling - Generate embed URL from map link
    const mapIframe = document.getElementById('map-iframe');
    const mapContainer = document.getElementById('map-container');

    if (mapIframe && data.mapLink) {
        // Try to extract coordinates from Google Maps link
        const coordsMatch = data.mapLink.match(/@(-?[\d.]+),(-?[\d.]+)/);
        if (coordsMatch) {
            const lat = coordsMatch[1];
            const lng = coordsMatch[2];
            mapIframe.src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2smy!4v1700000000000`;
        } else if (data.venueName || data.venueAddress) {
            // Use venue address for search
            const query = encodeURIComponent((data.venueName || '') + ' ' + (data.venueAddress || ''));
            mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`;
        }
    } else if (mapIframe && (data.venueName || data.venueAddress)) {
        // No map link but has venue - try address search
        const query = encodeURIComponent((data.venueName || '') + ' ' + (data.venueAddress || ''));
        mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`;
    }

    // Navigation buttons
    if (data.mapLink) {
        const googleBtn = document.getElementById('google-maps-btn');
        const wazeBtn = document.getElementById('waze-btn');

        if (googleBtn) googleBtn.href = data.mapLink;
        if (wazeBtn) {
            const coordsMatch = data.mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordsMatch) {
                wazeBtn.href = `https://waze.com/ul?ll=${coordsMatch[1]},${coordsMatch[2]}&navigate=yes`;
            } else {
                wazeBtn.href = `https://waze.com/ul?q=${encodeURIComponent(data.venueAddress || data.venueName || '')}`;
            }
        }
    }

    // Contacts
    const contactList = document.getElementById('contactList');
    if (contactList && data.contacts && data.contacts.length > 0) {
        contactList.innerHTML = data.contacts.map(c => `
            <div class="contact-card">
                <p class="contact-role">${c.role || ''}</p>
                <p class="contact-name">${c.name || ''}</p>
                <a href="tel:${c.phone || ''}" class="contact-btn">
                    <i data-lucide="phone"></i>
                    ${c.phone || ''}
                </a>
            </div>
        `).join('');
    }

    // Get event type config
    const config = EVENT_CONTENT_CONFIG[eventType] || EVENT_CONTENT_CONFIG[1];

    // Doa/Prayer Section - Event type specific
    const footerSection = document.querySelector('.footer-section');
    const prayerTitle = document.querySelector('.prayer-title');
    const prayerText = document.getElementById('prayer-text');
    if (footerSection) {
        if (config.showDoa) {
            // Show for wedding only
            footerSection.style.display = '';
            if (prayerTitle) prayerTitle.textContent = config.doaTitle || 'Doa Buat Pengantin';
        } else {
            // Hide for non-wedding - just show countdown
            if (prayerTitle) prayerTitle.style.display = 'none';
            if (prayerText) prayerText.style.display = 'none';
        }
    }

    // Wishes Section - Clear sample wishes (should be empty by default in preview)
    const wishesContainer = document.getElementById('wishesContainer');
    if (wishesContainer) {
        // In preview mode, clear sample wishes (real wishes loaded from API in live view)
        wishesContainer.innerHTML = '<p style="opacity: 0.5; text-align: center;">Belum ada ucapan</p>';
    }

    // Gift/Hadiah Section Mapping
    if (data.giftEnabled) {
        setText('bankName', data.giftBankName || '-');
        setText('accNumber', data.giftAccountNumber || '-');
        setText('accHolder', data.giftAccountHolder || '-');

        // Ensure nav button is visible
        const giftNavBtn = document.getElementById('giftBtn');
        if (giftNavBtn) giftNavBtn.style.display = 'flex';
    } else {
        // Hide nav button if gift disabled
        const giftNavBtn = document.getElementById('giftBtn');
        if (giftNavBtn) giftNavBtn.style.display = 'none';
    }

    // Update intro text based on event type
    const introText = document.getElementById('intro-text');
    if (introText && config.introText) {
        introText.textContent = config.introText;
    }

    // Re-init icons
    if (window.lucide) lucide.createIcons();
}

// Listen for messages from parent (wizard)
window.addEventListener('message', (event) => {
    console.log('Preview received message:', event.data);

    if (event.data && event.data.type === 'preview') {
        renderPreview(event.data.data);
    }
});

// Signal ready to parent
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preview loader ready');

    // Read URL parameters for initial preview
    const urlParams = new URLSearchParams(window.location.search);
    const eventType = urlParams.get('type') || '1';
    const theme = urlParams.get('theme') || 'elegant-gold';

    // Apply theme immediately
    const invitationPage = document.querySelector('.invitation-page');
    if (invitationPage) {
        invitationPage.dataset.theme = theme;
    } else {
        document.body.dataset.theme = theme;
    }

    // Event type labels for default preview
    const eventTypeLabels = {
        '1': { label: 'Perutusan Raja Sehari', name1: 'PENGANTIN', name2: 'PENGANTIN', isWedding: true },
        '2': { label: 'Jemputan Korporat', name1: 'MAJLIS ANDA', name2: '', isWedding: false },
        '3': { label: 'Jemputan Keluarga', name1: 'KELUARGA', name2: '', isWedding: false },
        '4': { label: 'Jemputan Hari Jadi', name1: 'NAMA', name2: '', isWedding: false },
        '5': { label: 'Jemputan Komuniti', name1: 'PROGRAM', name2: '', isWedding: false }
    };

    const typeConfig = eventTypeLabels[eventType] || eventTypeLabels['1'];

    // Render default placeholder content based on event type
    renderPreview({
        eventType: eventType,
        theme: theme,
        inviteTitle: typeConfig.label,
        hostName1: typeConfig.name1,
        hostName2: typeConfig.name2,
        eventDate: new Date().toISOString().split('T')[0],
        hashtag: '#MajlisAnda',
        venueName: 'Lokasi Majlis',
        venueAddress: 'Alamat akan dipaparkan di sini'
    });

    // Setup "Buka Jemputan" button handler
    const openBtn = document.getElementById('openInvitation');
    const coverSection = document.querySelector('.cover-section');
    const mainContent = document.getElementById('mainContent');
    const bottomNav = document.getElementById('bottomNav');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            // Add open class to trigger door animation
            if (coverSection) {
                coverSection.classList.add('open');

                // After animation, hide cover and show content
                setTimeout(() => {
                    coverSection.classList.add('hidden');
                    document.body.style.overflow = 'auto';  // Re-enable scrolling
                    if (mainContent) {
                        mainContent.classList.add('visible');
                    }
                    if (bottomNav) {
                        bottomNav.classList.remove('hidden');
                    }
                }, 1200);
            }
        });
    }

    // Prevent cover section scroll until opened
    if (coverSection) {
        document.body.style.overflow = 'hidden';
    }

    // =============================================
    // Navigation & Modals
    // =============================================

    // Contact Modal
    const contactNavBtn = document.getElementById('contactNavBtn');
    const contactModal = document.getElementById('contactModal');
    const closeContact = document.getElementById('closeContactModal');

    if (contactNavBtn && contactModal) {
        contactNavBtn.addEventListener('click', () => {
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeContact && contactModal) {
        closeContact.addEventListener('click', () => {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Gift Modal
    const giftBtn = document.getElementById('giftBtn');
    const giftModal = document.getElementById('giftModal');
    const closeGift = document.getElementById('closeGiftModal');

    if (giftBtn && giftModal) {
        giftBtn.addEventListener('click', () => {
            giftModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeGift && giftModal) {
        closeGift.addEventListener('click', () => {
            giftModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Scroll Buttons (Lokasi, RSVP)
    document.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Tell parent we're ready
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'preview-ready' }, '*');
    }
});

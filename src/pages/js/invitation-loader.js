/**
 * A2Z Creative - Dynamic Invitation Loader
 * Fetches invitation data from API and populates the page
 */

// Extract slug from URL path (e.g., /inv/ahmad-siti → ahmad-siti)
function getSlugFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/inv\/([^\/]+)\/?$/);
    return match ? match[1] : null;
}

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

    // Show 5 days centered on event date
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

// Generate save-to-calendar URL
function generateCalendarUrl(event) {
    const startDate = new Date(`${event.event_date}T${event.start_time || '11:00'}`);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours

    const formatICS = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//A2Z Creative//Digital Invitation//MS',
        'BEGIN:VEVENT',
        `DTSTART:${formatICS(startDate)}`,
        `DTEND:${formatICS(endDate)}`,
        `SUMMARY:${event.event_name || 'Majlis'}`,
        `LOCATION:${event.venue_name || ''}, ${event.venue_address || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
}

// Populate invitation data
function populateInvitation(data) {
    const { event, invitation, schedule, contacts, messages, settings } = data;

    // Apply theme from settings
    if (settings?.theme_name) {
        // Theme must be applied to .invitation-page element (body) for CSS selectors to work
        const invitationPage = document.querySelector('.invitation-page');
        if (invitationPage) {
            invitationPage.dataset.theme = settings.theme_name;
            console.log('Applied theme:', settings.theme_name);
        } else {
            document.body.dataset.theme = settings.theme_name;
            console.log('Applied theme to body:', settings.theme_name);
        }
    }

    // Format date
    const dateInfo = formatDate(event.event_date);

    // Event type detection
    const eventType = event.event_type_id;
    const isWedding = eventType === 1;
    const isBirthday = eventType === 4;

    // Cover section
    setText('cover-label', invitation.invitation_title || 'Jemputan Istimewa');

    // Name display logic based on event type
    const coverAmpersand = document.querySelector('.cover-content .ampersand');
    const coverAge = document.getElementById('cover-age');

    if (isWedding) {
        // Wedding: First Name 1 & First Name 2
        setText('cover-name1', event.host_name_1?.split(' ')[0]?.toUpperCase() || 'PENGANTIN');
        setText('cover-name2', event.host_name_2?.split(' ')[0]?.toUpperCase() || 'PENGANTIN');
        if (coverAmpersand) coverAmpersand.style.display = '';
    } else if (isBirthday && event.host_name_2) {
        // Birthday: Full Name + Age
        setText('cover-name1', event.host_name_1?.toUpperCase() || 'NAMA');
        const coverName2El = document.getElementById('cover-name2');
        if (coverName2El) coverName2El.style.display = 'none';
        if (coverAmpersand) coverAmpersand.style.display = 'none';
        if (coverAge) {
            coverAge.textContent = `${event.host_name_2} Tahun`;
            coverAge.style.display = '';
        }
    } else {
        // Other: Full Company/Organization Name
        setText('cover-name1', event.host_name_1?.toUpperCase() || 'NAMA');
        const coverName2El = document.getElementById('cover-name2');
        if (coverName2El) coverName2El.style.display = 'none';
        if (coverAmpersand) coverAmpersand.style.display = 'none';
    }

    setText('cover-date', `${dateInfo.day?.toUpperCase()} • ${event.event_date?.replace(/-/g, '.')}`);

    // Hero section - same logic
    setText('invite-label', invitation.invitation_title || 'Jemputan Istimewa');

    const heroAmpersand = document.querySelector('.hero-section .ampersand');
    const ageDisplay = document.getElementById('age-display');

    if (isWedding) {
        setText('name1', event.host_name_1?.split(' ')[0]?.toUpperCase() || '');
        setText('name2', event.host_name_2?.split(' ')[0]?.toUpperCase() || '');
        if (heroAmpersand) heroAmpersand.style.display = '';
    } else if (isBirthday && event.host_name_2) {
        setText('name1', event.host_name_1?.toUpperCase() || '');
        const name2El = document.getElementById('name2');
        if (name2El) name2El.style.display = 'none';
        if (heroAmpersand) heroAmpersand.style.display = 'none';
        if (ageDisplay) {
            ageDisplay.textContent = `${event.host_name_2} Tahun`;
            ageDisplay.style.display = '';
        }
    } else {
        setText('name1', event.host_name_1?.toUpperCase() || '');
        const name2El = document.getElementById('name2');
        if (name2El) name2El.style.display = 'none';
        if (heroAmpersand) heroAmpersand.style.display = 'none';
    }

    setText('calendar-month', dateInfo.monthYear);
    setText('full-date', dateInfo.full);
    setText('hashtag', invitation.hashtag ? `#${invitation.hashtag.replace(/^#/, '')}` : '');

    // Generate calendar strip
    if (event.event_date) {
        generateCalendarStrip(event.event_date);
    }

    // Save date button
    const saveDateBtn = document.getElementById('saveDateBtn');
    if (saveDateBtn && event.event_date) {
        saveDateBtn.href = generateCalendarUrl(event);
        saveDateBtn.download = 'jemputan.ics';
    }

    // Verse section
    if (invitation.verse_text) {
        setText('verse-text', `"${invitation.verse_text}"`);
        setText('verse-ref', invitation.verse_reference ? `(${invitation.verse_reference})` : '');
    } else {
        // Hide verse section if no verse
        const verseSection = document.querySelector('.verse-section');
        if (verseSection) verseSection.style.display = 'none';
    }

    // Event Type Logic (isWedding and isBirthday already declared above)
    // 1: Perkahwinan (Dual Host, Parents visible)
    // 2: Korporat (Single Host, No Parents)
    // 3: Keluarga (Single Host, No Parents)
    // 4: Hari Lahir (Single Host, No Parents - host2 is Age)
    // 5: Komuniti (Single Host, No Parents)

    // Parents section
    const parentsSection = document.getElementById('parents');
    if (isWedding && event.parent_names_1) {
        if (parentsSection) parentsSection.style.display = 'block';
        setText('parent1', event.parent_names_1);
        setText('parent2', event.parent_names_2 || '');
        setText('full-name1', event.host_name_1?.toUpperCase() || '');
        setText('full-name2', event.host_name_2?.toUpperCase() || '');

        // Hide second parent if not present
        const parent2 = document.getElementById('parent2');
        if (parent2 && !event.parent_names_2) {
            parent2.style.display = 'none';
            const ampersand = parent2.previousElementSibling;
            if (ampersand?.textContent === '&') ampersand.style.display = 'none';
        }
    } else {
        // Hide parents section for non-weddings
        if (parentsSection) parentsSection.style.display = 'none';
    }

    // Host Names Display
    if (isWedding) {
        // Wedding: Show both names with Ampersand
        setText('cover-name1', event.host_name_1?.split(' ')[0]?.toUpperCase() || '');
        setText('cover-name2', event.host_name_2?.split(' ')[0]?.toUpperCase() || '');
        setText('name1', event.host_name_1?.split(' ')[0]?.toUpperCase() || '');
        setText('name2', event.host_name_2?.split(' ')[0]?.toUpperCase() || '');

        // Ensure ampersands are visible
        const coverAmp = document.getElementById('cover-name2')?.previousElementSibling;
        if (coverAmp?.classList.contains('ampersand')) coverAmp.style.display = 'inline';
        const heroAmp = document.getElementById('name2')?.previousElementSibling;
        if (heroAmp?.classList.contains('ampersand')) heroAmp.style.display = 'inline';

    } else {
        // Non-wedding: Single Host Mode
        // Use full name for host 1 (e.g. Company Name, Birthday Person)
        setText('cover-name1', event.host_name_1?.toUpperCase() || '');
        setText('name1', event.host_name_1?.toUpperCase() || '');

        // Hide Host 2 elements
        const coverName2 = document.getElementById('cover-name2');
        if (coverName2) coverName2.style.display = 'none';
        const coverAmp = coverName2?.previousElementSibling;
        if (coverAmp?.classList.contains('ampersand')) coverAmp.style.display = 'none';

        const heroName2 = document.getElementById('name2');
        if (heroName2) heroName2.style.display = 'none';
        const heroAmp = heroName2?.previousElementSibling;
        if (heroAmp?.classList.contains('ampersand')) heroAmp.style.display = 'none';
    }

    // Schedule section
    const scheduleList = document.getElementById('schedule-list');
    if (scheduleList && schedule && schedule.length > 0) {
        scheduleList.innerHTML = schedule.map(item => `
            <div class="schedule-item">
                <span class="schedule-time">${item.time_slot}</span>
                <span class="schedule-dot"></span>
                <span class="schedule-activity">${item.activity}</span>
            </div>
        `).join('');
    }

    // Venue section
    setText('venue-name', event.venue_name?.toUpperCase() || 'LOKASI MAJLIS');
    setHtml('venue-address', event.venue_address?.replace(/\n/g, '<br>') || '');

    // Map - Generate embed URL from map_link or venue address
    const mapIframe = document.getElementById('map-iframe');
    const mapContainer = document.getElementById('map-container');

    if (mapIframe) {
        if (event.map_embed_url) {
            // Use provided embed URL directly
            mapIframe.src = event.map_embed_url;
        } else if (event.map_link) {
            // Try to extract coordinates from Google Maps link
            const coordsMatch = event.map_link.match(/@(-?[\d.]+),(-?[\d.]+)/);
            if (coordsMatch) {
                // Create embed URL from coordinates
                const lat = coordsMatch[1];
                const lng = coordsMatch[2];
                mapIframe.src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2smy!4v1700000000000`;
            } else if (event.venue_address) {
                // Use venue address search
                mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(event.venue_name + ' ' + event.venue_address)}`;
            } else {
                // Fallback - hide iframe
                if (mapContainer) mapContainer.style.display = 'none';
            }
        } else if (event.venue_address) {
            // Use venue address search
            mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(event.venue_name + ' ' + event.venue_address)}`;
        } else {
            // No map data - hide container
            if (mapContainer) mapContainer.style.display = 'none';
        }
    }

    // Navigation buttons
    if (event.map_link) {
        const googleBtn = document.getElementById('google-maps-btn');
        const wazeBtn = document.getElementById('waze-btn');

        if (googleBtn) googleBtn.href = event.map_link;
        if (wazeBtn) {
            // Convert Google Maps link to Waze - simplistic approach
            const coordsMatch = event.map_link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordsMatch) {
                wazeBtn.href = `https://waze.com/ul?ll=${coordsMatch[1]},${coordsMatch[2]}&navigate=yes`;
            } else {
                wazeBtn.href = `https://waze.com/ul?q=${encodeURIComponent(event.venue_address || event.venue_name || '')}`;
            }
        }
    }

    // Contacts (in modal)
    const contactList = document.getElementById('contactList');
    if (contactList && contacts && contacts.length > 0) {
        contactList.innerHTML = contacts.map(c => `
            <div class="contact-card">
                <p class="contact-role">${c.role}</p>
                <p class="contact-name">${c.name}</p>
                <a href="${c.whatsapp_link || `tel:${c.phone}`}" class="contact-btn">
                    <i data-lucide="phone"></i>
                    ${c.phone}
                </a>
            </div>
        `).join('');
    }

    // Wishes/Messages section
    const wishesContainer = document.getElementById('wishesContainer');
    const wishesSection = document.querySelector('.wishes-section');
    if (wishesContainer && messages && messages.length > 0) {
        wishesContainer.innerHTML = messages.map(m => `
            <div class="wish-card">
                <p class="wish-name">${m.guest_name}</p>
                <p class="wish-message">${m.message}</p>
            </div>
        `).join('');
    } else {
        // Hide wishes section if no messages
        if (wishesSection) wishesSection.style.display = 'none';
    }

    // Event-type specific prayer title and text
    const prayerTitle = document.querySelector('.prayer-title');
    const prayerText = document.getElementById('prayer-text');

    const PRAYER_CONFIG = {
        1: { // Wedding
            title: 'Doa Buat Pengantin',
            text: 'Ya Allah, berkatilah majlis perkahwinan ini, limpahkanlah rahmat-Mu kepada kedua mempelai ini. Kurniakanlah mereka zuriat yang soleh dan solehah serta kekalkanlah jodoh mereka hingga ke syurga. Amin.'
        },
        4: { // Birthday
            title: 'Doa Hari Lahir',
            text: 'Ya Allah, panjangkanlah umur yang penuh dengan keberkatan. Limpahkanlah kesihatan yang baik dan kurniakanlah kebahagiaaan dalam kehidupan serta rezeki yang melimpah. Amin.'
        },
        2: { // Corporate
            title: 'Ucapan Terima Kasih',
            text: 'Terima kasih di atas kesudian hadir ke majlis ini. Semoga segala urusan anda dipermudahkan dan diberkati selalu.'
        },
        3: { // Family
            title: 'Doa Kesejahteraan Keluarga',
            text: 'Ya Allah, berkatilah perhimpunan keluarga ini. Eratkan silaturrahim di antara kami dan kurniakanlah kebahagiaaan dalam keluarga. Amin.'
        },
        5: { // Community
            title: 'Ucapan Terima Kasih',
            text: 'Terima kasih di atas penyertaan dan sokongan anda. Semoga program ini memberi manfaat kepada semua.'
        }
    };

    const prayerConfig = PRAYER_CONFIG[eventType] || PRAYER_CONFIG[1];
    if (prayerTitle) prayerTitle.textContent = prayerConfig.title;
    if (prayerText) prayerText.textContent = prayerConfig.text;

    // Store event ID for RSVP form
    window.currentEventId = event.id;
    window.currentEventSlug = invitation.slug;

    // Re-initialize icons
    if (window.lucide) lucide.createIcons();
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

// Initialize countdown
function initCountdown(eventDate, startTime = '11:00') {
    const target = new Date(`${eventDate}T${startTime}`);

    function update() {
        const now = new Date();
        const diff = target - now;

        if (diff <= 0) {
            setText('days', '00');
            setText('hours', '00');
            setText('minutes', '00');
            setText('seconds', '00');
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setText('days', String(days).padStart(2, '0'));
        setText('hours', String(hours).padStart(2, '0'));
        setText('minutes', String(minutes).padStart(2, '0'));
        setText('seconds', String(seconds).padStart(2, '0'));
    }

    update();
    setInterval(update, 1000);
}

// Main loader function
async function loadInvitation() {
    const slug = getSlugFromURL();

    if (!slug) {
        console.log('No slug found, showing demo content');
        return;
    }

    console.log('Loading invitation for slug:', slug);

    try {
        const response = await fetch(`/api/invitation/${slug}`);

        if (!response.ok) {
            if (response.status === 404) {
                console.error('Invitation not found');
                // Could redirect to 404 page or show error
                return;
            }
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Invitation data loaded:', data);

        // Populate the page with fetched data
        populateInvitation(data);

        // Start countdown
        if (data.event?.event_date) {
            initCountdown(data.event.event_date, data.event.start_time);
        }

    } catch (error) {
        console.error('Failed to load invitation:', error);
        // Keep showing demo content on error
    }
}

// Load when DOM is ready
document.addEventListener('DOMContentLoaded', loadInvitation);

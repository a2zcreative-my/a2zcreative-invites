/**
 * A2Z Creative - Preview Loader
 * Receives form data via PostMessage and renders preview
 * (Does NOT fetch from API - receives data from parent wizard)
 */

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

    // Parents section (Wedding only)
    const parentsSection = document.getElementById('parents-section');
    if (parentsSection) {
        if (isWedding && data.parentNames1) {
            parentsSection.style.display = '';
            setText('parents-1', data.parentNames1 || '');
            setText('parents-2', data.parentNames2 || '');
        } else {
            parentsSection.style.display = 'none';
        }
    }

    // Verse
    const verseSection = document.querySelector('.verse-section');
    if (verseSection) {
        if (data.verseText) {
            verseSection.style.display = '';
            setText('verse-text', data.verseText);
            setText('verse-ref', data.verseRef || '');
        } else {
            verseSection.style.display = 'none';
        }
    }

    // Venue
    setText('venue-name', (data.venueName || 'LOKASI MAJLIS').toUpperCase());
    setHtml('venue-address', (data.venueAddress || '').replace(/\n/g, '<br>'));

    // Schedule
    const scheduleContainer = document.getElementById('scheduleContainer');
    if (scheduleContainer && data.schedule && data.schedule.length > 0) {
        scheduleContainer.innerHTML = data.schedule.map(item => `
            <div class="schedule-item">
                <p class="schedule-time">${item.time || ''}</p>
                <p class="schedule-activity">${item.activity || ''}</p>
            </div>
        `).join('');
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

    // Tell parent we're ready
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'preview-ready' }, '*');
    }
});

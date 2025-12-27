/**
 * A2Z Creative Invites - RSVP & Invitation JavaScript
 * Handles cover animation, RSVP form, API calls, and UI interactions
 */

// =============================================
// Configuration
// =============================================
const CONFIG = {
    API_BASE: '/api',
    EVENT_DATE: new Date('2025-02-22T11:00:00+08:00'),
    SLUG: getSlugFromUrl()
};

function getSlugFromUrl() {
    // Check query parameter first (?slug=xxx)
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('slug');
    if (querySlug) return querySlug;

    // Check pathname (/inv/xxx)
    const path = window.location.pathname;
    const match = path.match(/\/inv\/([^\/\.]+)/);
    if (match && match[1] !== 'index') return match[1];

    // Default to demo data
    return 'aiman-rafhanah';
}

// =============================================
// DOM Elements
// =============================================
const DOM = {
    // Cover
    cover: document.getElementById('cover'),
    openBtn: document.getElementById('openInvitation'),
    mainContent: document.getElementById('mainContent'),
    bottomNav: document.getElementById('bottomNav'),

    // Audio
    audio: document.getElementById('background-audio'),
    musicToggle: document.getElementById('musicToggle'),

    // RSVP Form
    rsvpForm: document.getElementById('rsvpForm'),
    rsvpFormContainer: document.getElementById('rsvpFormContainer'),
    rsvpSuccess: document.getElementById('rsvpSuccess'),
    attendanceRadios: document.querySelectorAll('input[name="attendance"]'),
    attendingFields: document.getElementById('attendingFields'),
    submitBtn: document.getElementById('submitBtn'),

    // Modals
    contactModal: document.getElementById('contactModal'),
    giftModal: document.getElementById('giftModal'),
    contactNavBtn: document.getElementById('contactNavBtn'),
    giftBtn: document.getElementById('giftBtn'),
    closeContactModal: document.getElementById('closeContactModal'),
    closeGiftModal: document.getElementById('closeGiftModal'),

    // Other
    saveDateBtn: document.getElementById('saveDateBtn'),
    copyAccBtn: document.getElementById('copyAccBtn'),
    wishesContainer: document.getElementById('wishesContainer'),
    calendarStrip: document.getElementById('calendar-strip'),
    scheduleList: document.getElementById('schedule-list'),
    contactList: document.getElementById('contactList'),
    particles: document.getElementById('particles')
};

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initCoverAnimation();
    initRSVPForm();
    initModals();
    initBottomNav();
    initCountdown();
    initCalendarStrip();
    loadInvitationData();
});

// =============================================
// Particles Background
// =============================================
function initParticles() {
    if (!DOM.particles) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        DOM.particles.appendChild(particle);
    }
}

// =============================================
// Cover Animation
// =============================================
function initCoverAnimation() {
    if (!DOM.openBtn || !DOM.cover) return;

    DOM.openBtn.addEventListener('click', () => {
        // Add opening class for door animation
        DOM.cover.classList.add('open');

        // Play background music
        playAudio();

        // After door animation, hide cover and show content
        setTimeout(() => {
            DOM.cover.classList.add('hidden');
            DOM.mainContent.classList.add('visible');
            DOM.bottomNav.classList.remove('hidden');
        }, 1200);
    });
}

// =============================================
// Audio Control
// =============================================
function playAudio() {
    if (!DOM.audio) return;

    DOM.audio.play().catch(err => {
        console.log('Audio autoplay blocked:', err);
    });
}

function toggleAudio() {
    if (!DOM.audio) return;

    if (DOM.audio.paused) {
        DOM.audio.play();
        DOM.musicToggle?.querySelector('i')?.setAttribute('data-lucide', 'music');
    } else {
        DOM.audio.pause();
        DOM.musicToggle?.querySelector('i')?.setAttribute('data-lucide', 'music-off');
    }
    lucide.createIcons();
}

if (DOM.musicToggle) {
    DOM.musicToggle.addEventListener('click', toggleAudio);
}

// =============================================
// RSVP Form
// =============================================
function initRSVPForm() {
    // Toggle attending fields based on selection
    DOM.attendanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'yes') {
                DOM.attendingFields?.classList.remove('hidden');
            } else {
                DOM.attendingFields?.classList.add('hidden');
            }
        });
    });

    // Form submission
    DOM.rsvpForm?.addEventListener('submit', handleRSVPSubmit);
}

async function handleRSVPSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        slug: CONFIG.SLUG,
        name: formData.get('guestName'),
        phone: formData.get('phone'),
        attendance: formData.get('attendance'),
        pax: formData.get('attendance') === 'yes' ? parseInt(formData.get('pax')) : 0,
        arrivalTime: formData.get('arrivalTime') || null,
        wishes: formData.get('wishes') || null
    };

    // Disable submit button
    if (DOM.submitBtn) {
        DOM.submitBtn.disabled = true;
        DOM.submitBtn.textContent = 'Menghantar...';
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to submit RSVP');
        }

        // Show success message
        DOM.rsvpFormContainer?.classList.add('hidden');
        DOM.rsvpSuccess?.classList.remove('hidden');

        // Reload wishes if there was a message
        if (data.wishes) {
            loadWishes();
        }

    } catch (error) {
        console.error('RSVP Error:', error);
        alert('Maaf, terdapat masalah. Sila cuba lagi.');

        // Re-enable submit button
        if (DOM.submitBtn) {
            DOM.submitBtn.disabled = false;
            DOM.submitBtn.textContent = 'Hantar RSVP';
        }
    }
}

// =============================================
// Modals
// =============================================
function initModals() {
    // Contact Modal
    DOM.contactNavBtn?.addEventListener('click', () => openModal('contactModal'));
    DOM.closeContactModal?.addEventListener('click', () => closeModal('contactModal'));

    // Gift Modal
    DOM.giftBtn?.addEventListener('click', () => openModal('giftModal'));
    DOM.closeGiftModal?.addEventListener('click', () => closeModal('giftModal'));

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Copy account number
    DOM.copyAccBtn?.addEventListener('click', copyAccountNumber);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal?.classList.add('visible');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal?.classList.remove('visible');
}

function copyAccountNumber() {
    const accNumber = document.getElementById('accNumber')?.textContent?.replace(/\s/g, '');
    if (!accNumber) return;

    navigator.clipboard.writeText(accNumber).then(() => {
        const btn = DOM.copyAccBtn;
        if (btn) {
            btn.innerHTML = '<i data-lucide="check"></i> Disalin!';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="copy"></i> Salin';
                lucide.createIcons();
            }, 2000);
        }
    });
}

// =============================================
// Bottom Navigation
// =============================================
function initBottomNav() {
    document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            const section = document.getElementById(sectionId);
            section?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// =============================================
// Countdown Timer
// =============================================
function initCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    const now = new Date();
    const diff = CONFIG.EVENT_DATE - now;

    if (diff <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// =============================================
// Calendar Strip
// =============================================
function initCalendarStrip() {
    if (!DOM.calendarStrip) return;

    const eventDate = CONFIG.EVENT_DATE;
    const dayNames = ['AHD', 'ISN', 'SEL', 'RAB', 'KHA', 'JUM', 'SAB'];

    // Generate 7 days centered around event date
    DOM.calendarStrip.innerHTML = '';

    for (let i = -3; i <= 3; i++) {
        const date = new Date(eventDate);
        date.setDate(date.getDate() + i);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day' + (i === 0 ? ' active' : '');
        dayDiv.innerHTML = `
            <span class="day-name">${dayNames[date.getDay()]}</span>
            <span class="day-number">${date.getDate()}</span>
        `;
        DOM.calendarStrip.appendChild(dayDiv);
    }
}

// =============================================
// Save to Calendar
// =============================================
if (DOM.saveDateBtn) {
    DOM.saveDateBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const event = {
            title: 'Majlis Perkahwinan',
            start: CONFIG.EVENT_DATE.toISOString(),
            end: new Date(CONFIG.EVENT_DATE.getTime() + 5 * 60 * 60 * 1000).toISOString(),
            location: 'Dewan Seri Angkasa, Kuala Lumpur'
        };

        // Generate ICS file
        const icsContent = generateICS(event);
        downloadFile('majlis-perkahwinan.ics', icsContent, 'text/calendar');
    });
}

function generateICS(event) {
    const formatDate = (date) => {
        return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//A2Z Creative//Invitation//EN
BEGIN:VEVENT
UID:${Date.now()}@a2zcreative.my
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
SUMMARY:${event.title}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// =============================================
// Load Data from API
// =============================================
async function loadInvitationData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/invitation/${CONFIG.SLUG}`);

        if (!response.ok) {
            console.log('Using default invitation data');
            return;
        }

        const data = await response.json();
        populateInvitation(data);

    } catch (error) {
        console.log('Could not load invitation data, using defaults:', error);
    }
}

function populateInvitation(data) {
    // Update page title
    if (data.event) {
        document.title = `${data.event.host_name_1} & ${data.event.host_name_2} | Jemputan`;

        // Cover
        setText('cover-name1', data.event.host_name_1);
        setText('cover-name2', data.event.host_name_2);

        // Hero
        setText('name1', data.event.host_name_1);
        setText('name2', data.event.host_name_2);

        // Parents
        setText('parent1', data.event.parent_names_1);
        setText('parent2', data.event.parent_names_2);

        // Venue
        setText('venue-name', data.event.venue_name);
        setHTML('venue-address', data.event.venue_address?.replace('\n', '<br>'));

        // Map
        if (data.event.map_embed_url) {
            document.getElementById('map-iframe')?.setAttribute('src', data.event.map_embed_url);
        }
        if (data.event.map_link) {
            document.getElementById('google-maps-btn')?.setAttribute('href', data.event.map_link);
            document.getElementById('waze-btn')?.setAttribute('href', `https://waze.com/ul?q=${encodeURIComponent(data.event.venue_name)}`);
        }

        // Update event date for countdown
        if (data.event.event_date) {
            CONFIG.EVENT_DATE = new Date(`${data.event.event_date}T${data.event.start_time || '11:00'}:00+08:00`);
            initCalendarStrip();
            updateCountdown();
        }
    }

    // Invitation content
    if (data.invitation) {
        setText('cover-label', data.invitation.invitation_title);
        setText('invite-label', data.invitation.invitation_title);
        setText('hashtag', data.invitation.hashtag);
        setText('verse-text', data.invitation.verse_text);
        setText('verse-ref', `(${data.invitation.verse_reference})`);
    }

    // Schedule
    if (data.schedule && DOM.scheduleList) {
        DOM.scheduleList.innerHTML = data.schedule.map(item => `
            <div class="schedule-item">
                <span class="schedule-time">${item.time_slot}</span>
                <span class="schedule-activity">${item.activity}</span>
            </div>
        `).join('');
    }

    // Contacts
    if (data.contacts && DOM.contactList) {
        DOM.contactList.innerHTML = data.contacts.map(contact => `
            <div class="contact-card">
                <p class="contact-role">${contact.role}</p>
                <p class="contact-name">${contact.name}</p>
                <a href="${contact.whatsapp_link}" target="_blank" class="whatsapp-btn">
                    <i data-lucide="message-circle"></i> WhatsApp
                </a>
            </div>
        `).join('');
        lucide.createIcons();
    }

    // Wishes
    if (data.messages) {
        renderWishes(data.messages);
    }
}

async function loadWishes() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/messages/${CONFIG.SLUG}`);
        if (response.ok) {
            const messages = await response.json();
            renderWishes(messages);
        }
    } catch (error) {
        console.error('Could not load wishes:', error);
    }
}

function renderWishes(messages) {
    if (!DOM.wishesContainer || !messages.length) return;

    DOM.wishesContainer.innerHTML = messages.map(msg => `
        <div class="wish-card">
            <p class="wish-name">${msg.guest_name}</p>
            <p class="wish-message">${msg.message}</p>
        </div>
    `).join('');
}

// Helper functions
function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
}

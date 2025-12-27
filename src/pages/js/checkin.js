/**
 * A2Z Creative - Check-in Scanner
 * Handles QR scanning, manual search, and check-in API
 */

// =============================================
// Configuration
// =============================================
const CONFIG = {
    API_BASE: '/api',
    EVENT_ID: 1, // Will be updated from selector
    SCAN_FPS: 10
};

// =============================================
// DOM Elements
// =============================================
const DOM = {
    eventSelector: document.getElementById('eventSelector'),

    // Stats
    statTotal: document.getElementById('statTotal'),
    statCheckedIn: document.getElementById('statCheckedIn'),
    statPax: document.getElementById('statPax'),
    statPercentage: document.getElementById('statPercentage'),

    // Scanner
    qrReader: document.getElementById('qr-reader'),
    scannerStatus: document.getElementById('scannerStatus'),

    // Search
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),

    // Result Card
    guestResult: document.getElementById('guestResult'),
    guestAvatar: document.getElementById('guestAvatar'),
    guestName: document.getElementById('guestName'),
    guestPhone: document.getElementById('guestPhone'),
    guestPax: document.getElementById('guestPax'),
    guestArrival: document.getElementById('guestArrival'),
    checkinBtn: document.getElementById('checkinBtn'),
    alreadyCheckedIn: document.getElementById('alreadyCheckedIn'),
    checkinTime: document.getElementById('checkinTime'),

    // Recent
    recentList: document.getElementById('recentList')
};

// =============================================
// State
// =============================================
let html5QrCode = null;
let currentGuest = null;
let isScanning = false;

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initScanner();
    initSearch();
    initCheckinButton();
    loadStats();

    // Refresh stats periodically
    setInterval(loadStats, 30000);
});

// =============================================
// QR Scanner
// =============================================
async function initScanner() {
    html5QrCode = new Html5Qrcode("qr-reader");

    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: CONFIG.SCAN_FPS,
                qrbox: { width: 250, height: 250 }
            },
            onScanSuccess,
            onScanFailure
        );

        isScanning = true;
        setStatus('scanning', 'Mengimbas QR Code...');

    } catch (err) {
        console.error('Scanner error:', err);
        setStatus('error', 'Tidak dapat akses kamera');

        // Show manual search as fallback
        DOM.searchInput?.focus();
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Parse QR data
    // Expected format: a2z://checkin/{token}
    const match = decodedText.match(/a2z:\/\/checkin\/(.+)/);

    if (match) {
        const token = match[1];

        // Pause scanning temporarily
        if (html5QrCode && isScanning) {
            html5QrCode.pause();
        }

        // Process check-in
        processCheckin(token);

        // Resume scanning after delay
        setTimeout(() => {
            if (html5QrCode) {
                html5QrCode.resume();
            }
        }, 3000);
    }
}

function onScanFailure(error) {
    // Ignore - normal when no QR in frame
}

function setStatus(type, message) {
    DOM.scannerStatus.className = `scanner-status ${type}`;
    DOM.scannerStatus.textContent = message;
}

// =============================================
// Check-in Processing
// =============================================
async function processCheckin(token) {
    setStatus('scanning', 'Memproses...');

    try {
        const response = await fetch(`${CONFIG.API_BASE}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, method: 'qr' })
        });

        const data = await response.json();

        if (data.success) {
            setStatus('success', '✓ Check-in berjaya!');
            showGuestResult(data.guest, false);
            loadStats();
            playSuccessSound();
        } else if (data.alreadyCheckedIn) {
            setStatus('error', 'Sudah check-in');
            showGuestResult(data.guest, true);
        } else {
            setStatus('error', data.error || 'Check-in gagal');
        }

    } catch (error) {
        console.error('Check-in error:', error);
        setStatus('error', 'Ralat rangkaian');
    }
}

// =============================================
// Guest Display
// =============================================
function showGuestResult(guest, alreadyCheckedIn = false) {
    currentGuest = guest;

    // Update UI
    DOM.guestAvatar.textContent = getInitials(guest.name);
    DOM.guestName.textContent = guest.name;
    DOM.guestPhone.textContent = guest.phone || '-';
    DOM.guestPax.textContent = guest.pax || 1;
    DOM.guestArrival.textContent = guest.arrivalTime || '--:--';

    // Handle already checked in
    if (alreadyCheckedIn) {
        DOM.alreadyCheckedIn.classList.remove('hidden');
        DOM.checkinTime.textContent = formatTime(guest.checkInTime);
        DOM.checkinBtn.textContent = 'Sudah Check-in';
        DOM.checkinBtn.classList.add('checked-in');
        DOM.checkinBtn.disabled = true;
    } else {
        DOM.alreadyCheckedIn.classList.add('hidden');
        DOM.checkinBtn.innerHTML = '<i data-lucide="check-circle"></i> Check-in Tetamu';
        DOM.checkinBtn.classList.remove('checked-in');
        DOM.checkinBtn.disabled = false;
        lucide.createIcons();
    }

    // Show result card
    DOM.guestResult.classList.add('visible');

    // Scroll to result
    DOM.guestResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideGuestResult() {
    DOM.guestResult.classList.remove('visible');
    currentGuest = null;
}

function getInitials(name) {
    if (!name) return '👤';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
}

function formatTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
}

// =============================================
// Manual Check-in Button
// =============================================
function initCheckinButton() {
    DOM.checkinBtn?.addEventListener('click', async () => {
        if (!currentGuest || DOM.checkinBtn.disabled) return;

        DOM.checkinBtn.disabled = true;
        DOM.checkinBtn.textContent = 'Memproses...';

        try {
            // For manual check-in, we need to find the token first
            // This is handled by the search which sets currentGuest with token
            if (currentGuest.token) {
                await processCheckin(currentGuest.token);
            } else {
                // Fallback: Manual check-in without token
                // Would need a separate endpoint
                setStatus('error', 'Token tidak dijumpai');
            }
        } catch (error) {
            console.error('Manual check-in error:', error);
        }
    });
}

// =============================================
// Manual Search
// =============================================
function initSearch() {
    DOM.searchForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const query = DOM.searchInput?.value.trim();
        if (!query) return;

        try {
            const response = await fetch(
                `${CONFIG.API_BASE}/guests/search?q=${encodeURIComponent(query)}&event_id=${CONFIG.EVENT_ID}`
            );

            if (response.ok) {
                const guests = await response.json();
                if (guests.length > 0) {
                    showGuestResult(guests[0], false);
                } else {
                    setStatus('error', 'Tetamu tidak dijumpai');
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            setStatus('error', 'Carian gagal');
        }
    });
}

// =============================================
// Stats
// =============================================
async function loadStats() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/checkin?event_id=${CONFIG.EVENT_ID}`);

        if (response.ok) {
            const data = await response.json();

            DOM.statTotal.textContent = data.stats.totalGuests;
            DOM.statCheckedIn.textContent = data.stats.checkedInGuests;
            DOM.statPax.textContent = data.stats.checkedInPax;
            DOM.statPercentage.textContent = `${data.stats.percentage}%`;

            // Update recent list
            updateRecentList(data.recentCheckins);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

function updateRecentList(checkins) {
    if (!DOM.recentList || !checkins.length) return;

    DOM.recentList.innerHTML = checkins.map(item => `
        <div class="checkin-item">
            <div>
                <div class="checkin-item-name">${item.name}</div>
                <div class="checkin-item-time">${formatTime(item.check_in_time)}</div>
            </div>
            <div class="checkin-item-pax">${item.pax} pax</div>
        </div>
    `).join('');
}

// =============================================
// Audio Feedback
// =============================================
function playSuccessSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.15);

        // Second beep
        setTimeout(() => {
            const osc2 = context.createOscillator();
            osc2.connect(gainNode);
            osc2.frequency.value = 1200;
            osc2.type = 'sine';
            osc2.start(context.currentTime);
            osc2.stop(context.currentTime + 0.15);
        }, 150);

    } catch (e) {
        // Audio not supported
    }
}

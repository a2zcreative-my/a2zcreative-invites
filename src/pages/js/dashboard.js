/**
 * A2Z Creative - Admin Dashboard
 * Handles dashboard data loading, guest management, and analytics
 */

// =============================================
// Configuration
// =============================================
const CONFIG = {
    API_BASE: '/api',
    EVENT_ID: 1
};

// =============================================
// State
// =============================================
let guests = [];
let rsvpChart = null;
let DOM = {}; // Will be populated after DOMContentLoaded

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Capture DOM elements AFTER DOM is loaded
    DOM = {
        // Stats
        statEvents: document.getElementById('statEvents'),
        statGuests: document.getElementById('statGuests'),
        statConfirmed: document.getElementById('statConfirmed'),
        statViews: document.getElementById('statViews'),
        guestCount: document.getElementById('guestCount'),

        // User
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),

        // Guest Table
        guestTableBody: document.getElementById('guestTableBody'),
        searchGuests: document.getElementById('searchGuests'),
        filterStatus: document.getElementById('filterStatus'),
        emptyState: document.getElementById('emptyState'),

        // Sidebar
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        menuToggle: document.getElementById('menuToggle'),

        // Event Selector
        eventSelector: document.getElementById('eventSelector')
    };

    loadUserInfo();
    initSidebar();
    initFilters();
    loadDashboardData();
    initChart();
});

// =============================================
// User Info
// =============================================
async function loadUserInfo() {
    try {
        const user = await window.A2ZAuth?.getCurrentUser();
        if (user) {
            const name = user.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            DOM.userName.textContent = name;
            DOM.userAvatar.textContent = getInitials(name);
        }
    } catch (e) {
        console.log('Could not load user info');
    }
}

function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

async function logout() {
    await window.A2ZAuth?.logout();
}

// =============================================
// Sidebar (Mobile)
// =============================================
function initSidebar() {
    DOM.menuToggle?.addEventListener('click', () => {
        DOM.sidebar?.classList.toggle('open');
        DOM.sidebarOverlay?.classList.toggle('open');
    });

    DOM.sidebarOverlay?.addEventListener('click', () => {
        DOM.sidebar?.classList.remove('open');
        DOM.sidebarOverlay?.classList.remove('open');
    });
}

// =============================================
// Dashboard Data
// =============================================
async function loadDashboardData() {
    try {
        // Load check-in stats
        const statsResponse = await fetch(`${CONFIG.API_BASE}/checkin?event_id=${CONFIG.EVENT_ID}`);
        if (statsResponse.ok) {
            const data = await statsResponse.json();
            DOM.statGuests.textContent = data.stats.totalGuests || 0;
            DOM.statConfirmed.textContent = data.stats.checkedInGuests || 0;
            DOM.guestCount.textContent = data.stats.totalGuests || 0;
        }

        // Load invitation view count
        const invResponse = await fetch(`${CONFIG.API_BASE}/invitation/aiman-rafhanah`);
        if (invResponse.ok) {
            const invData = await invResponse.json();
            DOM.statViews.textContent = invData.invitation?.view_count || 0;
        }

        // Load guests
        await loadGuests();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// =============================================
// Guest Management
// =============================================
async function loadGuests() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/guests?event_id=${CONFIG.EVENT_ID}`);

        if (response.ok) {
            guests = await response.json();
            renderGuestTable(guests);
            updateChart(guests);
        } else {
            // Demo data if API not available
            guests = getDemoGuests();
            renderGuestTable(guests);
            updateChart(guests);
        }

    } catch (error) {
        console.error('Error loading guests:', error);
        // Use demo data
        guests = getDemoGuests();
        renderGuestTable(guests);
        updateChart(guests);
    }
}

function getDemoGuests() {
    return [
        { id: 1, name: 'Siti Aminah', phone: '012-3456789', response: 'yes', pax: 3, arrival_time: '11:00 - 12:00', checked_in: true },
        { id: 2, name: 'Ahmad Faizal', phone: '011-2345678', response: 'yes', pax: 2, arrival_time: '12:00 - 1:00', checked_in: false },
        { id: 3, name: 'Nurul Huda', phone: '019-8765432', response: 'no', pax: 0, arrival_time: null, checked_in: false },
        { id: 4, name: 'Mohd Hafiz', phone: '017-1234567', response: 'maybe', pax: 1, arrival_time: '11:00 - 12:00', checked_in: false }
    ];
}

function renderGuestTable(guestList) {
    if (!DOM.guestTableBody) return;

    if (guestList.length === 0) {
        DOM.guestTableBody.innerHTML = '';
        DOM.emptyState.style.display = 'block';
        return;
    }

    DOM.emptyState.style.display = 'none';

    DOM.guestTableBody.innerHTML = guestList.map(guest => `
        <tr>
            <td>
                <div class="guest-name">${guest.name}</div>
                <div class="guest-phone">${guest.phone || '-'}</div>
            </td>
            <td>
                ${getStatusBadge(guest.response)}
            </td>
            <td>${guest.pax || 0}</td>
            <td>${guest.arrival_time || '-'}</td>
            <td>
                ${guest.checked_in
            ? '<span class="status-badge checked-in"><i data-lucide="check"></i> Hadir</span>'
            : '-'
        }
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}

function getStatusBadge(status) {
    const badges = {
        'yes': '<span class="status-badge confirmed">Akan Hadir</span>',
        'no': '<span class="status-badge declined">Tidak Hadir</span>',
        'maybe': '<span class="status-badge pending">Belum Pasti</span>'
    };
    return badges[status] || badges.maybe;
}

// =============================================
// Filters
// =============================================
function initFilters() {
    DOM.searchGuests?.addEventListener('input', filterGuests);
    DOM.filterStatus?.addEventListener('change', filterGuests);
}

function filterGuests() {
    const searchTerm = DOM.searchGuests?.value.toLowerCase() || '';
    const statusFilter = DOM.filterStatus?.value || '';

    const filtered = guests.filter(guest => {
        const matchesSearch = guest.name.toLowerCase().includes(searchTerm) ||
            (guest.phone && guest.phone.includes(searchTerm));
        const matchesStatus = !statusFilter || guest.response === statusFilter;
        return matchesSearch && matchesStatus;
    });

    renderGuestTable(filtered);
}

// =============================================
// Chart
// =============================================
function initChart() {
    const ctx = document.getElementById('rsvpChart');
    if (!ctx) return;

    rsvpChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Akan Hadir', 'Tidak Hadir', 'Belum Pasti'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(255, 193, 7, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#8892b0',
                        padding: 20
                    }
                }
            }
        }
    });
}

function updateChart(guestList) {
    if (!rsvpChart) return;

    const yes = guestList.filter(g => g.response === 'yes').length;
    const no = guestList.filter(g => g.response === 'no').length;
    const maybe = guestList.filter(g => g.response === 'maybe').length;

    rsvpChart.data.datasets[0].data = [yes, no, maybe];
    rsvpChart.update();
}

// =============================================
// Export
// =============================================
function exportGuests() {
    // Generate CSV
    const headers = ['Nama', 'Telefon', 'Status', 'Pax', 'Waktu Ketibaan', 'Check-in'];
    const statusLabels = { yes: 'Akan Hadir', no: 'Tidak Hadir', maybe: 'Belum Pasti' };

    const rows = guests.map(g => [
        g.name,
        g.phone || '',
        statusLabels[g.response] || '',
        g.pax || 0,
        g.arrival_time || '',
        g.checked_in ? 'Ya' : 'Tidak'
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'senarai-tetamu.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// =============================================
// Share
// =============================================
function shareInvite() {
    const link = `${window.location.origin}/inv/aiman-rafhanah`;
    const text = `Anda dijemput ke majlis kami! ${link}`;

    if (navigator.share) {
        navigator.share({
            title: 'Jemputan Majlis',
            text: 'Anda dijemput ke majlis kami!',
            url: link
        });
    } else {
        // Fallback to WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
}

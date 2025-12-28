// Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Auth
    const user = await A2ZAuth.getCurrentUser();
    if (!user) {
        window.location.href = '/auth/login.html';
        return;
    }

    // Update user info in sidebar
    document.getElementById('userName').textContent = user.email?.split('@')[0] || 'Super Admin';
    document.getElementById('userAvatar').textContent = (user.email?.[0] || 'S').toUpperCase();

    // Show login time
    const loginTime = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('loginTime').textContent = loginTime;

    // Mobile sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
        });
    }

    console.log("Logged in as:", user);

    // 2. Load Initial Data
    loadDashboardStats();
    loadClients();
    loadEvents();
});

// Navigation / Tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show selected
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Update nav active state (rough implementation)
    const navItems = document.querySelectorAll('.nav-item');
    // Finds the one with onclick containing the tabName or similar logic
    // Simplified: Just re-render specific tab data if needed
}

// Data Fetching
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        if (data.stats) {
            document.getElementById('totalUsers').textContent = data.stats.total_users;
            document.getElementById('totalEvents').textContent = data.stats.total_events;
            document.getElementById('totalGuests').textContent = data.stats.total_guests;
        }

        if (data.recent_activity) {
            const tbody = document.getElementById('recentActivityBody');
            tbody.innerHTML = data.recent_activity.map(item => `
                <tr>
                    <td>${new Date(item.created_at).toLocaleDateString()}</td>
                    <td>${item.event_name}</td>
                    <td>${item.created_by_name || 'Unknown'}</td>
                    <td><span class="status-badge status-active">New Event</span></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

async function loadClients() {
    try {
        const response = await fetch('/api/admin/clients');
        const clients = await response.json();

        const tbody = document.getElementById('clientsTableBody');
        tbody.innerHTML = clients.map(client => `
            <tr>
                <td>
                    <div style="font-weight: 500">${client.name}</div>
                </td>
                <td>${client.email}</td>
                <td>${client.role || 'User'}</td>
                <td>${client.event_count}</td>
                <td>${new Date(client.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error loading clients:", error);
    }
}

async function loadEvents() {
    try {
        const response = await fetch('/api/admin/events');
        const events = await response.json();

        const tbody = document.getElementById('eventsTableBody');
        tbody.innerHTML = events.map(event => `
            <tr>
                <td>${event.event_name}</td>
                <td>
                    <div>${event.organizer_name || 'N/A'}</div>
                    <small style="color: #64748b">${event.organizer_email || ''}</small>
                </td>
                <td>${new Date(event.event_date).toLocaleDateString()}</td>
                <td>${event.guest_count}</td>
                <td><span class="status-badge status-${event.status}">${event.status}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

function logout() {
    if (window.A2ZAuth && typeof A2ZAuth.logout === 'function') {
        A2ZAuth.logout();
    } else {
        console.warn("Auth module not loaded, forcing local logout");
        localStorage.removeItem('demo_user');
        window.location.href = '/auth/login.html';
    }
}

window.switchTab = switchTab;
window.logout = logout;

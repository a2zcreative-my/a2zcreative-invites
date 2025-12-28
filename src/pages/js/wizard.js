/**
 * A2Z Creative - Event Creation Wizard
 * Handles multi-step form navigation, data collection, and event publishing
 */

// =============================================
// State
// =============================================
let currentStep = 1;
const totalSteps = 6;

const eventData = {
    eventType: 1,
    hostName1: '',
    hostName2: '',
    parentNames1: '',
    parentNames2: '',
    eventDate: '',
    startTime: '11:00',
    venueName: '',
    venueAddress: '',
    mapLink: '',
    theme: 'elegant-gold',
    inviteTitle: 'Perutusan Raja Sehari',
    verseText: '',
    verseRef: 'Ar-Rum: 21',
    hashtag: '',
    schedule: [],
    contacts: []
};

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initEventTypeCards();
    filterEventTypesByPackage();
    initThemeCards();
    initFormInputs();
    loadUserInfo();
    updateProgressSteps();
});

// =============================================
// User Info
// =============================================
async function loadUserInfo() {
    try {
        const user = await window.A2ZAuth?.getCurrentUser();
        if (user) {
            const name = user.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            document.getElementById('userName').textContent = name;
            document.getElementById('userAvatar').textContent = getInitials(name);
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

// =============================================
// Step Navigation
// =============================================
function nextStep() {
    if (currentStep < totalSteps) {
        collectStepData();
        currentStep++;
        showStep(currentStep);
        updateProgressSteps();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgressSteps();
    }
}

function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
        currentStep = step;
        showStep(currentStep);
        updateProgressSteps();
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.classList.remove('active');
    });

    // Show current step
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) {
        stepEl.classList.add('active');
    }

    // Re-initialize icons
    lucide.createIcons();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressSteps() {
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');

        if (stepNum === currentStep) {
            el.classList.add('active');
        } else if (stepNum < currentStep) {
            el.classList.add('completed');
        }
    });
}

// =============================================
// Event Type Selection & Filtering
// =============================================
function filterEventTypesByPackage() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedPackage = urlParams.get('package')?.toLowerCase();

    if (!selectedPackage) return;

    const cards = document.querySelectorAll('.event-type-card');
    let firstVisibleCard = null;

    cards.forEach(card => {
        const input = card.querySelector('input');
        const eventValue = parseInt(input.value);
        let isVisible = true;

        if (selectedPackage === 'premium') {
            // Premium: Perkahwinan (1), Keluarga (3), Hari Lahir (4)
            isVisible = [1, 3, 4].includes(eventValue);
        } else if (selectedPackage === 'bisnes' || selectedPackage === 'business') {
            // Bisnes: Korporat (2), Komuniti (5)
            isVisible = [2, 5].includes(eventValue);
        }

        if (isVisible) {
            card.style.display = 'flex';
            if (!firstVisibleCard) firstVisibleCard = card;
        } else {
            card.style.display = 'none';
            card.classList.remove('selected');
        }
    });

    // Auto-select first visible if current selection is hidden
    const currentSelected = document.querySelector('.event-type-card.selected');
    if ((!currentSelected || currentSelected.style.display === 'none') && firstVisibleCard) {
        firstVisibleCard.click();
    }
}

function initEventTypeCards() {
    document.querySelectorAll('.event-type-card').forEach(card => {
        card.addEventListener('click', () => {
            // Only allow clicking visible cards
            if (card.style.display === 'none') return;

            // Remove selected from all
            document.querySelectorAll('.event-type-card').forEach(c => {
                c.classList.remove('selected');
            });
            // Add selected to clicked
            card.classList.add('selected');

            // Update data
            const input = card.querySelector('input');
            if (input) {
                eventData.eventType = parseInt(input.value);
                // Also update the hidden radio input to checked for form submission consistency if needed
                input.checked = true;
            }
        });
    });
}

// =============================================
// Theme Selection
// =============================================
function initThemeCards() {
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.theme-card').forEach(c => {
                c.classList.remove('selected');
            });
            card.classList.add('selected');

            const input = card.querySelector('input');
            if (input) {
                eventData.theme = input.value;
            }
        });
    });
}

// =============================================
// Form Inputs
// =============================================
function initFormInputs() {
    // Set min date to today
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}

function collectStepData() {
    switch (currentStep) {
        case 1:
            // Event type already collected via click
            break;

        case 2:
            eventData.hostName1 = document.getElementById('hostName1')?.value || '';
            eventData.hostName2 = document.getElementById('hostName2')?.value || '';
            eventData.parentNames1 = document.getElementById('parentNames1')?.value || '';
            eventData.parentNames2 = document.getElementById('parentNames2')?.value || '';
            eventData.eventDate = document.getElementById('eventDate')?.value || '';
            eventData.startTime = document.getElementById('startTime')?.value || '11:00';
            eventData.venueName = document.getElementById('venueName')?.value || '';
            eventData.venueAddress = document.getElementById('venueAddress')?.value || '';
            eventData.mapLink = document.getElementById('mapLink')?.value || '';
            break;

        case 3:
            eventData.inviteTitle = document.getElementById('inviteTitle')?.value || '';
            eventData.verseText = document.getElementById('verseText')?.value || '';
            eventData.verseRef = document.getElementById('verseRef')?.value || '';
            eventData.hashtag = document.getElementById('hashtag')?.value || '';
            break;

        case 4:
            collectScheduleData();
            break;

        case 5:
            collectContactsData();
            break;
    }
}

// =============================================
// Schedule Builder
// =============================================
function addScheduleItem() {
    const list = document.getElementById('scheduleList');
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML = `
        <input type="text" placeholder="Masa" value="">
        <input type="text" placeholder="Aktiviti" value="">
        <button class="remove-btn" onclick="removeScheduleItem(this)">
            <i data-lucide="x"></i>
        </button>
    `;
    list.appendChild(item);
    lucide.createIcons();
}

function removeScheduleItem(btn) {
    const item = btn.closest('.schedule-item');
    if (item && document.querySelectorAll('.schedule-item').length > 1) {
        item.remove();
    }
}

function collectScheduleData() {
    eventData.schedule = [];
    document.querySelectorAll('.schedule-item').forEach(item => {
        const inputs = item.querySelectorAll('input');
        if (inputs[0]?.value && inputs[1]?.value) {
            eventData.schedule.push({
                time: inputs[0].value,
                activity: inputs[1].value
            });
        }
    });
}

// =============================================
// Contacts Builder
// =============================================
function addContactItem() {
    const list = document.getElementById('contactsList');
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = `
        <input type="text" placeholder="Peranan" value="">
        <input type="text" placeholder="Nama" value="">
        <input type="tel" placeholder="No. Telefon" value="">
        <button class="remove-btn" onclick="removeContactItem(this)">
            <i data-lucide="x"></i>
        </button>
    `;
    list.appendChild(item);
    lucide.createIcons();
}

function removeContactItem(btn) {
    const item = btn.closest('.contact-item');
    if (item && document.querySelectorAll('.contact-item').length > 1) {
        item.remove();
    }
}

function collectContactsData() {
    eventData.contacts = [];
    document.querySelectorAll('.contact-item').forEach(item => {
        const inputs = item.querySelectorAll('input');
        if (inputs[0]?.value && inputs[1]?.value && inputs[2]?.value) {
            eventData.contacts.push({
                role: inputs[0].value,
                name: inputs[1].value,
                phone: inputs[2].value
            });
        }
    });
}

// =============================================
// Publish Event
// =============================================
async function publishEvent() {
    collectStepData();

    // Generate slug from names
    const slug = generateSlug(eventData.hostName1, eventData.hostName2);

    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...eventData,
                slug
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create event');
        }

        const result = await response.json();

        // Show success
        showPublishSuccess(slug);

    } catch (error) {
        console.error('Publish error:', error);

        // For demo, show success anyway
        showPublishSuccess(slug);
    }
}

function generateSlug(name1, name2) {
    const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${clean(name1)}-${clean(name2)}`;
}

function showPublishSuccess(slug) {
    // Hide current step
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.classList.remove('active');
    });

    // Show success
    document.getElementById('stepSuccess').classList.add('active');

    // Set link
    const link = `${window.location.origin}/inv/${slug}`;
    document.getElementById('inviteLink').value = link;

    lucide.createIcons();
}

// =============================================
// Share Functions
// =============================================
function copyLink() {
    const input = document.getElementById('inviteLink');
    input.select();
    navigator.clipboard.writeText(input.value);

    const btn = document.querySelector('.copy-link-btn');
    btn.textContent = 'Disalin!';
    setTimeout(() => {
        btn.textContent = 'Salin';
    }, 2000);
}

function shareWhatsApp() {
    const link = document.getElementById('inviteLink').value;
    const text = encodeURIComponent(`Anda dijemput ke majlis kami! ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareFacebook() {
    const link = document.getElementById('inviteLink').value;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
}

function shareTwitter() {
    const link = document.getElementById('inviteLink').value;
    const text = encodeURIComponent('Anda dijemput ke majlis kami!');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, '_blank');
}

function shareEmail() {
    const link = document.getElementById('inviteLink').value;
    const subject = encodeURIComponent('Jemputan Majlis');
    const body = encodeURIComponent(`Anda dijemput ke majlis kami!\n\n${link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

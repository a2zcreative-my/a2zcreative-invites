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
    inviteTitle: '',
    verseText: '',
    verseRef: '',
    hashtag: '',
    schedule: [],
    contacts: []
};

// =============================================
// Event Context Configuration
// =============================================
const EVENT_CONTEXT = {
    1: { // Perkahwinan
        theme: {
            titleDefault: 'Perutusan Raja Sehari',
            ayatDefault: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri...',
            rujukanDefault: 'Ar-Rum: 21',
            hashtagPlaceholder: '#AhmadSitiWedding'
        },
        schedulePresets: [
            { time: '11:00 AM', label: 'Majlis Bermula' },
            { time: '12:00 PM', label: 'Ketibaan Pengantin' },
            { time: '01:00 PM', label: 'Makan Beradab' }
        ],
        contactRoles: ['Wakil Pengantin Lelaki', 'Wakil Pengantin Perempuan']
    },
    2: { // Korporat
        theme: {
            titleDefault: 'Jemputan Rasmi',
            ayatDefault: '',
            rujukanDefault: '',
            hashtagPlaceholder: '#MajlisRasmi'
        },
        schedulePresets: [
            { time: '09:00 AM', label: 'Pendaftaran' },
            { time: '10:00 AM', label: 'Ucapan Aluan' },
            { time: '12:00 PM', label: 'Jamuan Makan' }
        ],
        contactRoles: ['Pegawai Bertugas', 'PIC Program']
    },
    3: { // Keluarga
        theme: {
            titleDefault: 'Jemputan Keluarga',
            ayatDefault: '',
            rujukanDefault: '',
            hashtagPlaceholder: '#MajlisKeluarga'
        },
        schedulePresets: [
            { time: '11:00 AM', label: 'Majlis Bermula' },
            { time: '12:00 PM', label: 'Jamuan Makan' }
        ],
        contactRoles: ['Ketua Keluarga', 'Penganjur']
    },
    4: { // Hari Lahir
        theme: {
            titleDefault: 'Jemputan Hari Jadi',
            ayatDefault: '',
            rujukanDefault: '',
            hashtagPlaceholder: '#HariJadi'
        },
        schedulePresets: [
            { time: '05:00 PM', label: 'Majlis Bermula' },
            { time: '06:00 PM', label: 'Potong Kek' },
            { time: '07:00 PM', label: 'Jamuan' }
        ],
        contactRoles: ['Ibu / Bapa', 'Penganjur']
    },
    5: { // Komuniti
        theme: {
            titleDefault: 'Program Komuniti',
            ayatDefault: '',
            rujukanDefault: '',
            hashtagPlaceholder: '#ProgramKomuniti'
        },
        schedulePresets: [
            { time: '08:00 AM', label: 'Pendaftaran' },
            { time: '09:00 AM', label: 'Aktiviti Bermula' },
            { time: '12:00 PM', label: 'Rehat & Makan' }
        ],
        contactRoles: ['Ketua Program', 'Setiausaha']
    }
};

// =============================================
// Step 2 Field Configuration
// =============================================
const STEP2_CONFIG = {
    1: { // Perkahwinan
        host1: {
            visible: true,
            required: true,
            label: 'Nama Pengantin Lelaki',
            placeholder: 'Contoh: Ahmad Bin Ali'
        },
        host2: {
            visible: true,
            required: true,
            label: 'Nama Pengantin Perempuan',
            placeholder: 'Contoh: Siti Binti Abu'
        },
        parents1: {
            visible: true,
            required: true,
            label: 'Nama Bapa Pengantin',
            placeholder: 'Contoh: En. Ali Bin Hassan'
        },
        parents2: {
            visible: true,
            required: true,
            label: 'Nama Ibu Pengantin',
            placeholder: 'Contoh: Pn. Aminah Binti Osman'
        }
    },
    2: { // Korporat
        host1: {
            visible: true,
            required: true,
            label: 'Nama Penganjur / Syarikat',
            placeholder: 'Contoh: ABC Corporation Sdn Bhd'
        },
        host2: { visible: false },
        parents1: { visible: false },
        parents2: { visible: false }
    },
    3: { // Keluarga
        host1: {
            visible: true,
            required: true,
            label: 'Nama Ketua Keluarga / Penganjur',
            placeholder: 'Contoh: Keluarga Hassan'
        },
        host2: { visible: false },
        parents1: { visible: false },
        parents2: { visible: false }
    },
    4: { // Hari Lahir
        host1: {
            visible: true,
            required: true,
            label: 'Nama Yang Dirai',
            placeholder: 'Contoh: Aisyah'
        },
        host2: {
            visible: true,
            required: false,
            label: 'Umur',
            placeholder: 'Contoh: 25',
            type: 'number'
        },
        parents1: { visible: false },
        parents2: { visible: false }
    },
    5: { // Komuniti
        host1: {
            visible: true,
            required: true,
            label: 'Nama Penganjur / Organisasi',
            placeholder: 'Contoh: Jawatankuasa Surau Al-Ikhlas'
        },
        host2: { visible: false },
        parents1: { visible: false },
        parents2: { visible: false }
    }
};

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initEventTypeCards();
    // Initialize form state based on default selection
    const defaultType = document.querySelector('input[name="eventType"]:checked');
    if (defaultType) {
        const typeId = parseInt(defaultType.value);
        eventData.eventType = typeId; // Sync state with default selection
        applyAllContext(typeId);
    }

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
        // Step-specific Validation
        if (currentStep === 1) {
            // Step 1: Event Type
            if (!eventData.eventType) {
                alert('Sila pilih jenis majlis.');
                return;
            }
        } else if (currentStep === 2) {
            // Step 2: Details (Form Validation)
            const currentForm = document.querySelector(`#step${currentStep} form`);
            if (currentForm && !currentForm.checkValidity()) {
                currentForm.reportValidity();
                return;
            }
        } else if (currentStep === 4) {
            // Step 4: Schedule (Min 1 Item)
            const items = document.querySelectorAll('.schedule-item');
            if (items.length === 0) {
                alert('Sila tambah sekurang-kurangnya satu aktiviti.');
                return;
            }
        } else if (currentStep === 5) {
            // Step 5: Contacts (Min 1 Item)
            const items = document.querySelectorAll('.contact-item');
            if (items.length === 0) {
                alert('Sila tambah sekurang-kurangnya satu kenalan.');
                return;
            }
        }

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

function handleBackButton() {
    if (currentStep > 1) {
        prevStep();
    } else {
        // On Step 1, go back to dashboard or previous page
        window.location.href = '/dashboard/';
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
    } else if (currentSelected) {
        // Initialize fields based on initially selected card
        const input = currentSelected.querySelector('input');
        if (input) applyAllContext(parseInt(input.value));
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
                const eventTypeId = parseInt(input.value);
                eventData.eventType = eventTypeId;
                input.checked = true;

                // Trigger all context updates
                applyAllContext(eventTypeId);
            }
        });
    });
}

// =============================================
// Context Application Functions
// =============================================
function applyAllContext(eventType) {
    applyStep2Config(eventType);
    applyThemeContext(eventType);
    applyScheduleContext(eventType);
    applyContactContext(eventType);
}

// =============================================
// Step 2 Config Application
// =============================================
function applyStep2Config(eventType) {
    const cfg = STEP2_CONFIG[eventType];
    if (!cfg) {
        throw new Error('Invalid event type for Step 2: ' + eventType);
    }

    applyFieldConfig('host1', cfg.host1);
    applyFieldConfig('host2', cfg.host2);
    applyFieldConfig('parents1', cfg.parents1);
    applyFieldConfig('parents2', cfg.parents2);
}

function applyFieldConfig(fieldKey, rules) {
    const wrapper = document.querySelector(`[data-field="${fieldKey}"]`);
    if (!wrapper) return;

    const input = wrapper.querySelector('input');
    const label = wrapper.querySelector('label');

    if (!rules || rules.visible === false) {
        wrapper.classList.add('hidden');
        if (input) {
            input.value = '';
            input.removeAttribute('required');
        }
        return;
    }

    wrapper.classList.remove('hidden');
    if (label) label.textContent = rules.label || '';
    if (input) {
        input.placeholder = rules.placeholder || '';
        input.type = rules.type || 'text';
        if (rules.required) {
            input.setAttribute('required', 'required');
        } else {
            input.removeAttribute('required');
        }
    }
}

function applyThemeContext(eventType) {
    const ctx = EVENT_CONTEXT[eventType];
    if (!ctx) return;

    const titleInput = document.getElementById('inviteTitle');
    const verseTextarea = document.getElementById('verseText');
    const verseRefInput = document.getElementById('verseRef');
    const hashtagInput = document.getElementById('hashtag');
    const verseGroup = document.getElementById('verseGroup');
    const verseRefGroup = document.getElementById('verseRefGroup');

    if (titleInput) {
        titleInput.value = ctx.theme.titleDefault;
        titleInput.placeholder = ctx.theme.titleDefault;
    }
    if (verseTextarea) {
        verseTextarea.value = ctx.theme.ayatDefault;
    }
    if (verseRefInput) {
        verseRefInput.value = ctx.theme.rujukanDefault;
    }
    if (hashtagInput) {
        hashtagInput.placeholder = ctx.theme.hashtagPlaceholder;
    }

    // Hide verse fields for non-wedding events
    if (verseGroup) {
        verseGroup.classList.toggle('hidden', !ctx.theme.ayatDefault);
    }
    if (verseRefGroup) {
        verseRefGroup.classList.toggle('hidden', !ctx.theme.rujukanDefault);
    }
}

function applyScheduleContext(eventType) {
    const ctx = EVENT_CONTEXT[eventType];
    if (!ctx) return;

    clearScheduleItems();

    ctx.schedulePresets.forEach(preset => {
        addScheduleItemWithData(preset.time, preset.label);
    });

    lucide.createIcons();
}

function applyContactContext(eventType) {
    const ctx = EVENT_CONTEXT[eventType];
    if (!ctx) return;

    clearContactItems();

    ctx.contactRoles.forEach(role => {
        addContactItemWithRole(role);
    });

    lucide.createIcons();
}

function clearScheduleItems() {
    const list = document.getElementById('scheduleList');
    if (list) list.innerHTML = '';
}

function clearContactItems() {
    const list = document.getElementById('contactsList');
    if (list) list.innerHTML = '';
}

function addScheduleItemWithData(time, label) {
    const list = document.getElementById('scheduleList');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML = `
        <input type="text" placeholder="Masa" value="${time}">
        <input type="text" placeholder="Aktiviti" value="${label}">
        <button class="remove-btn" onclick="removeScheduleItem(this)">
            <i data-lucide="x"></i>
        </button>
    `;
    list.appendChild(item);
}

function addContactItemWithRole(role) {
    const list = document.getElementById('contactsList');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = `
        <input type="text" placeholder="Peranan" value="${role}">
        <input type="text" placeholder="Nama" value="">
        <input type="tel" placeholder="No. Telefon" value="">
        <button class="remove-btn" onclick="removeContactItem(this)">
            <i data-lucide="x"></i>
        </button>
    `;
    list.appendChild(item);
}

// =============================================
// Field Logic (Strict Specification)
// =============================================
function updateFormFields(typeId) {
    // Configuration Object - Single Source of Truth
    // 1: Perkahwinan, 2: Korporat, 3: Keluarga, 4: Hari Lahir, 5: Komuniti
    const config = {
        1: {
            host1: { label: 'Nama Pengantin Lelaki', placeholder: 'AHMAD', required: true },
            host2: { show: true, label: 'Nama Pengantin Perempuan', placeholder: 'SITI', required: true, type: 'text' },
            parents: {
                show: true,
                required: true,
                labels: { parent1: 'Nama Ibu Bapa (Lelaki)', parent2: 'Nama Ibu Bapa (Perempuan)' },
                placeholders: { parent1: 'En. Abu & Pn. Aminah', parent2: 'En. Ali & Pn. Fatimah' }
            }
        },
        2: {
            host1: { label: 'Nama Penganjur / Syarikat', placeholder: 'Tech Corp Sdn Bhd', required: true },
            host2: { show: false, required: false },
            parents: { show: false, required: false }
        },
        3: {
            host1: { label: 'Nama Ketua Keluarga / Penganjur', placeholder: 'En. Razak', required: true },
            host2: { show: false, required: false },
            parents: { show: false, required: false }
        },
        4: {
            host1: { label: 'Nama Yang Dirai', placeholder: 'Adik Mia', required: true },
            host2: { show: true, label: 'Umur', placeholder: '12', required: false, type: 'number' },
            parents: { show: false, required: false }
        },
        5: {
            host1: { label: 'Nama Penganjur / Organisasi', placeholder: 'Persatuan Penduduk', required: true },
            host2: { show: false, required: false },
            parents: { show: false, required: false }
        }
    };

    // Strict validation: Throw error if invalid type
    if (!config[typeId]) {
        throw new Error('Invalid event type ID: ' + typeId);
    }

    const settings = config[typeId];

    // --- Host 1 ---
    const host1Label = document.getElementById('label-host-1');
    const host1Input = document.getElementById('hostName1');

    if (host1Label && host1Input) {
        host1Label.innerText = settings.host1.label;
        host1Input.placeholder = settings.host1.placeholder;
        toggleRequired(host1Input, settings.host1.required);
    }

    // --- Host 2 ---
    const host2Group = document.querySelector('[data-field-id="host-2"]');
    const host2Label = document.getElementById('label-host-2');
    const host2Input = document.getElementById('hostName2');

    if (host2Group && host2Input) {
        if (settings.host2.show) {
            host2Group.classList.remove('hidden');
            if (host2Label) host2Label.innerText = settings.host2.label;
            host2Input.placeholder = settings.host2.placeholder || '';
            host2Input.type = settings.host2.type || 'text';
            toggleRequired(host2Input, settings.host2.required);
        } else {
            host2Group.classList.add('hidden');
            host2Input.value = ''; // Clear value
            toggleRequired(host2Input, false);
        }
    }

    // --- Parents ---
    const parentsGroup = document.querySelector('[data-field-id="parents"]');
    const parent1Label = document.getElementById('label-parents-1');
    const parent1Input = document.getElementById('parentNames1');
    const parent2Label = document.getElementById('label-parents-2');
    const parent2Input = document.getElementById('parentNames2');

    if (parentsGroup) {
        if (settings.parents.show) {
            parentsGroup.classList.remove('hidden');
            // Apply labels and placeholders
            if (parent1Label) parent1Label.innerText = settings.parents.labels?.parent1 || '';
            if (parent1Input) parent1Input.placeholder = settings.parents.placeholders?.parent1 || '';
            if (parent2Label) parent2Label.innerText = settings.parents.labels?.parent2 || '';
            if (parent2Input) parent2Input.placeholder = settings.parents.placeholders?.parent2 || '';
            // Apply required
            if (parent1Input) toggleRequired(parent1Input, settings.parents.required);
            if (parent2Input) toggleRequired(parent2Input, settings.parents.required);
        } else {
            parentsGroup.classList.add('hidden');
            if (parent1Input) { parent1Input.value = ''; toggleRequired(parent1Input, false); }
            if (parent2Input) { parent2Input.value = ''; toggleRequired(parent2Input, false); }
        }
    }
}

function toggleRequired(element, isRequired) {
    if (isRequired) {
        element.setAttribute('required', '');
    } else {
        element.removeAttribute('required');
    }
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
        // Get auth token from Supabase session
        let authToken = null;
        try {
            // Try A2ZAuth first, then create our own client if needed
            let client = window.A2ZAuth?.supabaseClient;

            if (!client && window.supabase?.createClient) {
                // Create our own client using same config as auth.js
                client = window.supabase.createClient(
                    'https://bzxjsdtkoakscmeuthlu.supabase.co',
                    'sb_publishable_ksSZeGQ4toGfqLttrL7Vsw_8Vq2AVxi'
                );
            }

            if (client) {
                const { data: { session } } = await client.auth.getSession();
                authToken = session?.access_token;
                console.log('Auth token retrieved:', authToken ? 'Yes' : 'No');
            }
        } catch (e) {
            console.error('Could not get auth token:', e);
        }

        if (!authToken) {
            alert('Sila log masuk semula untuk menyimpan jemputan anda.');
            window.location.href = '/auth/login';
            return;
        }

        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                ...eventData,
                slug
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', errorData);

            if (response.status === 401) {
                alert('Sesi anda telah tamat. Sila log masuk semula.');
                window.location.href = '/auth/login';
                return;
            }

            throw new Error(errorData.message || 'Failed to create event');
        }

        const result = await response.json();
        console.log('Event created:', result);

        // Show success with actual slug from server if available
        showPublishSuccess(result.slug || slug);

    } catch (error) {
        console.error('Publish error:', error);

        // Show error message
        alert('Gagal menyimpan jemputan. Sila cuba lagi.');
    }
}

function generateSlug(name1, name2) {
    const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const s1 = clean(name1);
    const s2 = clean(name2);
    const random = Math.random().toString(36).substring(2, 6);

    if (s2) {
        return `${s1}-${s2}-${random}`;
    }
    return `${s1}-${random}`;
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

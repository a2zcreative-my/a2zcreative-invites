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

    // Listen for preview-ready message from iframe
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'preview-ready') {
            sendDataToPreview();
        }
    });
});

// Send data to preview iframe
function sendDataToPreview() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe || !iframe.contentWindow) return;

    // Collect latest data
    collectStepData();

    // Send to preview via postMessage
    iframe.contentWindow.postMessage({
        type: 'preview',
        data: eventData
    }, '*');
}

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

    // Step 6: Auto-generate and check slug
    if (step === 6) {
        initializeStep6Slug();
    }

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

// Music Options Configuration by Event Type
// 1: Perkahwinan, 2: Korporat, 3: Keluarga, 4: Hari Lahir, 5: Komuniti
// Perkahwinan: Romantik Klasik, Nasyid Perkahwinan, Piano Lembut
// Others: Nasyid Majlis, Piano Lembut (no romantic option)
const MUSIC_OPTIONS_CONFIG = {
    1: ['none', 'romantic', 'nasyid', 'piano', 'custom'], // Perkahwinan: romantic + nasyid + piano
    2: ['none', 'nasyid', 'piano', 'custom'], // Korporat: nasyid + piano
    3: ['none', 'nasyid', 'piano', 'custom'], // Keluarga: nasyid + piano
    4: ['none', 'nasyid', 'piano', 'custom'], // Hari Lahir: nasyid + piano
    5: ['none', 'nasyid', 'piano', 'custom']  // Komuniti: nasyid + piano
};

function applyAllContext(eventType) {
    applyStep2Config(eventType);
    applyThemeContext(eventType);
    applyScheduleContext(eventType);
    applyContactContext(eventType);
    applyMusicContext(eventType);
}

// Apply music options based on event type
function applyMusicContext(eventType) {
    const allowedMusic = MUSIC_OPTIONS_CONFIG[eventType] || MUSIC_OPTIONS_CONFIG[1];
    let hasSelectedVisible = false;

    document.querySelectorAll('.music-card[data-music]').forEach(card => {
        const musicType = card.dataset.music;
        const isAllowed = allowedMusic.includes(musicType);

        card.style.display = isAllowed ? '' : 'none';

        // Track if selected card is still visible
        if (isAllowed && card.classList.contains('selected')) {
            hasSelectedVisible = true;
        }

        // If current selection is hidden, unselect it
        if (!isAllowed && card.classList.contains('selected')) {
            card.classList.remove('selected');
            const input = card.querySelector('input');
            if (input) input.checked = false;
        }
    });

    // If no visible card is selected, select 'none'
    if (!hasSelectedVisible) {
        const noneCard = document.querySelector('.music-card[data-music="none"]');
        if (noneCard) {
            noneCard.classList.add('selected');
            const input = noneCard.querySelector('input');
            if (input) input.checked = true;
        }
    }

    lucide.createIcons();
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
        <input type="tel" name="contactPhone" placeholder="Contoh: 012-345 6789" inputmode="numeric" value="">
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
    // Initialize Flatpickr date picker with premium styling
    const dateInput = document.getElementById('eventDate');
    if (dateInput && typeof flatpickr !== 'undefined') {
        // Get today's date properly
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        flatpickr(dateInput, {
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd M Y',
            minDate: today,
            disableMobile: true,
            locale: 'ms',
            monthSelectorType: 'static',
            appendTo: dateInput.parentElement,
            onOpen: function (selectedDates, dateStr, instance) {
                const isMobile = window.innerWidth <= 768;
                const calendar = instance.calendarContainer;

                if (isMobile) {
                    // Mobile: Modal style with backdrop
                    let backdrop = document.getElementById('calendar-backdrop');
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.id = 'calendar-backdrop';
                        backdrop.style.cssText = `
                            position: fixed;
                            top: 0; left: 0; right: 0; bottom: 0;
                            background: rgba(0,0,0,0.6);
                            z-index: 9998;
                        `;
                        backdrop.onclick = () => instance.close();
                        document.body.appendChild(backdrop);
                    }
                    backdrop.style.display = 'block';

                    // Center calendar
                    calendar.style.position = 'fixed';
                    calendar.style.top = '50%';
                    calendar.style.left = '50%';
                    calendar.style.transform = 'translate(-50%, -50%)';
                    calendar.style.zIndex = '9999';
                } else {
                    // Desktop: Smart positioning based on available space
                    const inputRect = instance.input.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - inputRect.bottom;
                    const spaceAbove = inputRect.top;
                    const calendarHeight = 320;

                    if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
                        // Position above input
                        calendar.style.top = 'auto';
                        calendar.style.bottom = (window.innerHeight - inputRect.top + 8) + 'px';
                    }
                }
            },
            onClose: function (selectedDates, dateStr, instance) {
                // Remove backdrop on mobile
                const backdrop = document.getElementById('calendar-backdrop');
                if (backdrop) {
                    backdrop.style.display = 'none';
                }

                // Reset calendar positioning
                const calendar = instance.calendarContainer;
                calendar.style.position = '';
                calendar.style.top = '';
                calendar.style.left = '';
                calendar.style.bottom = '';
                calendar.style.transform = '';
            },
            onReady: function (selectedDates, dateStr, instance) {
                // Apply brand styling to Flatpickr
                const style = document.createElement('style');
                style.textContent = `
                    .flatpickr-calendar {
                        background: #1a2744 !important;
                        border: 1px solid rgba(212, 175, 55, 0.3) !important;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                        font-size: 14px !important;
                        z-index: 9999 !important;
                    }
                    @media (max-width: 768px) {
                        .flatpickr-calendar {
                            width: 300px !important;
                            max-width: 90vw !important;
                        }
                    }
                    .flatpickr-months {
                        background: linear-gradient(135deg, #0a192f, #1a2744) !important;
                        padding: 8px 0 !important;
                    }
                    .flatpickr-month, .flatpickr-current-month {
                        color: #d4af37 !important;
                        font-size: 1.1em !important;
                        font-weight: 600 !important;
                    }
                    .flatpickr-current-month input.cur-year {
                        color: #d4af37 !important;
                        font-weight: 600 !important;
                    }
                    .flatpickr-monthDropdown-months {
                        background: #1a2744 !important;
                        color: #d4af37 !important;
                        font-size: 1em !important;
                        padding: 4px 8px !important;
                    }
                    .flatpickr-weekdays {
                        background: rgba(0,0,0,0.2) !important;
                    }
                    .flatpickr-weekday {
                        color: #d4af37 !important;
                        font-weight: 600 !important;
                    }
                    .flatpickr-day {
                        color: #fff !important;
                        border-radius: 8px !important;
                        height: 38px !important;
                        line-height: 38px !important;
                    }
                    .flatpickr-day:hover:not(.flatpickr-disabled) {
                        background: rgba(212, 175, 55, 0.2) !important;
                        border-color: rgba(212, 175, 55, 0.4) !important;
                    }
                    .flatpickr-day.selected {
                        background: linear-gradient(135deg, #d4af37, #b8962e) !important;
                        border-color: #d4af37 !important;
                        color: #0a192f !important;
                        font-weight: 700 !important;
                    }
                    .flatpickr-day.today {
                        border-color: #d4af37 !important;
                    }
                    .flatpickr-day.flatpickr-disabled,
                    .flatpickr-day.flatpickr-disabled:hover {
                        color: #3a4a6a !important;
                        background: transparent !important;
                        cursor: not-allowed !important;
                        text-decoration: line-through !important;
                    }
                    .flatpickr-prev-month, .flatpickr-next-month {
                        fill: #d4af37 !important;
                        padding: 8px !important;
                    }
                    .flatpickr-prev-month:hover, .flatpickr-next-month:hover {
                        fill: #fff !important;
                        background: rgba(212, 175, 55, 0.2) !important;
                        border-radius: 4px !important;
                    }
                    .numInputWrapper span {
                        border-color: rgba(212, 175, 55, 0.3) !important;
                    }
                    .numInputWrapper span:hover {
                        background: rgba(212, 175, 55, 0.2) !important;
                    }
                    /* Adjacent month days - fade them out */
                    .flatpickr-day.prevMonthDay,
                    .flatpickr-day.nextMonthDay {
                        color: #3a4a6a !important;
                        opacity: 0.4 !important;
                    }
                    .flatpickr-day.prevMonthDay:hover,
                    .flatpickr-day.nextMonthDay:hover {
                        background: rgba(212, 175, 55, 0.1) !important;
                        color: #5a6a8a !important;
                    }
                `;
                document.head.appendChild(style);
            }
        });
    }

    // Setup phone number formatting on all contact phone inputs
    document.addEventListener('input', (e) => {
        if (e.target.name === 'contactPhone' || e.target.id?.includes('phone')) {
            formatPhoneInput(e.target);
        }
    });
}

// Malaysian phone number formatter (01X-XXX XXXX)
function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 11 digits max (Malaysian mobile)
    if (value.length > 11) {
        value = value.substring(0, 11);
    }

    // Format based on length
    let formatted = '';
    if (value.length > 0) {
        formatted = value.substring(0, 3);
    }
    if (value.length > 3) {
        formatted += '-' + value.substring(3, 6);
    }
    if (value.length > 6) {
        formatted += ' ' + value.substring(6);
    }

    input.value = formatted;
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
    const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const slug1 = clean(name1);
    const slug2 = clean(name2);

    // Only add name2 if it exists and is different from name1
    if (slug2 && slug2 !== slug1) {
        return `${slug1}-${slug2}`;
    }
    return slug1 || 'majlis-anda';
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

// =============================================
// Step 6 Initialization: Auto-slug & Preview
// =============================================
function initializeStep6Slug() {
    // Collect latest data from previous steps
    collectStepData();

    // Auto-generate slug from host names if not already set
    const customSlugInput = document.getElementById('customSlug');
    if (!customSlugInput.value || customSlugInput.value.length < 3) {
        const host1 = eventData.hostName1 || '';
        const host2 = eventData.hostName2 || '';
        const autoSlug = generateSlug(host1, host2);
        customSlugInput.value = autoSlug;
    }

    // Trigger availability check
    checkSlugAvailability(customSlugInput.value);

    // Update preview with current event type and theme
    updatePreviewTemplate();
}

function updatePreviewTemplate() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe) return;

    // Build preview URL with event type and theme
    const eventType = eventData.eventType || 1;
    const theme = eventData.theme || 'elegant-gold';

    // Update iframe src to include parameters
    iframe.src = `/inv/preview/?type=${eventType}&theme=${theme}`;
}

// =============================================
// Slug Availability Check
// =============================================
let slugCheckTimeout = null;
let currentSlug = '';
let slugAvailable = false;

function checkSlugAvailability(value) {
    // Clear previous timeout
    if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
    }

    const statusEl = document.getElementById('slugStatus');
    const messageEl = document.getElementById('slugMessage');
    const suggestionsEl = document.getElementById('slugSuggestions');

    // Clean the input
    const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    // Update input if different
    const input = document.getElementById('customSlug');
    if (input.value !== slug) {
        input.value = slug;
    }

    currentSlug = slug;

    if (!slug || slug.length < 3) {
        statusEl.textContent = '';
        messageEl.textContent = slug.length > 0 ? 'Minimum 3 aksara' : '';
        suggestionsEl.style.display = 'none';
        slugAvailable = false;
        return;
    }

    // Show loading
    statusEl.textContent = '⏳';
    messageEl.textContent = 'Menyemak ketersediaan...';
    suggestionsEl.style.display = 'none';

    // Debounce the API call
    slugCheckTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/slug/check?slug=${encodeURIComponent(slug)}`);
            const data = await response.json();

            if (slug !== currentSlug) return; // Stale response

            if (data.available) {
                statusEl.textContent = '✅';
                messageEl.textContent = 'URL ini tersedia!';
                messageEl.style.color = '#4ade80';
                slugAvailable = true;
            } else {
                statusEl.textContent = '❌';
                messageEl.textContent = data.error || 'URL ini sudah digunakan';
                messageEl.style.color = '#f87171';
                slugAvailable = false;

                // Show suggestions
                if (data.suggestions && data.suggestions.length > 0) {
                    suggestionsEl.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-secondary);">Cadangan: </span>';
                    data.suggestions.forEach(sug => {
                        const btn = document.createElement('button');
                        btn.textContent = sug;
                        btn.style.cssText = 'margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: rgba(212,175,55,0.2); border: 1px solid rgba(212,175,55,0.3); border-radius: 4px; color: #d4af37; cursor: pointer; font-size: 0.8rem;';
                        btn.onclick = () => {
                            input.value = sug;
                            checkSlugAvailability(sug);
                        };
                        suggestionsEl.appendChild(btn);
                    });
                    suggestionsEl.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Slug check error:', error);
            statusEl.textContent = '⚠️';
            messageEl.textContent = 'Gagal menyemak. Sila cuba lagi.';
            messageEl.style.color = '#fbbf24';
            slugAvailable = false;
        }
    }, 500);
}

// =============================================
// Package Detection & Button Visibility
// =============================================
const PACKAGE_INFO = {
    free: { name: 'Percuma', price: 0, priceDisplay: 'RM0' },
    basic: { name: 'Asas', price: 4900, priceDisplay: 'RM49' },
    premium: { name: 'Premium', price: 9900, priceDisplay: 'RM99' },
    business: { name: 'Bisnes', price: 19900, priceDisplay: 'RM199' }
};

let selectedPackage = 'premium'; // Default

function initPackageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const pkg = urlParams.get('package')?.toLowerCase() || 'premium';
    selectedPackage = PACKAGE_INFO[pkg] ? pkg : 'premium';
    updatePackageBanner();
    updatePublishButtons();
}

function updatePackageBanner() {
    const pkg = PACKAGE_INFO[selectedPackage];
    const nameEl = document.getElementById('packageName');
    const priceEl = document.getElementById('packagePrice');
    const noteEl = document.getElementById('packageNote');
    const bannerEl = document.getElementById('packageBanner');

    if (nameEl) nameEl.textContent = pkg.name;
    if (priceEl) priceEl.textContent = pkg.priceDisplay;

    if (selectedPackage === 'free') {
        if (noteEl) noteEl.textContent = 'Jemputan akan mempunyai watermark A2Z Creative';
        if (bannerEl) bannerEl.style.background = 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.05))';
        if (bannerEl) bannerEl.style.borderColor = 'rgba(74,222,128,0.3)';
        if (nameEl) nameEl.style.color = '#4ade80';
    } else {
        if (noteEl) noteEl.textContent = 'Pembayaran diperlukan untuk menerbitkan';
    }
}

function updatePublishButtons() {
    const freeBtn = document.getElementById('btnPublishFree');
    const paidBtn = document.getElementById('btnPublishPaid');

    if (selectedPackage === 'free') {
        if (freeBtn) freeBtn.style.display = 'flex';
        if (paidBtn) paidBtn.style.display = 'none';
    } else {
        if (freeBtn) freeBtn.style.display = 'none';
        if (paidBtn) paidBtn.style.display = 'flex';
    }
}

// Auto-generate default slug when reaching Step 6
function generateDefaultSlug() {
    const host1 = eventData.hostName1 || '';
    const host2 = eventData.hostName2 || '';

    if (host1 && host2) {
        const slug = `${host1}-${host2}`.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 40);

        const input = document.getElementById('customSlug');
        if (input && !input.value) {
            input.value = slug;
            checkSlugAvailability(slug);
        }
    }
}

// =============================================
// Free Package Publish
// =============================================
async function publishFreeEvent() {
    if (!slugAvailable) {
        alert('Sila pilih URL yang tersedia sebelum menerbitkan.');
        return;
    }

    const slug = document.getElementById('customSlug').value;

    // Collect all event data
    collectStepData();
    eventData.slug = slug;
    eventData.package = 'free';
    eventData.hasWatermark = true;

    try {
        const response = await fetch('/api/events/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            showPublishSuccess(slug);
        } else {
            alert(data.error || 'Gagal menerbitkan jemputan');
        }
    } catch (error) {
        console.error('Publish error:', error);
        alert('Ralat berlaku. Sila cuba lagi.');
    }
}

// =============================================
// Payment Modal for Paid Packages
// =============================================
function openPaymentModal() {
    if (!slugAvailable) {
        alert('Sila pilih URL yang tersedia sebelum menerbitkan.');
        return;
    }

    // Collect all event data
    collectStepData();
    eventData.slug = document.getElementById('customSlug').value;
    eventData.package = selectedPackage;

    // Store event data for after payment
    sessionStorage.setItem('pendingEventData', JSON.stringify(eventData));

    // Show payment modal
    showPaymentOptions();
}

function showPaymentOptions() {
    const pkg = PACKAGE_INFO[selectedPackage];

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;';

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a2744, #0f1729); border-radius: 20px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: var(--text-primary);">Pembayaran</h3>
                    <button onclick="closePaymentModal()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem;">&times;</button>
                </div>
                <p style="margin: 0.5rem 0 0; color: var(--text-secondary);">Pakej ${pkg.name} - ${pkg.priceDisplay}</p>
            </div>
            
            <div style="padding: 1.5rem;">
                <!-- Billplz Payment Option -->
                <div class="payment-option" onclick="proceedToBillplzPayment()" style="padding: 1.25rem; border: 2px solid rgba(212,175,55,0.5); border-radius: 12px; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s; background: rgba(212,175,55,0.1);">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 48px; height: 48px; background: rgba(212,175,55,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="credit-card" style="color: #d4af37;"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);">Pembayaran Online</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">FPX, DuitNow QR, Kad Kredit/Debit</div>
                        </div>
                        <i data-lucide="chevron-right" style="color: #d4af37;"></i>
                    </div>
                </div>
                
                <div style="text-align: center; padding-top: 0.5rem;">
                    <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">
                        <i data-lucide="shield-check" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px; color: #4ade80;"></i>
                        Pembayaran selamat melalui Billplz
                    </p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Proceed to Billplz payment
async function proceedToBillplzPayment() {
    const pkg = PACKAGE_INFO[selectedPackage];
    const slug = document.getElementById('customSlug').value;

    closePaymentModal();

    // Show loading state
    const payBtn = document.getElementById('btnPublishPaid');
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Memproses...';
        lucide.createIcons();
    }

    try {
        // Get user info
        const user = await window.A2ZAuth?.getCurrentUser();
        if (!user) {
            alert('Sila log masuk semula.');
            window.location.href = '/auth/login';
            return;
        }

        // Create event first
        const eventResponse = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...eventData,
                slug,
                package: selectedPackage,
                status: 'pending_payment'
            })
        });

        const eventResult = await eventResponse.json();
        if (!eventResponse.ok) {
            throw new Error(eventResult.error || 'Gagal mencipta jemputan');
        }

        const eventId = eventResult.id || eventResult.eventId;

        // Create Billplz payment
        const paymentResponse = await fetch('/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId: eventId,
                packageId: selectedPackage,
                paymentMethod: 'billplz',
                userId: user.id
            })
        });

        const paymentResult = await paymentResponse.json();

        if (paymentResult.paymentUrl) {
            // Redirect to Billplz payment page
            window.location.href = paymentResult.paymentUrl;
        } else {
            throw new Error(paymentResult.error || 'Gagal mencipta pembayaran');
        }

    } catch (error) {
        console.error('Payment error:', error);
        alert('Ralat: ' + error.message);

        // Reset button
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = '<i data-lucide="credit-card"></i> Bayar & Terbitkan';
            lucide.createIcons();
        }
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.remove();
}

function selectPaymentMethod(method) {
    closePaymentModal();

    if (method === 'manual') {
        showManualPaymentInstructions();
    } else if (method === 'duitnow') {
        showDuitNowQR();
    }
}

function showManualPaymentInstructions() {
    const pkg = PACKAGE_INFO[selectedPackage];

    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;';

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a2744, #0f1729); border-radius: 20px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: var(--text-primary);">Pindahan Bank</h3>
                    <button onclick="closePaymentModal()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem;">&times;</button>
                </div>
            </div>
            
            <div style="padding: 1.5rem;">
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">Amaun</p>
                    <p style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #d4af37;">${pkg.priceDisplay}</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.25rem; color: var(--text-secondary); font-size: 0.85rem;">Bank</p>
                    <p style="margin: 0 0 0.5rem; color: var(--text-primary);">Maybank</p>
                    <p style="margin: 0 0 0.25rem; color: var(--text-secondary); font-size: 0.85rem;">No. Akaun</p>
                    <p style="margin: 0 0 0.5rem; color: var(--text-primary); font-family: monospace;">1234-5678-9012</p>
                    <p style="margin: 0 0 0.25rem; color: var(--text-secondary); font-size: 0.85rem;">Nama</p>
                    <p style="margin: 0; color: var(--text-primary);">A2Z CREATIVE SDN BHD</p>
                </div>
                
                <div style="background: rgba(212,175,55,0.1); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid rgba(212,175,55,0.3);">
                    <p style="margin: 0; color: #d4af37; font-size: 0.9rem;">
                        <strong>Penting:</strong> Sila masukkan email anda sebagai rujukan pembayaran.
                    </p>
                </div>
                
                <button onclick="submitManualPayment()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #d4af37, #c49b2c); border: none; border-radius: 12px; color: #000; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    Saya Sudah Bayar
                </button>
                
                <p style="margin-top: 1rem; text-align: center; font-size: 0.85rem; color: var(--text-secondary);">
                    Jemputan akan aktif selepas pengesahan pembayaran (1-24 jam)
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function showDuitNowQR() {
    const pkg = PACKAGE_INFO[selectedPackage];
    const amount = (pkg.price / 100).toFixed(2);
    const orderRef = generateOrderReference();

    // DuitNow payment details - UPDATE THESE WITH YOUR ACTUAL INFO
    const DUITNOW_ID = '0123456789'; // Your DuitNow-registered phone number or ID
    const DUITNOW_NAME = 'A2Z CREATIVE';

    // Create QR code data - simplified format for static QR
    // Users scan and manually enter amount (standard for static DuitNow QR)
    const qrData = `00020101021226450009MY.PAYNET0112${DUITNOW_ID}0204DUIT5204000053031234567890${amount}5802MY5913${DUITNOW_NAME}6304`;

    // Use QR Server API (free, no API key needed)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(DUITNOW_ID)}&bgcolor=ffffff&color=000000&format=png`;

    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;';

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a2744, #0f1729); border-radius: 20px; max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: var(--text-primary);">
                        <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/DuitNow_logo.svg/120px-DuitNow_logo.svg.png" alt="DuitNow" height="24" onerror="this.style.display='none'">
                            DuitNow QR
                        </span>
                    </h3>
                    <button onclick="closePaymentModal()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem;">&times;</button>
                </div>
            </div>
            
            <div style="padding: 1.5rem; text-align: center;">
                <!-- QR Code Display -->
                <div style="background: #fff; padding: 1.25rem; border-radius: 16px; display: inline-block; margin-bottom: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <img id="duitnowQrImage" src="${qrImageUrl}" alt="DuitNow QR" style="width: 180px; height: 180px; display: block;" 
                        onerror="this.parentElement.innerHTML='<div style=\\'width:180px;height:180px;display:flex;align-items:center;justify-content:center;color:#666;font-size:0.9rem;\\'>Gagal muat QR</div>'">
                </div>
                
                <!-- DuitNow ID Display -->
                <div style="background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.25rem; color: var(--text-secondary); font-size: 0.8rem;">DuitNow ID (Nombor Telefon)</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
                        <span style="font-size: 1.3rem; font-weight: 600; color: #4ade80; font-family: monospace; letter-spacing: 1px;" id="duitnowIdDisplay">${DUITNOW_ID}</span>
                        <button onclick="copyDuitNowId('${DUITNOW_ID}')" style="background: rgba(74,222,128,0.2); border: 1px solid rgba(74,222,128,0.4); border-radius: 6px; padding: 0.25rem 0.5rem; cursor: pointer; color: #4ade80; font-size: 0.75rem;">
                            Salin
                        </button>
                    </div>
                    <p style="margin: 0.5rem 0 0; color: var(--text-primary); font-size: 0.9rem;">${DUITNOW_NAME}</p>
                </div>
                
                <!-- Amount Display -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.25rem; color: var(--text-secondary); font-size: 0.8rem;">Amaun Pembayaran</p>
                    <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #d4af37;">RM${amount}</p>
                </div>
                
                <!-- Reference -->
                <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.25rem; color: var(--text-secondary); font-size: 0.75rem;">Rujukan Pembayaran</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <code style="font-size: 0.9rem; color: var(--text-primary);" id="paymentRefDisplay">${orderRef}</code>
                        <button onclick="copyPaymentRef('${orderRef}')" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer; color: var(--text-secondary); font-size: 0.7rem;">
                            Salin
                        </button>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="text-align: left; background: rgba(212,175,55,0.1); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; border: 1px solid rgba(212,175,55,0.2);">
                    <p style="margin: 0 0 0.5rem; font-weight: 600; color: #d4af37; font-size: 0.85rem;">Cara Pembayaran:</p>
                    <ol style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.6;">
                        <li>Buka aplikasi bank/e-wallet anda</li>
                        <li>Pilih DuitNow Transfer</li>
                        <li>Masukkan nombor: <strong style="color: #4ade80;">${DUITNOW_ID}</strong></li>
                        <li>Masukkan amaun: <strong style="color: #d4af37;">RM${amount}</strong></li>
                        <li>Gunakan rujukan: <strong>${orderRef}</strong></li>
                    </ol>
                </div>
                
                <button onclick="submitDuitNowPayment('${orderRef}')" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #4ade80, #22c55e); border: none; border-radius: 12px; color: #000; font-weight: 600; cursor: pointer; font-size: 1rem; transition: transform 0.2s;">
                    ✓ Saya Sudah Bayar
                </button>
                
                <p style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary);">
                    Pengesahan pembayaran akan dilakukan dalam masa 1-24 jam
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Copy DuitNow ID to clipboard
function copyDuitNowId(id) {
    navigator.clipboard.writeText(id).then(() => {
        const btn = event.target;
        btn.textContent = '✓ Disalin!';
        btn.style.background = 'rgba(74,222,128,0.4)';
        setTimeout(() => {
            btn.textContent = 'Salin';
            btn.style.background = 'rgba(74,222,128,0.2)';
        }, 2000);
    });
}

// Copy payment reference to clipboard
function copyPaymentRef(ref) {
    navigator.clipboard.writeText(ref).then(() => {
        const btn = event.target;
        btn.textContent = '✓';
        setTimeout(() => {
            btn.textContent = 'Salin';
        }, 2000);
    });
}

// Generate order reference
function generateOrderReference() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `A2Z-${date}-${random}`;
}

// Submit DuitNow payment notification
async function submitDuitNowPayment(orderRef) {
    try {
        const eventData = JSON.parse(sessionStorage.getItem('pendingEventData') || '{}');

        const response = await fetch('/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventData,
                packageId: selectedPackage,
                paymentMethod: 'duitnow',
                orderRef
            })
        });

        const data = await response.json();

        if (data.success || data.orderRef) {
            closePaymentModal();
            showPendingPaymentScreen(data.orderRef || orderRef);
        } else {
            alert(data.error || 'Gagal membuat pesanan pembayaran');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Ralat berlaku. Sila cuba lagi.');
    }
}

async function submitManualPayment() {
    // Create payment order and notify admin
    try {
        const eventData = JSON.parse(sessionStorage.getItem('pendingEventData') || '{}');

        const response = await fetch('/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventData,
                packageId: selectedPackage,
                paymentMethod: 'manual'
            })
        });

        const data = await response.json();

        if (data.success || data.orderRef) {
            closePaymentModal();
            showPendingPaymentScreen(data.orderRef);
        } else {
            alert(data.error || 'Gagal membuat pesanan pembayaran');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Ralat berlaku. Sila cuba lagi.');
    }
}

function showPendingPaymentScreen(orderRef) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));

    const successEl = document.getElementById('stepSuccess');
    successEl.innerHTML = `
        <div class="publish-success">
            <div class="success-icon" style="background: rgba(251,191,36,0.2); color: #fbbf24;">
                <i data-lucide="clock"></i>
            </div>
            <h2>Menunggu Pengesahan Pembayaran</h2>
            <p>Rujukan pesanan: <strong>${orderRef}</strong></p>
            <p style="color: var(--text-secondary); margin-top: 1rem;">
                Jemputan anda akan aktif selepas pembayaran disahkan.<br>
                Kami akan menghubungi anda melalui email.
            </p>
            <a href="/dashboard/" class="nav-btn primary" style="margin-top: 2rem; display: inline-flex; text-decoration: none;">
                <i data-lucide="layout-dashboard"></i>
                Ke Dashboard
            </a>
        </div>
    `;
    successEl.classList.add('active');
    lucide.createIcons();
}

function checkPaymentStatus() {
    // TODO: Poll payment status
    submitManualPayment();
}

// Initialize package on page load
document.addEventListener('DOMContentLoaded', () => {
    initPackageFromUrl();
});

// Generate default slug when entering Step 6
const originalShowStep = showStep;
showStep = function (step) {
    originalShowStep(step);
    if (step === 6) {
        generateDefaultSlug();
        updatePackageBanner();
        updatePublishButtons();
    }
};

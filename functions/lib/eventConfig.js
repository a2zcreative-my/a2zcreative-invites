/**
 * Event Configuration - Single Source of Truth
 * 
 * This file defines all event types with their form configurations,
 * required fields for publishing, and display metadata.
 * 
 * Used by both frontend (form rendering) and backend (validation).
 */

/**
 * EVENT_TYPES - Master configuration for all event types
 * 
 * Each event type defines:
 * - id: Database ID (must match event_types table)
 * - key: URL/API key (e.g., 'wedding')
 * - name: Display name in Malay
 * - formSections: Array of form sections with fields
 * - publishRequiredFields: Fields required before publishing
 */
export const EVENT_TYPES = {
    wedding: {
        id: 1,
        key: 'wedding',
        name: 'Perkahwinan',
        formSections: [
            {
                id: 'hosts',
                title: 'Maklumat Pengantin',
                fields: [
                    { name: 'groom_name', label: 'Nama Pengantin Lelaki', type: 'text', required: true },
                    { name: 'bride_name', label: 'Nama Pengantin Perempuan', type: 'text', required: true },
                    { name: 'parentNames1', label: 'Nama Ibu Bapa Pengantin Lelaki', type: 'text', required: false },
                    { name: 'parentNames2', label: 'Nama Ibu Bapa Pengantin Perempuan', type: 'text', required: false }
                ]
            },
            {
                id: 'event',
                title: 'Maklumat Majlis',
                fields: [
                    { name: 'event_date', label: 'Tarikh Majlis', type: 'date', required: true },
                    { name: 'event_time', label: 'Masa', type: 'time', required: true },
                    { name: 'location', label: 'Lokasi', type: 'text', required: true },
                    { name: 'venueAddress', label: 'Alamat Penuh', type: 'textarea', required: false },
                    { name: 'mapLink', label: 'Link Google Maps', type: 'url', required: false }
                ]
            },
            {
                id: 'invite',
                title: 'Maklumat Jemputan',
                fields: [
                    { name: 'event_title', label: 'Tajuk Jemputan', type: 'text', required: false },
                    { name: 'verseText', label: 'Ucapan / Doa', type: 'textarea', required: false },
                    { name: 'verseRef', label: 'Rujukan Ayat', type: 'text', required: false },
                    { name: 'hashtag', label: 'Hashtag', type: 'text', required: false }
                ]
            }
        ],
        publishRequiredFields: [
            'groom_name',
            'bride_name',
            'event_date',
            'event_time',
            'location'
        ]
    },

    birthday: {
        id: 4,
        key: 'birthday',
        name: 'Hari Lahir',
        formSections: [
            {
                id: 'celebrant',
                title: 'Maklumat Yang Diraikan',
                fields: [
                    { name: 'celebrant_name', label: 'Nama Yang Diraikan', type: 'text', required: true },
                    { name: 'age', label: 'Umur', type: 'number', required: false }
                ]
            },
            {
                id: 'event',
                title: 'Maklumat Majlis',
                fields: [
                    { name: 'event_date', label: 'Tarikh Majlis', type: 'date', required: true },
                    { name: 'event_time', label: 'Masa', type: 'time', required: true },
                    { name: 'location', label: 'Lokasi', type: 'text', required: true },
                    { name: 'venueAddress', label: 'Alamat Penuh', type: 'textarea', required: false },
                    { name: 'mapLink', label: 'Link Google Maps', type: 'url', required: false }
                ]
            },
            {
                id: 'invite',
                title: 'Maklumat Jemputan',
                fields: [
                    { name: 'event_title', label: 'Tajuk Jemputan', type: 'text', required: false },
                    { name: 'verseText', label: 'Ucapan', type: 'textarea', required: false }
                ]
            }
        ],
        publishRequiredFields: [
            'celebrant_name',
            'event_date',
            'event_time',
            'location'
        ]
    },

    family: {
        id: 3,
        key: 'family',
        name: 'Keluarga',
        formSections: [
            {
                id: 'hosts',
                title: 'Maklumat Tuan Rumah',
                fields: [
                    { name: 'host_name', label: 'Nama Tuan Rumah', type: 'text', required: true },
                    { name: 'event_title', label: 'Nama Majlis (cth: Kenduri Aqiqah)', type: 'text', required: true }
                ]
            },
            {
                id: 'event',
                title: 'Maklumat Majlis',
                fields: [
                    { name: 'event_date', label: 'Tarikh Majlis', type: 'date', required: true },
                    { name: 'event_time', label: 'Masa', type: 'time', required: true },
                    { name: 'location', label: 'Lokasi', type: 'text', required: true },
                    { name: 'venueAddress', label: 'Alamat Penuh', type: 'textarea', required: false },
                    { name: 'mapLink', label: 'Link Google Maps', type: 'url', required: false }
                ]
            },
            {
                id: 'invite',
                title: 'Maklumat Jemputan',
                fields: [
                    { name: 'verseText', label: 'Ucapan / Doa', type: 'textarea', required: false },
                    { name: 'verseRef', label: 'Rujukan Ayat', type: 'text', required: false }
                ]
            }
        ],
        publishRequiredFields: [
            'host_name',
            'event_title',
            'event_date',
            'event_time',
            'location'
        ]
    },

    business: {
        id: 2,
        key: 'business',
        name: 'Bisnes',
        formSections: [
            {
                id: 'org',
                title: 'Maklumat Organisasi',
                fields: [
                    { name: 'company_name', label: 'Nama Syarikat / Organisasi', type: 'text', required: true },
                    { name: 'event_title', label: 'Tajuk Acara', type: 'text', required: true }
                ]
            },
            {
                id: 'event',
                title: 'Maklumat Acara',
                fields: [
                    { name: 'event_date', label: 'Tarikh', type: 'date', required: true },
                    { name: 'event_time', label: 'Masa', type: 'time', required: true },
                    { name: 'location', label: 'Lokasi', type: 'text', required: true },
                    { name: 'venueAddress', label: 'Alamat Penuh', type: 'textarea', required: false },
                    { name: 'mapLink', label: 'Link Google Maps', type: 'url', required: false }
                ]
            },
            {
                id: 'additional',
                title: 'Maklumat Tambahan',
                fields: [
                    { name: 'verseText', label: 'Keterangan Acara', type: 'textarea', required: false }
                ]
            }
        ],
        publishRequiredFields: [
            'company_name',
            'event_title',
            'event_date',
            'event_time',
            'location'
        ]
    },

    community: {
        id: 5,
        key: 'community',
        name: 'Komuniti',
        formSections: [
            {
                id: 'org',
                title: 'Maklumat Penganjur',
                fields: [
                    { name: 'organizer_name', label: 'Nama Penganjur / Persatuan', type: 'text', required: true },
                    { name: 'event_title', label: 'Nama Aktiviti', type: 'text', required: true }
                ]
            },
            {
                id: 'event',
                title: 'Maklumat Aktiviti',
                fields: [
                    { name: 'event_date', label: 'Tarikh', type: 'date', required: true },
                    { name: 'event_time', label: 'Masa', type: 'time', required: true },
                    { name: 'location', label: 'Lokasi', type: 'text', required: true },
                    { name: 'venueAddress', label: 'Alamat Penuh', type: 'textarea', required: false },
                    { name: 'mapLink', label: 'Link Google Maps', type: 'url', required: false }
                ]
            },
            {
                id: 'additional',
                title: 'Maklumat Tambahan',
                fields: [
                    { name: 'verseText', label: 'Keterangan Aktiviti', type: 'textarea', required: false }
                ]
            }
        ],
        publishRequiredFields: [
            'organizer_name',
            'event_title',
            'event_date',
            'event_time',
            'location'
        ]
    }
};

// All valid event type keys
export const VALID_EVENT_TYPE_KEYS = Object.keys(EVENT_TYPES);

// Map of event type ID to key for reverse lookup
export const EVENT_TYPE_ID_TO_KEY = Object.fromEntries(
    Object.entries(EVENT_TYPES).map(([key, config]) => [config.id, key])
);

/**
 * Get event type configuration by key
 * @param {string} key - Event type key (e.g., 'wedding')
 * @returns {object|null} Event type configuration or null if not found
 */
export function getEventTypeByKey(key) {
    return EVENT_TYPES[key] || null;
}

/**
 * Get event type configuration by database ID
 * @param {number} id - Event type database ID
 * @returns {object|null} Event type configuration or null if not found
 */
export function getEventTypeById(id) {
    const key = EVENT_TYPE_ID_TO_KEY[id];
    return key ? EVENT_TYPES[key] : null;
}

/**
 * Get event type ID from key
 * @param {string} key - Event type key (e.g., 'wedding')
 * @returns {number|null} Event type database ID or null if not found
 */
export function getEventTypeId(key) {
    return EVENT_TYPES[key]?.id || null;
}

/**
 * Get event type name (Malay) from key
 * @param {string} key - Event type key (e.g., 'wedding')
 * @returns {string|null} Event type name or null if not found
 */
export function getEventTypeName(key) {
    return EVENT_TYPES[key]?.name || null;
}

/**
 * Validate that all required publish fields are present
 * @param {string} eventTypeKey - Event type key
 * @param {object} data - Data object to validate
 * @returns {{valid: boolean, missingFields?: string[], error?: string}}
 */
export function validatePublishFields(eventTypeKey, data) {
    const eventType = EVENT_TYPES[eventTypeKey];
    if (!eventType) {
        return { valid: false, error: `Jenis majlis tidak sah: ${eventTypeKey}` };
    }

    const missingFields = eventType.publishRequiredFields.filter(field => {
        const value = data[field];
        return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
        // Get field labels for user-friendly error message
        const fieldLabels = missingFields.map(fieldName => {
            for (const section of eventType.formSections) {
                const field = section.fields.find(f => f.name === fieldName);
                if (field) return field.label;
            }
            return fieldName;
        });

        return {
            valid: false,
            missingFields,
            error: `Maklumat wajib tidak lengkap: ${fieldLabels.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Derive the primary host name from event details based on event type
 * @param {string} eventTypeKey - Event type key
 * @param {object} eventDetails - Event details object
 * @returns {string|null} Primary host name
 */
export function deriveHostName1(eventTypeKey, eventDetails) {
    switch (eventTypeKey) {
        case 'wedding':
            return eventDetails.groom_name || null;
        case 'birthday':
            return eventDetails.celebrant_name || null;
        case 'family':
            return eventDetails.host_name || null;
        case 'business':
            return eventDetails.company_name || null;
        case 'community':
            return eventDetails.organizer_name || null;
        default:
            return eventDetails.event_title || null;
    }
}

/**
 * Derive the secondary host name from event details (for weddings)
 * @param {string} eventTypeKey - Event type key
 * @param {object} eventDetails - Event details object
 * @returns {string|null} Secondary host name
 */
export function deriveHostName2(eventTypeKey, eventDetails) {
    if (eventTypeKey === 'wedding') {
        return eventDetails.bride_name || null;
    }
    return null;
}

/**
 * Derive the event name for display
 * @param {string} eventTypeKey - Event type key
 * @param {object} eventDetails - Event details object
 * @returns {string} Derived event name
 */
export function deriveEventName(eventTypeKey, eventDetails) {
    // If event_title is explicitly set, use it
    if (eventDetails.event_title) {
        return eventDetails.event_title;
    }

    switch (eventTypeKey) {
        case 'wedding':
            if (eventDetails.groom_name && eventDetails.bride_name) {
                return `Majlis ${eventDetails.groom_name} & ${eventDetails.bride_name}`;
            }
            break;
        case 'birthday':
            if (eventDetails.celebrant_name) {
                return `Majlis ${eventDetails.celebrant_name}`;
            }
            break;
        case 'family':
            if (eventDetails.host_name) {
                return `Majlis ${eventDetails.host_name}`;
            }
            break;
        case 'business':
            if (eventDetails.company_name) {
                return eventDetails.company_name;
            }
            break;
        case 'community':
            if (eventDetails.organizer_name) {
                return eventDetails.organizer_name;
            }
            break;
    }

    return 'Majlis Baru';
}

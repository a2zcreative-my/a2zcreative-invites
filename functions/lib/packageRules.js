/**
 * Package Rules - Single Source of Truth
 * 
 * IMPORTANT: All package validation and enforcement MUST use this module.
 * Never duplicate these rules elsewhere. Never trust client-provided limits.
 * 
 * Package IDs: free | basic | popular | business
 */

// Event type names as stored in DB (event_types.name)
export const EVENT_TYPE_NAMES = {
    PERKAHWINAN: 'Perkahwinan',
    HARI_LAHIR: 'Hari Lahir',
    KELUARGA: 'Keluarga',
    BISNES: 'Bisnes',
    KOMUNITI: 'Komuniti',
    // Legacy English names (for backwards compatibility)
    WEDDING: 'Wedding',
    BIRTHDAY: 'Birthday',
    FAMILY: 'Family',
    CORPORATE: 'Corporate',
    COMMUNITY: 'Community'
};

// Map English DB names to Malay names for validation
const EVENT_TYPE_MAPPING = {
    'Wedding': 'Perkahwinan',
    'Birthday': 'Hari Lahir',
    'Family': 'Keluarga',
    'Corporate': 'Bisnes',
    'Community': 'Komuniti',
    // Already Malay
    'Perkahwinan': 'Perkahwinan',
    'Hari Lahir': 'Hari Lahir',
    'Keluarga': 'Keluarga',
    'Bisnes': 'Bisnes',
    'Komuniti': 'Komuniti'
};

/**
 * Package Rules Definition
 * 
 * Each package defines:
 * - id: Unique identifier (free | basic | popular | business)
 * - name: Display name in Malay
 * - allowedEventTypes: Array of allowed event type names
 * - guestLimit: Maximum guests allowed
 * - viewLimit: Maximum invite views allowed
 * - watermark: Whether watermark is shown (true = ON)
 * - features: Object of feature flags
 * - autoPublish: Whether to auto-publish (free) or require payment
 */
export const PACKAGE_RULES = {
    free: {
        id: 'free',
        name: 'Percuma',
        allowedEventTypes: ['Perkahwinan', 'Hari Lahir', 'Keluarga', 'Bisnes', 'Komuniti', 
                           'Wedding', 'Birthday', 'Family', 'Corporate', 'Community'],
        guestLimit: 10,
        viewLimit: 50,
        watermark: true,
        features: {
            qr: false,
            qrScanner: false,
            exportCsv: false,
            multipleEvents: false,
            prioritySupport: false
        },
        autoPublish: true
    },
    basic: {
        id: 'basic',
        name: 'Asas',
        allowedEventTypes: ['Perkahwinan', 'Hari Lahir', 'Keluarga', 'Bisnes', 'Komuniti',
                           'Wedding', 'Birthday', 'Family', 'Corporate', 'Community'],
        guestLimit: 100,
        viewLimit: 500,
        watermark: false,
        features: {
            qr: true,
            qrScanner: false,
            exportCsv: false,
            multipleEvents: false,
            prioritySupport: false
        },
        autoPublish: false
    },
    popular: {
        id: 'popular',
        name: 'Popular',
        allowedEventTypes: ['Perkahwinan', 'Hari Lahir', 'Keluarga',
                           'Wedding', 'Birthday', 'Family'],
        guestLimit: 300,
        viewLimit: 2000,
        watermark: false,
        features: {
            qr: true,
            qrScanner: true,
            exportCsv: true,
            multipleEvents: false,
            prioritySupport: false
        },
        autoPublish: false
    },
    business: {
        id: 'business',
        name: 'Bisnes',
        allowedEventTypes: ['Bisnes', 'Komuniti', 'Corporate', 'Community'],
        guestLimit: 1000,
        viewLimit: 10000,
        watermark: false,
        features: {
            qr: true,
            qrScanner: true,
            exportCsv: true,
            multipleEvents: true,
            prioritySupport: true
        },
        autoPublish: false
    }
};

// Valid package IDs for validation
export const VALID_PACKAGE_IDS = Object.keys(PACKAGE_RULES);

/**
 * Get package rules or throw error if invalid
 * @param {string} packageId - Package identifier
 * @returns {object} Package rules object
 * @throws {Error} If packageId is invalid
 */
export function getPackageOrThrow(packageId) {
    if (!packageId || !VALID_PACKAGE_IDS.includes(packageId)) {
        throw new Error(`Invalid package ID: ${packageId}. Valid packages: ${VALID_PACKAGE_IDS.join(', ')}`);
    }
    return PACKAGE_RULES[packageId];
}

/**
 * Validate if event type is allowed for package
 * @param {string} packageId - Package identifier
 * @param {string} eventTypeName - Event type name from DB
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateEventTypeForPackage(packageId, eventTypeName) {
    const pkg = PACKAGE_RULES[packageId];
    if (!pkg) {
        return { valid: false, error: `Pakej tidak sah: ${packageId}` };
    }

    // Normalize event type name
    const normalizedName = EVENT_TYPE_MAPPING[eventTypeName] || eventTypeName;
    
    if (!pkg.allowedEventTypes.includes(eventTypeName) && 
        !pkg.allowedEventTypes.includes(normalizedName)) {
        return { 
            valid: false, 
            error: `Jenis majlis "${eventTypeName}" tidak dibenarkan untuk pakej ${pkg.name}. ` +
                   `Jenis yang dibenarkan: ${pkg.allowedEventTypes.filter(t => !['Wedding', 'Birthday', 'Family', 'Corporate', 'Community'].includes(t)).join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Check if user can create multiple events with this package
 * @param {string} packageId - Package identifier
 * @returns {boolean} Whether multiple events are allowed
 */
export function canCreateMultipleEvents(packageId) {
    const pkg = PACKAGE_RULES[packageId];
    return pkg?.features?.multipleEvents ?? false;
}

/**
 * Get features JSON for database storage
 * @param {string} packageId - Package identifier
 * @returns {string} JSON string of features
 */
export function getFeaturesJson(packageId) {
    const pkg = PACKAGE_RULES[packageId];
    if (!pkg) return '{}';
    return JSON.stringify(pkg.features);
}

/**
 * Get event status based on package (auto-publish or pending payment)
 * @param {string} packageId - Package identifier
 * @returns {string} Event status
 */
export function getEventStatus(packageId) {
    const pkg = PACKAGE_RULES[packageId];
    if (!pkg) return 'pending_payment';
    return pkg.autoPublish ? 'published' : 'pending_payment';
}

/**
 * Parse features JSON from database
 * @param {string|null} featuresJson - JSON string from DB
 * @returns {object} Parsed features object
 */
export function parseFeatures(featuresJson) {
    if (!featuresJson) {
        return PACKAGE_RULES.free.features;
    }
    try {
        return JSON.parse(featuresJson);
    } catch {
        return PACKAGE_RULES.free.features;
    }
}

/**
 * Check if a specific feature is enabled
 * @param {string|object} featuresJsonOrObj - Features JSON string or object
 * @param {string} featureName - Feature name to check
 * @returns {boolean} Whether feature is enabled
 */
export function hasFeature(featuresJsonOrObj, featureName) {
    const features = typeof featuresJsonOrObj === 'string' 
        ? parseFeatures(featuresJsonOrObj)
        : featuresJsonOrObj;
    return features?.[featureName] === true;
}

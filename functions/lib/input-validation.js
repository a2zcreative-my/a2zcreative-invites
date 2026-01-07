/**
 * Input Validation Helpers
 * Validates dynamic URL parameters and request payloads
 */

/**
 * Validate numeric ID parameter
 * @param {string|number} id - ID to validate
 * @param {string} paramName - Parameter name for error messages
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateNumericId(id, paramName = 'ID') {
    if (!id) {
        return { valid: false, error: `${paramName} is required` };
    }

    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return { valid: false, error: `${paramName} must be a positive integer` };
    }

    return { valid: true, value: parsed };
}

/**
 * Validate slug format
 * Allows: alphanumeric, hyphens, underscores (3-50 chars)
 * @param {string} slug - Slug to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateSlug(slug) {
    if (!slug) {
        return { valid: false, error: 'Slug is required' };
    }

    if (slug.length < 3 || slug.length > 50) {
        return { valid: false, error: 'Slug must be 3-50 characters' };
    }

    // Only allow alphanumeric, hyphens, underscores
    if (!/^[a-z0-9_-]+$/i.test(slug)) {
        return { valid: false, error: 'Slug contains invalid characters' };
    }

    return { valid: true, value: slug };
}

/**
 * Validate UUID v4 format
 * @param {string} uuid - UUID to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateUUID(uuid) {
    if (!uuid) {
        return { valid: false, error: 'UUID is required' };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        return { valid: false, error: 'Invalid UUID format' };
    }

    return { valid: true, value: uuid };
}

/**
 * Validate phone number format
 * Accepts Malaysian format: +60, 0, (0), with optional spaces/dashes
 * @param {string} phone - Phone to validate
 * @returns {Object} { valid: boolean, error?: string, value?: string }
 */
export function validatePhone(phone) {
    if (!phone) {
        return { valid: false, error: 'Phone is required' };
    }

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Malaysian phone: 10-11 digits, optionally with +60
    if (!/^(\+?60)?[0-9]{9,11}$/.test(cleaned)) {
        return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true, value: cleaned };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateEmail(email) {
    if (!email) {
        return { valid: false, error: 'Email is required' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true, value: email.toLowerCase() };
}

/**
 * Validate attendance response value
 * @param {string} response - Response to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateAttendance(response) {
    const validResponses = ['yes', 'no', 'maybe'];

    if (!response || !validResponses.includes(response.toLowerCase())) {
        return { valid: false, error: `Attendance must be one of: ${validResponses.join(', ')}` };
    }

    return { valid: true, value: response.toLowerCase() };
}

/**
 * Validate PAX (number of attendees)
 * @param {number|string} pax - PAX to validate
 * @param {number} maxPax - Maximum allowed PAX (default: 10)
 * @returns {Object} { valid: boolean, error?: string, value?: number }
 */
export function validatePax(pax, maxPax = 10) {
    if (!pax) {
        return { valid: true, value: 1 }; // Default to 1
    }

    const parsed = Number(pax);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxPax) {
        return { valid: false, error: `PAX must be between 1 and ${maxPax}` };
    }

    return { valid: true, value: parsed };
}

/**
 * Sanitize and validate text input
 * Removes HTML, scripts, SQL keywords
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length (default: 255)
 * @returns {Object} { valid: boolean, value?: string, error?: string }
 */
export function validateText(text, maxLength = 255) {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Text is required and must be a string' };
    }

    if (text.length > maxLength) {
        return { valid: false, error: `Text exceeds maximum length of ${maxLength} characters` };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /[<>]/,           // HTML tags
        /javascript:/i,   // JavaScript protocol
        /on\w+=/i,        // Event handlers (onclick, etc)
        /DROP\s+TABLE/i,  // SQL injection attempts
        /DELETE\s+FROM/i, // SQL injection attempts
        /INSERT\s+INTO/i  // SQL injection attempts
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(text)) {
            return { valid: false, error: 'Text contains suspicious characters or patterns' };
        }
    }

    return { valid: true, value: text.trim() };
}

/**
 * Create validation error response
 * @param {string} message - Error message
 * @returns {Response}
 */
export function validationErrorResponse(message) {
    return new Response(JSON.stringify({
        error: 'Validation Error',
        message: message,
        code: 'VALIDATION_ERROR'
    }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}

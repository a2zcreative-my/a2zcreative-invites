/**
 * Security Middleware
 * Rate limiting, ownership verification, and request validation
 */

// Rate limit store (in-memory)
// For distributed systems, this should be replaced with Redis or Durable Objects
const rateLimitStore = new Map();

/**
 * Rate limiter configuration
 * CRITICAL FIX: Enhanced rate limiting with multiple keys (IP + event/phone)
 */
const RATE_LIMITS = {
    rsvp: { maxRequests: 5, windowMs: 60000 },      // 5 per minute (IP-based primary)
    rsvpPerEvent: { maxRequests: 50, windowMs: 60000 }, // 50 per minute per event
    rsvpPerPhone: { maxRequests: 3, windowMs: 300000 },  // 3 per 5 minutes per phone (prevent spam)
    api: { maxRequests: 100, windowMs: 60000 },     // 100 per minute
    auth: { maxRequests: 10, windowMs: 300000 },    // 10 per 5 minutes
    export: { maxRequests: 5, windowMs: 300000 }    // 5 per 5 minutes
};

/**
 * Check rate limit for an action (IP-based primary)
 * @deprecated Use checkRateLimitMulti for better protection
 */
export function checkRateLimit(identifier: string, action: string) {
    const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.api;
    const key = `${action}:${identifier}`;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > config.windowMs) {
        // New window
        entry = {
            windowStart: now,
            count: 1
        };
        rateLimitStore.set(key, entry);
        return { allowed: true, remaining: config.maxRequests - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            retryAfter,
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
        };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count
    };
}

/**
 * CRITICAL FIX: Enhanced rate limiting with multiple identifiers
 * Checks rate limit against multiple keys to prevent distributed attacks
 * Protects against: IP spoofing, distributed DoS, phone/event enumeration
 */
export function checkRateLimitMulti({ 
    ip, 
    eventId, 
    phone, 
    action = 'rsvp' 
}: { 
    ip: string; 
    eventId?: number; 
    phone?: string; 
    action?: string; 
}) {
    const now = Date.now();
    const checks: any[] = [];

    // Check 1: IP-based limit (primary defense)
    const ipConfig = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    if (ipConfig) {
        const ipKey = `${action}:ip:${ip}`;
        const ipEntry = rateLimitStore.get(ipKey) || { windowStart: now, count: 0 };

        if (now - ipEntry.windowStart > ipConfig.windowMs) {
            // New window
            rateLimitStore.set(ipKey, { windowStart: now, count: 1 });
        } else if (ipEntry.count >= ipConfig.maxRequests) {
            checks.push({
                allowed: false,
                limitedBy: 'IP',
                retryAfter: Math.ceil((ipEntry.windowStart + ipConfig.windowMs - now) / 1000)
            });
        } else {
            ipEntry.count++;
            rateLimitStore.set(ipKey, ipEntry);
        }
    }

    // Check 2: Per-event limit (RSVP DoS protection)
    if (eventId && action === 'rsvp') {
        const eventConfig = RATE_LIMITS.rsvpPerEvent;
        const eventKey = `${action}:event:${eventId}`;
        const eventEntry = rateLimitStore.get(eventKey) || { windowStart: now, count: 0 };

        if (now - eventEntry.windowStart > eventConfig.windowMs) {
            // New window
            rateLimitStore.set(eventKey, { windowStart: now, count: 1 });
        } else if (eventEntry.count >= eventConfig.maxRequests) {
            checks.push({
                allowed: false,
                limitedBy: 'EVENT',
                retryAfter: Math.ceil((eventEntry.windowStart + eventConfig.windowMs - now) / 1000)
            });
        } else {
            eventEntry.count++;
            rateLimitStore.set(eventKey, eventEntry);
        }
    }

    // Check 3: Per-phone limit (prevent phone enumeration/spam)
    if (phone && action === 'rsvp') {
        const phoneConfig = RATE_LIMITS.rsvpPerPhone;
        const phoneKey = `${action}:phone:${phone}`;
        const phoneEntry = rateLimitStore.get(phoneKey) || { windowStart: now, count: 0 };

        if (now - phoneEntry.windowStart > phoneConfig.windowMs) {
            // New window
            rateLimitStore.set(phoneKey, { windowStart: now, count: 1 });
        } else if (phoneEntry.count >= phoneConfig.maxRequests) {
            checks.push({
                allowed: false,
                limitedBy: 'PHONE',
                retryAfter: Math.ceil((phoneEntry.windowStart + phoneConfig.windowMs - now) / 1000)
            });
        } else {
            phoneEntry.count++;
            rateLimitStore.set(phoneKey, phoneEntry);
        }
    }

    // If any check failed, return failure with details
    if (checks.length > 0 && !checks[0].allowed) {
        return {
            allowed: false,
            message: `Rate limit exceeded (limited by: ${checks[0].limitedBy}). Try again in ${checks[0].retryAfter} seconds.`,
            ...checks[0]
        };
    }

    return { allowed: true };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
    return request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        request.headers.get('X-Real-IP') ||
        'unknown';
}

/**
 * Verify event ownership
 */
export async function verifyEventOwnership(db: any, eventId: number, userId: number) {
    if (!eventId || !userId) {
        return {
            allowed: false,
            reason: 'Missing event or user ID'
        };
    }

    try {
        const event = await db.prepare(`
            SELECT id, created_by FROM events WHERE id = ?
        `).bind(eventId).first();

        if (!event) {
            return {
                allowed: false,
                reason: 'Event not found'
            };
        }

        if (event.created_by !== userId) {
            return {
                allowed: false,
                reason: 'Not authorized to access this event'
            };
        }

        return { allowed: true, event };

    } catch (error) {
        console.error('Ownership check error:', error);
        return {
            allowed: false,
            reason: 'Authorization check failed'
        };
    }
}

/**
 * Generate signed download token
 */
export function generateDownloadToken(eventId: number, fileType: string, expiryMinutes = 60) {
    // Use cryptographically secure random values to prevent token prediction
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    return {
        token,
        eventId,
        fileType,
        expiresAt: expiresAt.toISOString()
    };
}

/**
 * Validate download token
 */
export async function validateDownloadToken(db: any, token: string) {
    try {
        const record = await db.prepare(`
            SELECT * FROM download_tokens 
            WHERE token = ? AND used_at IS NULL
        `).bind(token).first();

        if (!record) {
            return { valid: false, reason: 'Invalid or used token' };
        }

        if (new Date(record.expires_at) < new Date()) {
            return { valid: false, reason: 'Token expired' };
        }

        // Mark as used
        await db.prepare(`
            UPDATE download_tokens SET used_at = CURRENT_TIMESTAMP
            WHERE token = ?
        `).bind(token).run();

        return {
            valid: true,
            eventId: record.event_id,
            fileType: record.file_type
        };

    } catch (error) {
        console.error('Token validation error:', error);
        return { valid: false, reason: 'Validation failed' };
    }
}

/**
 * Validate RSVP submission (anti-spam)
 */
export function validateRsvpSubmission(data: any, clientIP: string) {
    const errors: string[] = [];

    // Required fields
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name is required (min 2 characters)');
    }

    if (!data.response || !['yes', 'no', 'maybe'].includes(data.response)) {
        errors.push('Invalid response');
    }

    // Spam detection
    if (data.name && data.name.length > 100) {
        errors.push('Name too long');
    }

    if (data.message && data.message.length > 500) {
        errors.push('Message too long (max 500 characters)');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /https?:\/\//i,  // URLs in name
        /<[^>]+>/,       // HTML tags
        /[<>{}]/         // Script injection attempts
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(data.name) || pattern.test(data.message)) {
            errors.push('Invalid characters detected');
            break;
        }
    }

    // Phone validation (Malaysian format)
    if (data.phone) {
        const phoneClean = data.phone.replace(/[\s\-\(\)]/g, '');
        if (!/^(\+?60)?[0-9]{9,11}$/.test(phoneClean)) {
            errors.push('Invalid phone number format');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize input string
 */
export function sanitizeInput(str: string): string {
    if (!str) return '';
    return str
        .replace(/[<>]/g, '')           // Remove angle brackets
        .replace(/javascript:/gi, '')    // Remove JS protocol
        .replace(/on\w+=/gi, '')         // Remove event handlers
        .trim()
        .substring(0, 1000);             // Max length
}

/**
 * Log security event
 */
export async function logSecurityEvent(db: any, eventType: string, details: any) {
    try {
        await db.prepare(`
            INSERT INTO audit_logs (action, resource_type, details, ip_address, created_at)
            VALUES (?, 'security', ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            eventType,
            JSON.stringify(details),
            details.ip || null
        ).run();
    } catch (error) {
        console.error('Security log error:', error);
    }
}

/**
 * CORS headers for API responses
 */
export const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(randomBytes[i] % charset.length);
    }
    return result;
}

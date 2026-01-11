/**
 * Session Management
 * Server-side session handling with D1 storage
 */

const SESSION_DURATION_HOURS = 24;
const SESSION_COOKIE_NAME = 'a2z_session';

/**
 * Generate a secure session token
 * @returns {string} Random session token
 */
function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new session for a user
 * @param {D1Database} db - D1 database instance
 * @param {number} userId - User ID
 * @returns {Promise<{token: string, expiresAt: string}>}
 */
export async function createSession(db, userId) {
    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // Clean up expired sessions for this user
    await db.prepare(`
        DELETE FROM sessions WHERE user_id = ? OR expires_at < CURRENT_TIMESTAMP
    `).bind(userId).run();

    // Create new session
    await db.prepare(`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (?, ?, ?)
    `).bind(userId, token, expiresAt.toISOString()).run();

    return {
        token,
        expiresAt: expiresAt.toISOString()
    };
}

/**
 * Validate a session token and return user info
 * @param {D1Database} db - D1 database instance
 * @param {string} token - Session token
 * @returns {Promise<{valid: boolean, user?: object, newToken?: string, newTokenExpiry?: string}>}
 */
export async function validateSession(db, token) {
    if (!token) {
        return { valid: false };
    }

    try {
        const result = await db.prepare(`
             SELECT s.*, u.id as user_id, u.name, u.email, u.role
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
         `).bind(token).first();

        if (!result) {
            return { valid: false };
        }

        const user = {
            id: result.user_id,
            name: result.name,
            email: result.email,
            role: result.role
        };

        // Only rotate token if it's within 1 hour of expiring (to avoid breaking concurrent requests)
        const expiresAt = new Date(result.expires_at);
        const now = new Date();
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

        // If token has more than 1 hour left, don't rotate - just return as valid
        if (hoursUntilExpiry > 1) {
            return { valid: true, user };
        }

        // Token is expiring soon - rotate it
        const newToken = generateSessionToken();
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + SESSION_DURATION_HOURS);

        try {
            await db.batch([
                db.prepare('DELETE FROM sessions WHERE token = ?').bind(token),
                db.prepare(`
                     INSERT INTO sessions (user_id, token, expires_at)
                     VALUES (?, ?, ?)
                 `).bind(result.user_id, newToken, newExpiresAt.toISOString())
            ]);

            return {
                valid: true,
                user,
                newToken: newToken,
                newTokenExpiry: newExpiresAt.toISOString()
            };
        } catch (rotationError) {
            console.error('Session rotation error:', rotationError);
            // Rotation failed but session is still valid
            return { valid: true, user };
        }
    } catch (error) {
        console.error('Session validation error:', error);
        return { valid: false };
    }
}

/**
 * Get current user from request cookies
 * @param {D1Database} db - D1 database instance
 * @param {Request} request - Incoming request
 * @returns {Promise<object|null>} User object or null
 */
export async function getCurrentUser(db, request) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies[SESSION_COOKIE_NAME];

    if (!token) {
        return null;
    }

    const session = await validateSession(db, token);
    return session;
}

/**
 * Destroy a session (logout)
 * @param {D1Database} db - D1 database instance
 * @param {string} token - Session token
 */
export async function destroySession(db, token) {
    if (!token) return;

    try {
        await db.prepare(`
            DELETE FROM sessions WHERE token = ?
        `).bind(token).run();
    } catch (error) {
        console.error('Session destroy error:', error);
    }
}

/**
 * Create session cookie header
 * @param {string} token - Session token
 * @param {string} expiresAt - Expiration date ISO string
 * @returns {string} Set-Cookie header value
 */
export function createSessionCookie(token, expiresAt) {
    const expires = new Date(expiresAt).toUTCString();
    // Use SameSite=None for cross-site compatibility (required for Billplz payment redirects on mobile Safari)
    return `${SESSION_COOKIE_NAME}=${token}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=None`;
}

/**
 * Create logout cookie header (clears the session cookie)
 * @returns {string} Set-Cookie header value
 */
export function createLogoutCookie() {
    // Use SameSite=None for consistency with session cookie
    return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`;
}

/**
 * Parse cookies from Cookie header
 * @param {string} cookieHeader - Cookie header string
 * @returns {object} Parsed cookies
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name && rest.length) {
            cookies[name.trim()] = rest.join('=').trim();
        }
    });

    return cookies;
}

/**
 * Get session token from request
 * @param {Request} request - Incoming request
 * @returns {string|null} Session token or null
 */
export function getSessionToken(request) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    return cookies[SESSION_COOKIE_NAME] || null;
}

export { SESSION_COOKIE_NAME };

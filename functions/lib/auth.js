/**
 * Supabase Auth Helper for Cloudflare Workers (Legacy)
 * NOTE: This is legacy auth. Main auth now uses D1 sessions.
 * Verifies JWT tokens and extracts user info
 */

// Credentials now passed from env, not hardcoded
let _supabaseUrl = null;
let _supabaseAnonKey = null;

/**
 * Initialize Supabase credentials from environment
 * @param {Object} env - Environment variables
 */
export function initSupabaseAuth(env) {
    _supabaseUrl = env.SUPABASE_URL;
    _supabaseAnonKey = env.SUPABASE_ANON_KEY;
}

/**
 * Verify Supabase JWT and return user info (Legacy - use D1 sessions instead)
 * @param {Request} request - The incoming request
 * @returns {Object|null} User info or null if not authenticated
 */
export async function getAuthUser(request) {
    // Skip if Supabase not configured
    if (!_supabaseUrl || !_supabaseAnonKey) {
        return null;
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        // Call Supabase to verify token and get user
        const response = await fetch(`${_supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': _supabaseAnonKey
            }
        });

        if (!response.ok) {
            return null;
        }

        const user = await response.json();
        return {
            supabaseId: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        };
    } catch (error) {
        console.error('Legacy auth error:', error);
        return null;
    }
}

/**
 * Sync Supabase user to D1 database
 * Creates or updates user record
 * @param {D1Database} db - D1 database
 * @param {Object} user - User info from getAuthUser
 * @returns {number} D1 user ID
 */
export async function syncUserToD1(db, user) {
    if (!user || !user.supabaseId) {
        throw new Error('No user to sync');
    }

    // Try to find existing user by supabase_id
    const existing = await db.prepare(
        'SELECT id FROM users WHERE supabase_id = ?'
    ).bind(user.supabaseId).first();

    if (existing) {
        return existing.id;
    }

    // Check if user exists by email (for linking existing accounts)
    const byEmail = await db.prepare(
        'SELECT id FROM users WHERE email = ?'
    ).bind(user.email).first();

    if (byEmail) {
        // Link existing user to Supabase ID
        await db.prepare(
            'UPDATE users SET supabase_id = ? WHERE id = ?'
        ).bind(user.supabaseId, byEmail.id).run();
        return byEmail.id;
    }

    // Create new user
    const result = await db.prepare(`
        INSERT INTO users (name, email, supabase_id, role)
        VALUES (?, ?, ?, 'admin')
    `).bind(user.name, user.email, user.supabaseId).run();

    return result.meta?.last_row_id;
}

/**
 * Verify user owns a specific event
 * @param {D1Database} db - D1 database
 * @param {number} eventId - Event ID to check
 * @param {number} userId - User's D1 ID
 * @returns {boolean} true if user owns the event
 */
export async function verifyEventOwnership(db, eventId, userId) {
    if (!eventId || !userId) return false;

    const event = await db.prepare(`
        SELECT id FROM events WHERE id = ? AND created_by = ?
    `).bind(eventId, userId).first();

    return !!event;
}

/**
 * Check if user has admin role
 * @param {D1Database} db - D1 database
 * @param {number} userId - User's D1 ID
 * @returns {boolean} true if user is super_admin
 */
export async function isAdmin(db, userId) {
    if (!userId) return false;

    const user = await db.prepare(`
        SELECT role FROM users WHERE id = ?
    `).bind(userId).first();

    // Only 'super_admin' has admin access (matches schema constraint)
    return user?.role === 'super_admin';
}

/**
 * Authentication middleware helper - returns error response or null
 * Supports both D1 session cookies (new) and Supabase JWT (legacy)
 * @param {Request} request - Incoming request
 * @param {D1Database} db - D1 database
 * @returns {Object} { user, userId, errorResponse }
 */
export async function requireAuth(request, db) {
    // First, try D1 session cookie (new auth system)
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['a2z_session'];

    if (sessionToken) {
        // Import validateSession from session.js to avoid circular deps
        const sessionResult = await db.prepare(`
            SELECT s.*, u.id as user_id, u.name, u.email, u.role
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();

        if (sessionResult) {
            return {
                user: {
                    id: sessionResult.user_id,
                    name: sessionResult.name,
                    email: sessionResult.email,
                    role: sessionResult.role
                },
                userId: sessionResult.user_id,
                errorResponse: null
            };
        }
    }

    // Fall back to Supabase JWT (legacy auth)
    const authUser = await getAuthUser(request);

    if (!authUser) {
        return {
            user: null,
            userId: null,
            errorResponse: new Response(JSON.stringify({
                error: 'Unauthorized',
                message: 'Please log in to access this resource'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }

    const userId = await syncUserToD1(db, authUser);
    return { user: authUser, userId, errorResponse: null };
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
 * Ownership check helper - returns error response or null
 * @param {D1Database} db - D1 database
 * @param {number} eventId - Event ID
 * @param {number} userId - User's D1 ID
 * @returns {Response|null} Error response or null if authorized
 */
export async function requireEventOwnership(db, eventId, userId) {
    const isOwner = await verifyEventOwnership(db, eventId, userId);

    if (!isOwner) {
        return new Response(JSON.stringify({
            error: 'Forbidden',
            message: 'You do not have access to this event'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return null;
}

/**
 * Admin role check helper
 * @param {D1Database} db - D1 database
 * @param {number} userId - User's D1 ID
 * @returns {Response|null} Error response or null if admin
 */
export async function requireAdmin(db, userId) {
    const adminCheck = await isAdmin(db, userId);

    if (!adminCheck) {
        return new Response(JSON.stringify({
            error: 'Forbidden',
            message: 'Admin access required'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return null;
}

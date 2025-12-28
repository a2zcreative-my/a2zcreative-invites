/**
 * Supabase Auth Helper for Cloudflare Workers
 * Verifies JWT tokens and extracts user info
 */

const SUPABASE_URL = 'https://bzxjsdtkoakscmeuthlu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ksSZeGQ4toGfqLttrL7Vsw_8Vq2AVxi';

/**
 * Verify Supabase JWT and return user info
 * @param {Request} request - The incoming request
 * @returns {Object|null} User info or null if not authenticated
 */
export async function getAuthUser(request) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        // Call Supabase to verify token and get user
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) {
            console.log('Auth verification failed:', response.status);
            return null;
        }

        const user = await response.json();
        return {
            supabaseId: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        };
    } catch (error) {
        console.error('Auth error:', error);
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
        VALUES (?, ?, ?, 'event_admin')
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
 * @returns {boolean} true if user is admin
 */
export async function isAdmin(db, userId) {
    if (!userId) return false;

    const user = await db.prepare(`
        SELECT role FROM users WHERE id = ?
    `).bind(userId).first();

    return user?.role === 'admin' || user?.role === 'super_admin';
}

/**
 * Authentication middleware helper - returns error response or null
 * @param {Request} request - Incoming request
 * @param {D1Database} db - D1 database
 * @returns {Object} { user, userId, errorResponse }
 */
export async function requireAuth(request, db) {
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

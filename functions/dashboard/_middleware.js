/**
 * Cloudflare Pages Middleware for Dashboard Route Protection
 * 
 * This middleware runs on Cloudflare's edge network BEFORE serving static files.
 * It enforces RBAC by checking session cookies and redirecting unauthorized users.
 * 
 * SECURITY: Fail-closed - no session = redirect to login
 */

// Route access matrix: which roles can access which routes
const ROUTE_ACCESS = {
    '/dashboard/godeyes': ['super_admin'],
    '/dashboard/admin': ['super_admin', 'admin', 'event_admin'],
    '/dashboard/agent': ['super_admin', 'agent'],
};

// Default home for each role (with trailing slashes for static export)
const ROLE_HOME = {
    super_admin: '/dashboard/godeyes/',
    admin: '/dashboard/admin/',
    event_admin: '/dashboard/admin/',
    agent: '/dashboard/agent/',
};

/**
 * Parse cookies from request header
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
 * Main middleware handler
 */
export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Only protect dashboard routes
    if (!pathname.startsWith('/dashboard')) {
        return next();
    }

    // Get session cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['a2z_session'];

    // FAIL-CLOSED: No session = redirect to login
    if (!sessionToken) {
        console.log('[CF Middleware] No session, redirecting to login');
        // Use explicit full URL to avoid any URL object transformations
        const redirectPath = '/auth/login/?redirect=' + encodeURIComponent(pathname);
        const fullRedirectUrl = url.origin + redirectPath;
        console.log('[CF Middleware] Redirect URL:', fullRedirectUrl);
        return Response.redirect(fullRedirectUrl, 302);
    }

    // Validate session by querying D1 database
    let session;
    try {
        session = await env.DB.prepare(`
            SELECT 
                s.user_id,
                u.email,
                u.name,
                u.role,
                s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();
    } catch (error) {
        console.error('[CF Middleware] DB error:', error);
        // FAIL-CLOSED: On error, redirect to login
        return Response.redirect(`${url.origin}/auth/login/`, 302);
    }

    // FAIL-CLOSED: Invalid session = redirect to login
    if (!session) {
        console.log('[CF Middleware] Invalid session, redirecting to login');
        return Response.redirect(`${url.origin}/auth/login/`, 302);
    }

    const role = session.role;

    // FAIL-CLOSED: No role = redirect to login
    if (!role) {
        console.log('[CF Middleware] No role, redirecting to login');
        return Response.redirect(`${url.origin}/auth/login/`, 302);
    }

    // Handle root /dashboard - redirect to role's home
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
        const home = ROLE_HOME[role] || '/auth/login/';
        return Response.redirect(`${url.origin}${home}`, 302);
    }

    // Find matching route pattern
    const routePattern = Object.keys(ROUTE_ACCESS).find(pattern =>
        pathname === pattern ||
        pathname === pattern + '/' ||
        pathname.startsWith(pattern + '/')
    );

    // No rule defined = DENY (fail-closed)
    if (!routePattern) {
        console.log(`[CF Middleware] No access rule for ${pathname}`);
        const home = ROLE_HOME[role] || '/auth/login/';
        return Response.redirect(`${url.origin}${home}`, 302);
    }

    const allowedRoles = ROUTE_ACCESS[routePattern];

    // Role not authorized for this route
    if (!allowedRoles.includes(role)) {
        console.log(`[CF Middleware] Role '${role}' not authorized for ${routePattern}`);
        const home = ROLE_HOME[role] || '/auth/login/';
        return Response.redirect(`${url.origin}${home}`, 302);
    }

    // AUTHORIZED - continue to the static page
    console.log(`[CF Middleware] Role '${role}' authorized for ${pathname}`);

    // Add headers for the page (these can be read by client JS if needed)
    const response = await next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-User-Role', role);
    newResponse.headers.set('X-User-Id', String(session.user_id));

    // Flag monitor mode for super_admin viewing other dashboards
    if (role === 'super_admin' && routePattern !== '/dashboard/godeyes') {
        newResponse.headers.set('X-Monitor-Mode', 'true');
    }

    return newResponse;
}

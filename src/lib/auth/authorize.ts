/**
 * Authorization Helper - Single Source of Truth for RBAC
 * 
 * SECURITY: This module is the ONLY place where role-based access decisions are made.
 * All middleware, API routes, and server components MUST use these helpers.
 * 
 * IMPORTANT: Role comes from server session only, NEVER from client.
 */

// Valid roles in the system (must match DB constraint)
export type UserRole = 'super_admin' | 'admin' | 'agent' | 'event_admin' | null;

// Access matrix: which roles can access which routes
const ROUTE_ACCESS: Record<string, UserRole[]> = {
    '/dashboard/godeyes': ['super_admin'],
    '/dashboard/admin': ['super_admin', 'admin', 'event_admin'],
    '/dashboard/agent': ['super_admin', 'agent'],
};

// Default home for each role (for redirects) - trailing slashes for static export
const ROLE_HOME: Record<string, string> = {
    super_admin: '/dashboard/godeyes/',
    admin: '/dashboard/admin/',
    event_admin: '/dashboard/admin/',
    agent: '/dashboard/agent/',
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
    '/pricing',
    '/inv',
];

/**
 * Check if a path is a public route (no auth required)
 */
export function isPublicRoute(path: string): boolean {
    // Exact match
    if (PUBLIC_ROUTES.includes(path)) return true;

    // Prefix match for dynamic routes
    if (path.startsWith('/inv/')) return true;
    if (path.startsWith('/api/public/')) return true;
    if (path.startsWith('/api/rsvp')) return true;
    if (path.startsWith('/api/slug/')) return true;

    return false;
}

/**
 * Check if a path requires dashboard authorization
 */
export function isDashboardRoute(path: string): boolean {
    return path.startsWith('/dashboard');
}

/**
 * Authorize access to a specific route based on user role
 * 
 * @param path - The route path being accessed
 * @param role - The user's role from server session
 * @returns Authorization result with redirect info if denied
 */
export function authorizeRoute(path: string, role: UserRole): {
    authorized: boolean;
    redirectTo?: string;
    reason?: string;
} {
    // No role = not authenticated
    if (!role) {
        return {
            authorized: false,
            redirectTo: '/auth/login/',
            reason: 'Not authenticated',
        };
    }

    // Find matching route pattern
    const routePattern = Object.keys(ROUTE_ACCESS).find(pattern =>
        path === pattern || path.startsWith(pattern + '/')
    );

    // If no specific rule, deny by default (fail-closed)
    if (!routePattern) {
        // For general /dashboard access, redirect to role's home
        if (path === '/dashboard' || path === '/dashboard/') {
            return {
                authorized: false,
                redirectTo: getRoleHome(role),
                reason: 'Redirecting to role home',
            };
        }

        return {
            authorized: false,
            redirectTo: getRoleHome(role),
            reason: 'No access rule defined - fail closed',
        };
    }

    const allowedRoles = ROUTE_ACCESS[routePattern];

    if (!allowedRoles.includes(role)) {
        return {
            authorized: false,
            redirectTo: getRoleHome(role),
            reason: `Role '${role}' not authorized for ${routePattern}`,
        };
    }

    return { authorized: true };
}

/**
 * Authorize an action based on required roles
 * Used in API routes and server actions
 */
export function authorizeAction(
    userRole: UserRole,
    requiredRoles: UserRole[]
): { authorized: boolean; reason?: string } {
    if (!userRole) {
        return { authorized: false, reason: 'Not authenticated' };
    }

    if (!requiredRoles.includes(userRole)) {
        return {
            authorized: false,
            reason: `Role '${userRole}' not in allowed roles: ${requiredRoles.join(', ')}`
        };
    }

    return { authorized: true };
}

/**
 * Get the home dashboard for a role
 */
export function getRoleHome(role: UserRole): string {
    if (!role) return '/auth/login/';
    return ROLE_HOME[role] || '/auth/login/';
}

/**
 * Check if user is super_admin (can view all dashboards in monitor mode)
 */
export function isSuperAdmin(role: UserRole): boolean {
    return role === 'super_admin';
}

/**
 * Get visible navigation items for a role
 */
export function getVisibleNavItems(role: UserRole): { path: string; label: string; icon?: string }[] {
    const items: { path: string; label: string; icon?: string }[] = [];

    if (!role) return items;

    // Super admin sees all
    if (role === 'super_admin') {
        items.push(
            { path: '/dashboard/godeyes/', label: "God's Eye", icon: 'eye' },
            { path: '/dashboard/admin/', label: 'Admin', icon: 'settings' },
            { path: '/dashboard/agent/', label: 'Agent', icon: 'qr-code' },
        );
    } else if (role === 'admin' || role === 'event_admin') {
        items.push(
            { path: '/dashboard/admin/', label: 'Dashboard', icon: 'home' },
        );
    } else if (role === 'agent') {
        items.push(
            { path: '/dashboard/agent/', label: 'Check-in', icon: 'qr-code' },
        );
    }

    return items;
}

/**
 * Parse session cookie and extract user info
 * This is used in middleware - actual DB lookup happens via cookie value
 */
export function parseSessionCookie(cookieString: string): string | null {
    if (!cookieString) return null;

    const cookies: Record<string, string> = {};
    cookieString.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name && rest.length) {
            cookies[name.trim()] = rest.join('=').trim();
        }
    });

    return cookies['a2z_session'] || null;
}

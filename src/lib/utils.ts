/**
 * Utility functions for API handlers
 */

/**
 * Parse cookies from Cookie header
 * @param {string} cookieHeader - Cookie header string
 * @returns {object} Parsed cookies
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
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
 * Get Cloudflare environment from request context
 * This works with @cloudflare/next-on-pages
 */
export function getEnv(request: Request): any {
    // In Next.js with @cloudflare/next-on-pages, the context is available through
    // the global context or through request properties
    const ctx = (globalThis as any).CF_CONTEXT || (request as any).cf;
    
    if (!ctx) {
        console.warn('Cloudflare context not found. Make sure you\'re running with @cloudflare/next-on-pages');
    }

    return ctx?.env || (globalThis as any).env || {};
}

/**
 * Send JSON response
 */
export function jsonResponse(data: any, status: number = 200, headers?: Record<string, string>) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

/**
 * Send error response
 */
export function errorResponse(message: string, status: number = 400, error?: any) {
    return jsonResponse(
        {
            ok: false,
            error: message,
            ...(error && { details: error.message })
        },
        status
    );
}

/**
 * Send success response
 */
export function successResponse(data: any, status: number = 200, headers?: Record<string, string>) {
    return new Response(JSON.stringify({
        ok: true,
        data
    }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function requireAuth(request: Request): Promise<{ user: any; error?: undefined } | { error: string; user?: undefined }> {
    // Import at function level to avoid circular dependency
    const session = await import('./session');
    const user = await session.getCurrentUser(request);
    
    if (!user) {
        return { error: 'Unauthenticated' };
    }
    
    return { user };
}

/**
 * Check if user has required role
 */
export function requireRole(user: any, roles: string[]): boolean {
    return user && roles.includes(user.role);
}

/**
 * Validate tenant ownership (prevent IDOR)
 */
export async function validateOwnership(
    request: Request,
    resourceUserId: number | string,
    currentUser: any
): Promise<boolean> {
    // Convert to number for comparison
    const resourceId = Number(resourceUserId);
    const userId = Number(currentUser?.id);
    
    if (resourceId !== userId) {
        return false;
    }
    
    return true;
}

/**
 * Get query parameters from URL
 */
export function getQueryParam(url: string, param: string): string | null {
    const searchParams = new URL(url).searchParams;
    return searchParams.get(param);
}

/**
 * Get all query parameters
 */
export function getQueryParams(url: string): Record<string, string> {
    const searchParams = new URL(url).searchParams;
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
        params[key] = value;
    });
    
    return params;
}

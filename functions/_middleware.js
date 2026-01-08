/**
 * Enhanced API Middleware
 * Handles CORS, error handling, security headers, and route protection
 */

import { getCurrentUser } from './lib/session.js';
import { initSupabaseAuth } from './lib/auth.js';

// Flag to track if Supabase auth is initialized
let supabaseInitialized = false;
// Route protection configuration
const PROTECTED_ROUTES = {
    // Routes that require super_admin role
    super_admin: [
        '/admin/',
        '/api/admin/'
    ],
    // Routes that require admin (paid client) role
    admin: [
        '/dashboard/',
        '/checkin/',
        '/api/guests',
        '/api/export/',
        '/api/analytics/'
    ],
    // Routes that require any authenticated user (including unpaid)
    authenticated: [
        '/api/payment',  // Payment routes - unpaid users need to pay to become admin
        '/api/events'    // Event creation - users create events then pay
    ]
};

// Public API routes (no auth required)
const PUBLIC_ROUTES = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/session',
    '/api/auth/me',
    '/api/auth/oauth-callback',
    '/pricing/',
    '/create/',
    '/api/rsvp',
    '/api/messages/',
    '/api/invitation/',
    '/api/checkin',
    '/api/templates',
    '/api/slug/',
    '/api/payment/callback',
    '/api/payment/webhook'
];

/**
 * Check if a path matches any patterns in the list
 */
function matchesRoute(path, patterns) {
    return patterns.some(pattern => path.startsWith(pattern));
}

/**
 * Check if route is public
 */
function isPublicRoute(path) {
    // Static assets
    if (path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
        return true;
    }

    // Public pages
    if (path === '/' || path === '/index.html') {
        return true;
    }

    // Auth pages
    if (path.startsWith('/auth/')) {
        return true;
    }

    // Public invitation pages
    if (path.startsWith('/inv/')) {
        return true;
    }

    // Public API endpoints
    return matchesRoute(path, PUBLIC_ROUTES);
}

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize Supabase auth with env vars (once)
    if (!supabaseInitialized && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
        initSupabaseAuth(env);
        supabaseInitialized = true;
    }
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        const allowOrigin = getAllowedOrigin(request, env);
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    // Skip protection for public routes
    if (isPublicRoute(path)) {
        return processRequest(context);
    }

    // Check authentication for protected routes
    try {
        const user = await getCurrentUser(env.DB, request);

        // Check super_admin routes
        if (matchesRoute(path, PROTECTED_ROUTES.super_admin)) {
            if (!user) {
                return redirectToLogin(request);
            }
            if (user.role !== 'super_admin') {
                return redirectToDashboard(user);
            }
        }

        // Check admin routes (admin = paid client)
        if (matchesRoute(path, PROTECTED_ROUTES.admin)) {
            if (!user) {
                return redirectToLogin(request);
            }
            // Only 'admin' and 'super_admin' can access admin routes
            const isAdminRole = user.role === 'admin' || user.role === 'super_admin';
            if (!isAdminRole) {
                // Return JSON for API routes, redirect for page routes
                if (path.startsWith('/api/')) {
                    return new Response(JSON.stringify({
                        error: 'Forbidden',
                        message: 'Akses ditolak. Sila log masuk semula.'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return Response.redirect(new URL('/auth/login/', request.url).href, 302);
            }
        }

        // Check authenticated-only routes
        if (matchesRoute(path, PROTECTED_ROUTES.authenticated)) {
            if (!user) {
                return redirectToLogin(request);
            }
        }

        // Add user to context for downstream handlers
        context.user = user;

    } catch (error) {
        console.error('Auth middleware error:', error);
        // Continue without user context on error
    }

    return processRequest(context);
}

/**
 * Process the request with security headers
 */
async function processRequest(context) {
    const { next, env, request } = context;

    try {
        const response = await next();

        // Clone response to add headers
        const newResponse = new Response(response.body, response);

        // Add security headers
        newResponse.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(request, env));
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        newResponse.headers.set('X-XSS-Protection', '1; mode=block');
        newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Add cache control for API responses
        if (!newResponse.headers.has('Cache-Control')) {
            newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        }

        return newResponse;

    } catch (error) {
        console.error('Middleware error:', error);

        // Log error to audit if DB available
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    INSERT INTO audit_logs (action, resource_type, details, ip_address)
                    VALUES ('api_error', 'system', ?, ?)
                `).bind(
                    JSON.stringify({
                        message: error.message,
                        url: request.url,
                        method: request.method
                    }),
                    request.headers.get('CF-Connecting-IP') || 'unknown'
                ).run();
            } catch (logError) {
                console.error('Failed to log error:', logError);
            }
        }

        return new Response(JSON.stringify({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }
}

/**
 * Redirect to login page
 */
function redirectToLogin(request) {
    const url = new URL(request.url);

    // For API requests, return 401
    if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Please log in to access this resource'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // For page requests, redirect (use trailing slash for static export)
    return Response.redirect(new URL('/auth/login/', request.url).href, 302);
}

/**
* Redirect to appropriate dashboard based on role
*/
function redirectToDashboard(user) {
    if (user.role === 'super_admin') {
        return Response.redirect('/admin/', 302);
    }
    return Response.redirect('/dashboard/', 302);
}

/**
* Determine allowed CORS origin
*/
function getAllowedOrigin(request, env) {
    const origin = request.headers.get('Origin');
    const allowedDomains = [
        'https://a2zcreative.my',
        'https://www.a2zcreative.my',
        'https://a2zcreative.pages.dev',
        'https://a2zcreative-invites.pages.dev'
    ];

    // Allow localhost in development
    if (env.ENVIRONMENT === 'development' && origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
        return origin;
    }

    // Check if origin is allowed
    if (origin && allowedDomains.includes(origin)) {
        return origin;
    }

    // Default to main domain if no origin or not allowed
    return 'https://a2zcreative.my';
}

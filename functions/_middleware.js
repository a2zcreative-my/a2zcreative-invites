/**
 * Enhanced API Middleware
 * Handles CORS, error handling, and security headers
 */

export async function onRequest(context) {
    const { request, next, env } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    try {
        // Process request
        const response = await next();

        // Clone response to add headers
        const newResponse = new Response(response.body, response);

        // Add security headers
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
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

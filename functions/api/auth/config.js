/**
 * Auth Config API
 * Returns Supabase public configuration for client-side OAuth
 * Private keys remain on server only
 */

export async function onRequestGet(context) {
    const { env } = context;

    // Only return public Supabase config (anon key is designed to be public)
    // The secret key / JWT secret stays on server
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return new Response(JSON.stringify({
            error: 'Supabase not configured'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
    });
}

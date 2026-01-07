/**
 * Slug Availability API
 * GET /api/slug/check?slug=xxx - Check if slug is available
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
        return new Response(JSON.stringify({
            error: 'Slug is required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
        return new Response(JSON.stringify({
            available: false,
            error: 'Slug hanya boleh mengandungi huruf kecil, nombor dan tanda sempang (-)',
            suggestion: generateSlugSuggestion(slug)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check minimum length
    if (slug.length < 3) {
        return new Response(JSON.stringify({
            available: false,
            error: 'Slug mesti sekurang-kurangnya 3 aksara'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check maximum length
    if (slug.length > 50) {
        return new Response(JSON.stringify({
            available: false,
            error: 'Slug tidak boleh melebihi 50 aksara'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Defensive check for DB binding
        if (!env.DB) {
            console.warn('DB not bound - slug check skipped');
            return new Response(JSON.stringify({
                available: true,
                slug,
                warning: 'Database check skipped - slug assumed available'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if slug exists in invitations table
        // Only consider invitations with completed payment (paid/published) as "taken"
        // Events with pending/failed/expired payment should NOT reserve the slug
        // Check if slug exists in invitations table
        // Only consider invitations as "taken" if:
        // 1. They are PAID/VERIFIED
        // 2. OR they are recent (< 15 mins old) pending events
        const excludeId = url.searchParams.get('excludeId');

        // ... (validations remain same)

        // Check if slug exists in invitations table
        // Exclude the current user's event ID if provided
        let query = `
            SELECT i.id 
            FROM invitations i
            LEFT JOIN payment_orders po ON po.event_id = i.event_id
            WHERE i.public_slug = ? 
              AND i.is_active = 1
              AND (
                (po.status IN ('verified', 'paid'))
                OR
                (strftime('%s', 'now') - strftime('%s', i.created_at) < 900)
              )
        `;

        const params = [slug];

        if (excludeId) {
            query += ` AND i.event_id != ?`;
            params.push(excludeId);
        }

        const existing = await env.DB.prepare(query).bind(...params).first();

        if (existing) {
            // Generate alternative suggestions
            const suggestions = await generateAlternativeSlugs(env.DB, slug);

            return new Response(JSON.stringify({
                available: false,
                error: 'Slug ini sudah digunakan',
                suggestions
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            available: true,
            slug
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Slug check outer error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to check slug availability due to an unexpected error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Generate a clean slug from input
 */
function generateSlugSuggestion(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}

/**
 * Generate alternative slug suggestions
 */
async function generateAlternativeSlugs(db, baseSlug) {
    const suggestions = [];
    const suffixes = ['2024', '2025', 'my', 'official'];

    for (const suffix of suffixes) {
        const candidate = `${baseSlug}-${suffix}`;
        // Check if slug is truly taken (only paid/published invitations)
        const exists = await db.prepare(`
            SELECT i.id 
            FROM invitations i
            LEFT JOIN payment_orders po ON po.event_id = i.event_id
            WHERE i.public_slug = ? 
              AND (
                (po.id IS NULL AND i.is_active = 1)
                OR
                (po.status IN ('verified', 'paid'))
              )
        `).bind(candidate).first();

        if (!exists) {
            suggestions.push(candidate);
            if (suggestions.length >= 3) break;
        }
    }

    // Add random suffix if needed
    if (suggestions.length < 3) {
        const random = Math.random().toString(36).substring(2, 6);
        suggestions.push(`${baseSlug}-${random}`);
    }

    return suggestions;
}

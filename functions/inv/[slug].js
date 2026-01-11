export async function onRequest(context) {
    const url = new URL(context.request.url);
    const slug = context.params.slug;

    // Known static directories that should be served directly
    // (they have their own index.html files)
    const staticDirs = ['preview', 'demo-perkahwinan', 'demo-korporat', 'demo-keluarga', 'demo-hari-jadi', 'demo-komuniti'];

    if (staticDirs.includes(slug)) {
        // Explicitly construct the path to the directory (trailing slash)
        // Cloudflare/Next will serve the index.html from here without redirect
        const staticUrl = new URL(`/inv/${slug}/`, url);
        return context.env.ASSETS.fetch(staticUrl);
    }

    // For dynamic slugs (actual invitations), serve the base template
    const indexUrl = new URL('/inv/', url);
    return context.env.ASSETS.fetch(indexUrl);
}

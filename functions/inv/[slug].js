export async function onRequest(context) {
    const url = new URL(context.request.url);
    const slug = context.params.slug;

    // Known static directories that should be served directly
    // (they have their own index.html files)
    const staticDirs = ['preview', 'demo-perkahwinan', 'demo-korporat', 'demo-keluarga', 'demo-hari-jadi', 'demo-komuniti'];

    if (staticDirs.includes(slug)) {
        // Explicitly construct the path to the index.html
        const staticUrl = new URL(`/inv/${slug}/index.html`, url);
        return context.env.ASSETS.fetch(staticUrl);
    }

    // For dynamic slugs (actual invitations), serve the base template
    const indexUrl = new URL('/inv/index.html', url);
    return context.env.ASSETS.fetch(indexUrl);
}

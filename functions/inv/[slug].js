export async function onRequest(context) {
    // Rewrite all requests strictly to /inv/index.html
    const url = new URL(context.request.url);
    const indexUrl = new URL('/inv/index.html', url);
    return context.env.ASSETS.fetch(indexUrl);
}

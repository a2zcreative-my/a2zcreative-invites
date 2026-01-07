/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // For Cloudflare Pages: Export as static HTML
    // API routes are handled by Cloudflare Workers functions in /functions folder
    output: 'export',
    images: {
        unoptimized: true
    },
    pageExtensions: ['tsx', 'ts'],
    trailingSlash: true
};

export default nextConfig;

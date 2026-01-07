import InvitationDemoClient from './client';

// Required for static export
export async function generateStaticParams() {
    return [
        { slug: 'demo-perkahwinan' },
        { slug: 'demo-korporat' },
        { slug: 'demo-keluarga' },
        { slug: 'demo-hari-jadi' },
        { slug: 'demo-komuniti' },
    ];
}

export default async function InvitationDemoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <InvitationDemoClient slug={slug} />;
}

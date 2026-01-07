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

export default function InvitationDemoPage({ params }: { params: { slug: string } }) {
    return <InvitationDemoClient slug={params.slug} />;
}

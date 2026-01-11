import { Suspense } from 'react';
import InvitationDemoClient from './client';

// Required for static export: Generate only the root /inv (which will act as SPA entry)
export async function generateStaticParams() {
    return [
        { slug: [] },
        { slug: ['demo-perkahwinan'] },
        { slug: ['demo-hari-jadi'] },
        { slug: ['demo-korporat'] },
        { slug: ['demo-keluarga'] },
        { slug: ['demo-komuniti'] }
    ];
}

export default async function InvitationDemoPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    // Extract the first segment of the slug, or undefined if root
    const slugString = resolvedParams.slug?.[0];

    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
            <InvitationDemoClient slug={slugString || ''} />
        </Suspense>
    );
}

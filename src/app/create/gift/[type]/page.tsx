import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import GiftFormContainer from '@/components/forms/GiftFormContainer';

export function generateStaticParams() {
    return [
        { type: 'wedding' },
        { type: 'birthday' },
        { type: 'business' },
        { type: 'corporate' },
        { type: 'family' },
        { type: 'community' }
    ];
}

export default function GiftPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#020617]">
                <div className="text-center">
                    <Loader2 className="animate-spin text-[var(--brand-gold)] mx-auto mb-4" size={48} />
                </div>
            </div>
        }>
            <GiftFormContainer />
        </Suspense>
    );
}

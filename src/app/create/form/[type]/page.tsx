import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import EventFormContainer from '@/components/forms/EventFormContainer';

// Required for static export with dynamic routes
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

export default function EventFormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#020617]">
                <div className="text-center">
                    <Loader2 className="animate-spin text-[var(--brand-gold)] mx-auto mb-4" size={48} />
                    <p className="text-slate-400">Memuatkan borang...</p>
                </div>
            </div>
        }>
            <EventFormContainer />
        </Suspense>
    );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Heart, Building2, Users, Cake, TreePine, ArrowRight, Loader2 } from 'lucide-react';
import LandingBackground from '../../components/landing/LandingBackground';
import Navbar from '../../components/Navbar';

// --- CONFIGURATION CONSTANTS ---
const EVENT_TYPES = [
    { id: 'wedding', label: 'Perkahwinan', icon: Heart, description: 'Tema romantik dengan RSVP, ucapan tetamu, dan galeri foto.' },
    { id: 'birthday', label: 'Hari Jadi', icon: Cake, description: 'Tema ceria untuk sambutan ulang tahun yang meriah.' },
    { id: 'family', label: 'Keluarga', icon: Users, description: 'Kenduri, aqiqah, reunion — kumpul keluarga dengan mudah.' },
    { id: 'business', label: 'Korporat', icon: Building2, description: 'Seminar, AGM, majlis makan malam syarikat dengan daftar masuk QR.' },
    { id: 'community', label: 'Komuniti', icon: TreePine, description: 'Gotong-royong, hari sukan, atau aktiviti kemasyarakatan.' }
];

const PLANS: Record<string, { name: string; price: string; allowedEvents: string[] }> = {
    free: { name: 'Percuma', price: 'RM0', allowedEvents: ['wedding', 'birthday', 'family', 'business', 'community'] },
    basic: { name: 'Asas', price: 'RM49', allowedEvents: ['wedding', 'birthday', 'family', 'business', 'community'] },
    popular: { name: 'Popular', price: 'RM99', allowedEvents: ['wedding', 'birthday', 'family'] },
    business: { name: 'Bisnes', price: 'RM199', allowedEvents: ['business', 'community'] }
};

// Inner component that uses useSearchParams
function CreateEventContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [eventType, setEventType] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);

    // Get package from URL query parameter
    const selectedPackage = searchParams.get('package') || 'free';
    const planInfo = PLANS[selectedPackage] || PLANS.free;

    // Auth Check - Non-blocking, just to pre-fetch user info
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Cache-Control': 'no-store' },
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        setUser(data.user);
                    }
                }
            } catch (e) {
                console.error('Session check failed:', e);
            }
        };

        checkAuth();
    }, [selectedPackage]);

    const allowedEventTypes = EVENT_TYPES.filter(type =>
        planInfo.allowedEvents.includes(type.id)
    );

    const handleCreateEvent = async () => {
        if (!eventType) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/events/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventType, planId: selectedPackage }),
                credentials: 'include'
            });

            const data = await response.json() as any;

            if (response.ok && data.success) {
                router.push(data.redirect || '/dashboard?new=true');
            } else {
                if (response.status === 401) {
                    localStorage.removeItem('a2z_user');
                    window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                    return;
                }
                throw new Error(data.error || 'Gagal mencipta jemputan');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Gagal mencipta jemputan. Sila cuba lagi.');
            setLoading(false);
        }
    };

    return (
        <LandingBackground>
            <div className="landing-page relative">
                <Navbar />

                <section
                    className="pricing flex flex-col items-center w-full px-4 pb-24"
                    style={{ paddingTop: '120px', minHeight: '100vh' }}
                >
                    <div className="w-full max-w-6xl">

                        {/* Package Badge */}
                        <div className="text-center mb-8">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/30 rounded-full text-[var(--brand-gold)] text-sm">
                                <Check size={16} />
                                Pakej Dipilih: <strong>{planInfo.name}</strong> ({planInfo.price})
                            </span>
                        </div>

                        {error && (
                            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-center">
                                {error}
                            </div>
                        )}

                        {/* Glass Cards Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
                        <div
                            className="event-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '1.5rem',
                                maxWidth: '1100px',
                                margin: '0 auto'
                            }}
                        >
                            {allowedEventTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = eventType === type.id;
                                return (
                                    <div
                                        key={type.id}
                                        onClick={() => setEventType(type.id)}
                                        className={`event-card cursor-pointer ${isSelected ? 'selected' : ''}`}
                                        style={{
                                            position: 'relative',
                                            ...(isSelected ? {
                                                borderColor: 'var(--brand-gold)',
                                                boxShadow: '0 0 30px rgba(212, 175, 55, 0.25)'
                                            } : {})
                                        }}
                                    >
                                        {/* Icon Wrap with glassmorphism */}
                                        <div
                                            className="event-icon-wrap"
                                            style={isSelected ? {
                                                borderColor: 'rgba(212, 175, 55, 0.5)',
                                                boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
                                            } : {}}
                                        >
                                            <Icon
                                                className="event-icon"
                                                style={isSelected ? {
                                                    color: 'var(--brand-gold)',
                                                    filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))'
                                                } : {}}
                                            />
                                        </div>

                                        <h3 className="event-name" style={isSelected ? { color: 'var(--brand-gold)' } : {}}>
                                            {type.label}
                                        </h3>
                                        <p className="event-desc">{type.description}</p>

                                        {/* Selection checkmark */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                width: '28px',
                                                height: '28px',
                                                background: 'var(--brand-gold)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                                            }}>
                                                <Check size={16} strokeWidth={3} color="var(--bg-base)" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {allowedEventTypes.length < EVENT_TYPES.length && (
                            <p className="text-center text-slate-500 text-sm mt-6">
                                Beberapa jenis majlis tidak tersedia untuk pakej {planInfo.name}.
                                <Link href="/pricing" className="text-[var(--brand-gold)] ml-1 hover:underline">Tukar pakej</Link>
                            </p>
                        )}

                        {/* CTA Button - Only show when event type is selected */}
                        {eventType && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    disabled={loading}
                                    onClick={handleCreateEvent}
                                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all bg-[var(--brand-gold)] text-[var(--bg-base)] hover:scale-105 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Cipta Jemputan <ArrowRight size={18} /></>}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </LandingBackground >
    );
}

// Main export with Suspense wrapper
export default function CreateEventPage() {
    return (
        <Suspense fallback={
            <div className="landing-page flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        }>
            <CreateEventContent />
        </Suspense>
    );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Heart, Building2, Users, Cake, TreePine, ArrowRight, Loader2 } from 'lucide-react';

// --- CONFIGURATION CONSTANTS ---
const EVENT_TYPES = [
    { id: 'wedding', label: 'Perkahwinan', icon: Heart, description: 'Tema romantik & elegan' },
    { id: 'birthday', label: 'Hari Jadi', icon: Cake, description: 'Ceria & menyeronokkan' },
    { id: 'family', label: 'Keluarga', icon: Users, description: 'Reunion & kenduri' },
    { id: 'business', label: 'Korporat', icon: Building2, description: 'Profesional & rasmi' },
    { id: 'community', label: 'Komuniti', icon: TreePine, description: 'Persatuan & kelab' }
];

const PLANS: Record<string, { name: string; price: string; allowedEvents: string[] }> = {
    free: { name: 'Percuma', price: 'RM0', allowedEvents: ['wedding', 'birthday', 'family', 'business', 'community'] },
    basic: { name: 'Asas', price: 'RM49', allowedEvents: ['wedding', 'birthday', 'family', 'business', 'community'] },
    premium: { name: 'Premium', price: 'RM99', allowedEvents: ['wedding', 'birthday', 'family'] },
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
    const [authChecked, setAuthChecked] = useState(false);

    // Get package from URL query parameter
    const selectedPackage = searchParams.get('package') || 'free';
    const planInfo = PLANS[selectedPackage] || PLANS.free;

    // Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('a2z_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    setAuthChecked(true);
                    return;
                } catch (e) {
                    localStorage.removeItem('a2z_user');
                }
            }

            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json() as any;
                    if (data.authenticated && data.user) {
                        setUser(data.user);
                        localStorage.setItem('a2z_user', JSON.stringify(data.user));
                        setAuthChecked(true);
                        return;
                    }
                }
            } catch (e) {
                console.error('Session check failed:', e);
            }

            const currentUrl = `/create?package=${selectedPackage}`;
            router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
        };

        checkAuth();
    }, [router, selectedPackage]);

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
                throw new Error(data.error || 'Gagal mencipta jemputan');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Gagal mencipta jemputan. Sila cuba lagi.');
            setLoading(false);
        }
    };

    if (!authChecked) {
        return (
            <div className="landing-page flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    return (
        <div className="landing-page min-h-screen pb-20">
            <nav className="nav scrolled" style={{ background: 'rgba(2, 6, 23, 0.95)' }}>
                <div className="nav-container">
                    <Link href="/" className="nav-logo flex items-center gap-2 no-underline">
                        <img src="/logo.png" alt="A2Z" height="32" />
                        <span className="logo-text-gradient text-xl">A2ZCreative</span>
                    </Link>
                    <div className="nav-links">
                        <Link href="/pricing" className="nav-link text-sm">Tukar Pakej</Link>
                    </div>
                </div>
            </nav>

            <div className="container pt-32">
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

                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Apakah jenis majlis anda?</h1>
                        <p className="text-slate-400">Pilih jenis majlis yang sesuai dengan pakej <span className="text-[var(--brand-gold)]">{planInfo.name}</span> anda.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allowedEventTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = eventType === type.id;
                            return (
                                <div
                                    key={type.id}
                                    onClick={() => setEventType(type.id)}
                                    className={`cursor-pointer group relative p-6 rounded-2xl border transition-all duration-300
                                        ${isSelected
                                            ? 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)] shadow-[0_0_30px_rgba(255,215,0,0.15)]'
                                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                                        ${isSelected ? 'bg-[var(--brand-gold)] text-black' : 'bg-slate-800 text-slate-300 group-hover:text-white'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-[var(--brand-gold)]' : 'text-white'}`}>
                                        {type.label}
                                    </h3>
                                    <p className="text-sm text-slate-400">{type.description}</p>

                                    {isSelected && (
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-[var(--brand-gold)] text-black rounded-full p-1">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
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

                    <div className="mt-12 flex justify-center">
                        <button
                            disabled={!eventType || loading}
                            onClick={handleCreateEvent}
                            className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all
                                ${eventType && !loading
                                    ? 'bg-[var(--brand-gold)] text-[var(--bg-base)] hover:scale-105 shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Cipta Jemputan <ArrowRight size={18} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
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

'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Heart, Building2, Users, Cake, TreePine, ArrowRight, Loader2 } from 'lucide-react';
import LandingBackground from '../../components/landing/LandingBackground';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/ui/GlassCard';

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

    // Auth Check - BLOCKING: Redirect unauthenticated users immediately
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Cache-Control': 'no-store' },
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user) {
                        setUser(data.user);
                    } else {
                        // Not authenticated - redirect to login
                        console.log('Not authenticated, redirecting to login...');
                        localStorage.removeItem('a2z_user');
                        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                    }
                } else {
                    // API error - redirect to login
                    console.error('Auth API error:', res.status);
                    localStorage.removeItem('a2z_user');
                    window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                }
            } catch (e) {
                console.error('Session check failed:', e);
                // Network error - still try to show page, let create handle auth
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
                // Redirect to the event-specific setup form
                router.push(`/create/form/${eventType}?slug=${data.slug}&package=${selectedPackage}`);
            } else {
                // Handle authentication errors - always redirect to login
                if (response.status === 401) {
                    console.error('Auth failed - clearing session and redirecting...');
                    localStorage.removeItem('a2z_user');
                    // Force full redirect to ensure clean state
                    window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                    return;
                }
                // Show specific error from server (including details for debugging)
                const errorMsg = data.details
                    ? `${data.error || 'Error'}: ${data.details}`
                    : (data.error || `Ralat (${response.status}): Gagal mencipta jemputan`);
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error('Create event error:', err);
            // Check if it's a network error vs API error
            if (err.message.includes('fetch')) {
                setError('Ralat rangkaian. Sila periksa sambungan internet anda.');
            } else {
                setError(err.message || 'Gagal mencipta jemputan. Sila cuba lagi.');
            }
            setLoading(false);
        }
    };

    return (
        <LandingBackground>
            <div className="landing-page relative">
                <Navbar customLinks={[
                    { label: 'Utama', href: '/' },
                    { label: 'Kembali', href: '/pricing' }
                ]} />

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

                        {/* Glass Cards Grid - Standardized to use UI components */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {allowedEventTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = eventType === type.id;
                                return (
                                    <GlassCard
                                        key={type.id}
                                        variant={isSelected ? 'featured' : 'default'}
                                        padding="md"
                                        onClick={() => {
                                            if (eventType === type.id) {
                                                handleCreateEvent();
                                            } else {
                                                setEventType(type.id);
                                            }
                                        }}
                                        className={`
                                            cursor-pointer transition-all duration-300
                                            hover:border-white/30 hover:bg-slate-900/50
                                            ${isSelected ? 'scale-[1.02] ring-1 ring-[var(--brand-gold)]' : 'hover:-translate-y-1'}
                                        `}
                                    >
                                        <div className="flex flex-col items-center text-center gap-4">
                                            {/* Icon */}
                                            <div className={`
                                                p-4 rounded-2xl transition-all duration-300
                                                ${isSelected
                                                    ? 'bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                                    : 'bg-white/5 text-slate-400 group-hover:text-white'
                                                }
                                            `}>
                                                <Icon size={32} strokeWidth={1.5} />
                                            </div>

                                            {/* Text */}
                                            <div>
                                                <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-[var(--brand-gold)]' : 'text-white'}`}>
                                                    {type.label}
                                                </h3>
                                                <p className="text-sm text-slate-400 leading-relaxed">
                                                    {type.description}
                                                </p>
                                            </div>

                                            {/* Selection Indicator */}
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                                                    <div className="bg-[var(--brand-gold)] rounded-full p-1 shadow-lg shadow-[var(--brand-gold)]/20">
                                                        <Check size={14} className="text-black stroke-[3]" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Double Click Hint */}
                                            {isSelected && (
                                                <div className="mt-2 text-xs font-medium text-[var(--brand-gold)] bg-[var(--brand-gold)]/10 px-3 py-1.5 rounded-full animate-pulse border border-[var(--brand-gold)]/20">
                                                    👆 Klik sekali lagi untuk teruskan
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>

                        {allowedEventTypes.length < EVENT_TYPES.length && (
                            <p className="text-center text-slate-500 text-sm mt-6">
                                Beberapa jenis majlis tidak tersedia untuk pakej {planInfo.name}.
                                <Link href="/pricing" className="text-[var(--brand-gold)] ml-1 hover:underline">Tukar pakej</Link>
                            </p>
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

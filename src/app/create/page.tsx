'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Sparkles, Heart, Building2, Users, Cake, TreePine, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import GlassCard from '../../components/GlassCard';

// --- CONFIGURATION CONSTANTS (Strictly enforced) ---

const EVENT_TYPES = [
    { id: 'wedding', label: 'Perkahwinan', icon: Heart, description: 'Tema romantik & elegan' },
    { id: 'birthday', label: 'Hari Jadi', icon: Cake, description: 'Ceria & menyeronokkan' },
    { id: 'family', label: 'Keluarga', icon: Users, description: 'Reunion & kenduri' },
    { id: 'business', label: 'Korporat', icon: Building2, description: 'Profesional & rasmi' },
    { id: 'community', label: 'Komuniti', icon: TreePine, description: 'Persatuan & kelab' }
];

const PLANS = {
    free: {
        id: 'free',
        name: 'Percuma',
        price: 'RM0',
        period: '14 hari percubaan',
        features: [
            { text: '10 tetamu maksimum', included: true },
            { text: '50 paparan', included: true },
            { text: 'Jemputan dengan watermark', included: true },
            { text: 'Kod QR check-in', included: false }
        ],
        ctaText: 'Pilih Percuma'
    },
    basic: {
        id: 'basic',
        name: 'Asas',
        price: 'RM49',
        period: 'sekali bayar',
        features: [
            { text: '100 tetamu maksimum', included: true },
            { text: '500 paparan', included: true },
            { text: 'Tiada watermark', included: true },
            { text: 'Kod QR untuk tetamu', included: true }
        ],
        ctaText: 'Pilih Asas'
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 'RM99',
        period: 'sekali bayar',
        popular: true,
        features: [
            { text: '300 tetamu maksimum', included: true },
            { text: '2,000 paparan', included: true },
            { text: 'Tiada watermark', included: true },
            { text: 'Check-in QR scanner', included: true },
            { text: 'Eksport CSV', included: true }
        ],
        ctaText: 'Pilih Premium'
    },
    business: {
        id: 'business',
        name: 'Bisnes',
        price: 'RM199',
        period: 'sekali bayar',
        features: [
            { text: '1,000 tetamu maksimum', included: true },
            { text: '10,000 paparan', included: true },
            { text: 'Semua ciri Premium', included: true },
            { text: 'Multiple events', included: true },
            { text: 'Sokongan prioriti', included: true }
        ],
        ctaText: 'Pilih Bisnes'
    }
};

// Rules: Which plans are available for which event type
const PLAN_AVAILABILITY = {
    wedding: ['free', 'basic', 'premium'],
    birthday: ['free', 'basic', 'premium'],
    family: ['free', 'basic', 'premium'],
    business: ['free', 'basic', 'business'],
    community: ['free', 'basic', 'business']
};

// --- COMPONENT ---

export default function CreateEventPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [eventType, setEventType] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);

    // Initial Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            // First check localStorage for cached user
            const storedUser = localStorage.getItem('a2z_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    return; // User found in localStorage
                } catch (e) {
                    console.error('Failed to parse stored user:', e);
                    localStorage.removeItem('a2z_user'); // Clear invalid data
                }
            }

            // If not in localStorage, check session from server
            try {
                const res = await fetch('/api/auth/session', {
                    credentials: 'include' // Important: send cookies
                });

                if (res.ok) {
                    const data = await res.json() as any;
                    if (data.authenticated && data.user) {
                        setUser(data.user);
                        // Cache in localStorage for faster subsequent loads
                        localStorage.setItem('a2z_user', JSON.stringify(data.user));
                        return; // User is authenticated
                    }
                }
            } catch (e) {
                console.error('Session check failed:', e);
            }

            // Only redirect if definitely not authenticated
            router.push('/auth/login?redirect=/create');
        };

        checkAuth();
    }, [router]);

    // Derived State: Available Plans based on Event Type
    const availablePlans = eventType && PLAN_AVAILABILITY[eventType as keyof typeof PLAN_AVAILABILITY]
        ? PLAN_AVAILABILITY[eventType as keyof typeof PLAN_AVAILABILITY].map(planId => PLANS[planId as keyof typeof PLANS])
        : [];

    const handleCreateEvent = async (planId: string) => {
        setSelectedPlan(planId);
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/events/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventType, planId }),
                credentials: 'include' // Important: Send session cookie
            });

            const data = await response.json() as any;

            if (response.ok && data.success) {
                // Redirect to dashboard or editor
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

    if (!user) {
        return (
            <div className="landing-page flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    return (
        <div className="landing-page min-h-screen pb-20">
            {/* Simple Header */}
            <nav className="nav scrolled" style={{ background: 'rgba(2, 6, 23, 0.95)' }}>
                <div className="nav-container">
                    <Link href="/" className="nav-logo flex items-center gap-2 no-underline">
                        <img src="/logo.png" alt="A2Z" height="32" />
                        <span className="logo-text-gradient text-xl">A2ZCreative</span>
                    </Link>
                    <div className="nav-links">
                        <Link href="/dashboard" className="nav-link text-sm">Kembali ke Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="container pt-32">
                {/* Progress Indicator */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-400">
                        <span className={`${step >= 1 ? 'text-[var(--brand-gold)]' : ''}`}>1. Jenis Majlis</span>
                        <ArrowRight size={14} />
                        <span className={`${step >= 2 ? 'text-[var(--brand-gold)]' : ''}`}>2. Pilihan Pakej</span>
                        <ArrowRight size={14} />
                        <span className={`${step >= 3 ? 'text-[var(--brand-gold)]' : ''}`}>3. Butiran</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-slate-800 mt-4 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--brand-gold)] transition-all duration-500 ease-out"
                            style={{ width: `${step * 33.33}%` }}
                        />
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-center">
                        {error}
                    </div>
                )}

                {/* STEP 1: EVENT TYPE */}
                {step === 1 && (
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Apakah jenis majlis anda?</h1>
                            <p className="text-slate-400">Kami akan sediakan tema dan ciri yang sesuai untuk anda.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {EVENT_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isSelected = eventType === type.id;
                                return (
                                    <div
                                        key={type.id}
                                        onClick={() => setEventType(type.id)}
                                        className={`
                                            cursor-pointer group relative p-6 rounded-2xl border transition-all duration-300
                                            ${isSelected
                                                ? 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)] shadow-[0_0_30px_rgba(255,215,0,0.15)]'
                                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                                            ${isSelected ? 'bg-[var(--brand-gold)] text-black' : 'bg-slate-800 text-slate-300 group-hover:text-white'}
                                        `}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-[var(--brand-gold)]' : 'text-white'}`}>
                                            {type.label}
                                        </h3>
                                        <p className="text-sm text-slate-400">{type.description}</p>

                                        {/* Selection Checkmark */}
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 text-[var(--brand-gold)]">
                                                <div className="bg-[var(--brand-gold)] text-black rounded-full p-1">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-12 flex justify-end">
                            <button
                                disabled={!eventType}
                                onClick={() => setStep(2)}
                                className={`
                                    flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all
                                    ${eventType
                                        ? 'bg-[var(--brand-gold)] text-[var(--bg-base)] hover:scale-105 shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }
                                `}
                            >
                                Seterusnya <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PLAN SELECTION */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-10">
                            <button
                                onClick={() => setStep(1)}
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"
                            >
                                <ArrowLeft size={16} /> Kembali
                            </button>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Pilih Pakej Anda</h1>
                            <p className="text-slate-400">
                                Pakej yang tersedia untuk majlis <span className="text-[var(--brand-gold)] font-semibold">{EVENT_TYPES.find(t => t.id === eventType)?.label}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {availablePlans.map((plan, index) => (
                                <GlassCard
                                    key={index}
                                    variant={(plan as any).popular ? 'featured' : 'default'}
                                    className="relative flex flex-col h-full"
                                >
                                    {(plan as any).popular && <span className="popular-badge">Popular</span>}

                                    <h3 className="package-name glass-text-title">{plan.name}</h3>

                                    <div className="package-price my-4">
                                        <div className={`price-amount glass-text-price ${(plan as any).popular ? 'price-premium' : ''}`}>
                                            {plan.price}
                                        </div>
                                        <div className="price-period glass-text-subtitle">{plan.period}</div>
                                    </div>

                                    <ul className="package-features flex-grow mb-8 space-y-3">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className={`glass-list-item flex items-start gap-3 text-sm ${!f.included ? 'opacity-50' : 'text-slate-300'}`}>
                                                {f.included ?
                                                    <Check size={16} className="text-[var(--brand-gold)] mt-1 flex-shrink-0" /> :
                                                    <X size={16} className="text-slate-500 mt-1 flex-shrink-0" />
                                                }
                                                <span>{f.text}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleCreateEvent(plan.id)}
                                        disabled={loading}
                                        className={`
                                            w-full py-3 rounded-lg font-bold transition-all mt-auto flex items-center justify-center gap-2
                                            ${(plan as any).popular
                                                ? 'bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-slate-900 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                            }
                                            ${loading ? 'opacity-70 cursor-wait' : ''}
                                        `}
                                    >
                                        {loading && selectedPlan === plan.id ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            plan.ctaText
                                        )}
                                    </button>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

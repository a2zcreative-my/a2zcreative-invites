'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, Clock, Music, FileWarning } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { THEMES, FONTS, THEME_COLORS, DESIGN_TEMPLATES, DEFAULT_MUSIC } from '@/lib/themes';
import OpeningCard from '@/components/invitation/OpeningCard';
import FloatingDock from '@/components/invitation/FloatingDock';
import InvitationContent from '@/components/invitation/InvitationContent';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

// Demo data (Static)
const demoInvitations: Record<string, any> = {
    'demo-perkahwinan': {
        type: 'Perkahwinan',
        // ... (rest of demo data is unchanged, just showing context for imports)

        icon: '💒',
        title: 'Majlis Perkahwinan',
        couple: 'Ahmad & Siti',
        date: '15 Mac 2025',
        time: '11:00 pagi - 4:00 petang',
        venue: 'Dewan Seri Kenanga',
        address: 'Jalan Bunga Raya, Shah Alam',
        message: 'Dengan segala hormatnya, kami menjemput Tuan/Puan ke majlis perkahwinan anak kami.',
        themeId: 'classic',
    },
    'demo-korporat': {
        type: 'Korporat',
        icon: '🏢',
        title: 'Annual Gala Dinner 2025',
        couple: 'Syarikat ABC Sdn Bhd',
        date: '20 April 2025',
        time: '7:00 malam - 11:00 malam',
        venue: 'Grand Ballroom, Hotel Marriott',
        address: 'Kuala Lumpur City Centre',
        message: 'You are cordially invited to our Annual Gala Dinner.',
        themeId: 'modern',
    },
    'demo-keluarga': {
        type: 'Keluarga',
        icon: '👨‍👩‍👧‍👦',
        title: 'Kenduri Kesyukuran',
        couple: 'Keluarga Encik Razak',
        date: '5 Mei 2025',
        time: '12:00 tengahari - 5:00 petang',
        venue: 'Rumah Keluarga',
        address: 'Kampung Seri Menanti, Negeri Sembilan',
        message: 'Kami menjemput saudara-mara dan sahabat handai ke majlis kenduri kesyukuran kami.',
        themeId: 'floral',
    },
    'demo-hari-jadi': {
        type: 'Hari Jadi',
        icon: '🎂',
        title: 'Sambutan Ulangtahun ke-7',
        couple: 'Adik Aisyah',
        date: '10 Jun 2025',
        time: '3:00 petang - 6:00 petang',
        venue: 'Funland Kids Party',
        address: 'IOI City Mall, Putrajaya',
        message: 'Jom raikan hari istimewa Adik Aisyah bersama-sama!',
        themeId: 'technology',
    },
    'demo-komuniti': {
        type: 'Komuniti',
        icon: '🌿',
        title: 'Gotong-Royong Perdana',
        couple: 'Persatuan Penduduk Taman Maju',
        date: '25 Jun 2025',
        time: '7:00 pagi - 12:00 tengahari',
        venue: 'Taman Permainan Taman Maju',
        address: 'Taman Maju, Petaling Jaya',
        message: 'Mari bersama-sama menjayakan aktiviti gotong-royong kawasan kita.',
        themeId: 'luxury',
    },
};

export default function InvitationDemoClient({ slug: propSlug }: { slug?: string }) {
    const params = useParams();
    const searchParams = useSearchParams();

    // State to hold the resolved slug
    const [slug, setSlug] = useState<string>(propSlug || '');

    // --- STATE & HOOKS (Must be at top level) ---
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isOpened, setIsOpened] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [wishes, setWishes] = useState<any[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Resolve slug from params or window location
        let resolvedSlug = propSlug || '';

        if (!resolvedSlug) {
            if (params?.slug) {
                resolvedSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
            }
        }

        // Fallback: Parse from window.location.pathname for client-side rewrites
        // URL format: /inv/slug-name
        if (!resolvedSlug && typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            // pathParts[0] should be 'inv', pathParts[1] is the slug
            if (pathParts.length >= 2 && pathParts[0] === 'inv') {
                resolvedSlug = pathParts[1];
            }
        }

        setSlug(resolvedSlug);
    }, [params, propSlug]);

    const isPreview = searchParams.get('preview') === 'true';

    useEffect(() => {
        if (!slug) return; // Should handle root /inv

        // 1. Check Demo
        if (demoInvitations[slug]) {
            setEvent(demoInvitations[slug]);
            setLoading(false);
            return;
        }

        // 2. Fetch Real Event
        async function fetchEvent() {
            try {
                const res = await fetch(`/api/events/get-details?slug=${slug}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Jemputan tidak dijumpai');
                    throw new Error('Ralat memuatkan jemputan');
                }
                const data = await res.json();

                // Format Real Data to match structure
                // Assuming data returns { success: true, eventDetails: ... }
                // get-details.js returns { ...eventDetails }
                setEvent(data.eventDetails || data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchEvent();
    }, [slug]);

    if (!slug) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950 text-center">
                <GlassCard variant="featured" className="max-w-md w-full flex flex-col items-center" padding="lg">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <FileWarning className="w-8 h-8 text-[var(--brand-gold)]" />
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-3">
                        Pautan Diperlukan
                    </h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Sila masukkan pautan jemputan yang sah atau cipta jemputan baru anda sekarang.
                    </p>
                    <Link href="/create" className="w-full">
                        <GlassButton variant="primary" size="full">
                            Cipta Jemputan Baru
                        </GlassButton>
                    </Link>
                    <Link href="/" className="mt-4 w-full">
                        <GlassButton variant="ghost" size="full">
                            Ke Halaman Utama
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-[var(--brand-gold)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="landing-page flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950">
                <GlassCard variant="featured" className="text-center max-w-md w-full flex flex-col items-center" padding="lg">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <FileWarning className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Jemputan Tidak Dijumpai</h2>
                    <p className="text-slate-400 mb-6">{error || 'Maaf, pautan ini tidak wujud atau telah tamat tempoh.'}</p>
                    <Link href="/">
                        <GlassButton variant="primary" leftIcon={<ArrowLeft size={16} />}>
                            Kembali Ke Utama
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    // --- RENDER THEME ---
    // Extract Theme Config
    const themeConfig = event.themeConfig || {};
    const templateId = themeConfig.templateId || event.templateId || event.themeId || 'classic-gold';

    // Look up the template from DESIGN_TEMPLATES
    const template = DESIGN_TEMPLATES.find(t => t.id === templateId) || DESIGN_TEMPLATES[0];
    const templateDesign = template.design;

    // Use template design properties
    const fontId = templateDesign.font || themeConfig.font || 'playfair';
    const primaryColor = templateDesign.accentColor || '#d4af37';
    const bgColor = templateDesign.bgColor || '#020617';
    const bgGradient = templateDesign.bgGradient || `radial-gradient(circle at 50% 0%, ${primaryColor}20 0%, transparent 70%)`;
    const textColor = templateDesign.textColor || '#ffffff';

    // Resolve Font Variable
    const fontDef = FONTS.find(f => f.id === fontId) || FONTS[1]; // default playfair
    const fontFamily = `var(${fontDef.variable || '--font-playfair'})`;

    // Normalize Data
    /* LOGGING TO DEBUG DATA MAPPING ISSUES */
    console.log('[DEBUG] Rendering Event:', event);

    const displayTitle = event.eventTitle || event.title || event.event_name;

    // Determine "Couple" or "Main Subject" name
    let displayCouple = event.couple;

    if (!displayCouple) {
        // Try various snake_case and camelCase combos
        const groom = event.groomName || event.groom_name;
        const bride = event.brideName || event.bride_name;
        const celebrant = event.celebrantName || event.celebrant_name || event.childName || event.child_name;
        const organizer = event.organizer || event.host;

        if (groom && bride) {
            displayCouple = `${groom} & ${bride}`;
        } else if (celebrant) {
            displayCouple = celebrant;
        } else if (organizer) {
            displayCouple = organizer;
        } else {
            // Check formatted fields from some APIs
            displayCouple = event.main_subject || displayTitle;
        }
    }

    // Music Logic
    const musicTrack = themeConfig.music ? DEFAULT_MUSIC.find(m => m.id === themeConfig.music) : null;

    // Handlers
    const handleOpen = () => {
        setIsOpened(true);
        setTimeout(() => setShowContent(true), 100);

        // Play Music
        if (musicTrack && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Auto-play blocked:", e));
        }
    };

    return (
        <div style={{
            fontFamily,
            minHeight: '100vh',
            background: bgColor,
            backgroundImage: bgGradient,
            color: textColor,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowX: 'hidden'
        }}>

            {/* Global Style Injection for Font */}
            <style jsx global>{`
                .is-font-serif { font-family: ${fontFamily}, serif; }
            `}</style>

            {/* Background Audio */}
            {musicTrack && (
                <audio ref={audioRef} loop src={musicTrack.src} />
            )}

            {/* --- MOBILE CONTAINER (The "Phone" View) --- */}
            <div
                className="w-full max-w-[430px] min-h-screen relative shadow-2xl overflow-hidden mx-auto transition-transform duration-700 ease-out flex flex-col"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    boxShadow: '0 0 80px rgba(0,0,0,0.8)',
                    transformOrigin: 'top center'
                }}
            >
                {/* --- OPENING CARD OVERLAY --- */}
                <OpeningCard
                    template={template}
                    title={displayTitle}
                    coupleName={displayCouple}
                    musicName={musicTrack?.name}
                    onOpen={handleOpen}
                    isVisible={!isOpened}
                />

                {/* --- MAIN CONTENT (Fade in) --- */}
                <div className={`flex-1 transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'opacity-0'} relative`}>

                    {/* Back Button (Preview Mode) */}
                    {(isPreview || demoInvitations[slug]) && isOpened && (
                        <div className="absolute top-4 left-4 z-50">
                            <Link href="/" className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur text-xs font-medium text-white/70 hover:bg-black/60 flex items-center gap-2">
                                <ArrowLeft size={14} /> Home
                            </Link>
                        </div>
                    )}

                    {/* Music Toggle */}
                    {themeConfig.music && isOpened && (
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => {
                                    if (audioRef.current?.paused) audioRef.current.play();
                                    else audioRef.current?.pause();
                                }}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center animate-spin-slow hover:bg-white/20"
                            >
                                <Music size={16} color={primaryColor} />
                            </button>
                        </div>
                    )}

                    <InvitationContent
                        data={event}
                        template={template}
                        primaryColor={primaryColor}
                        eventSlug={slug}
                        wishes={wishes}
                        onWishSubmitted={() => {
                            // TODO: Refetch wishes
                        }}
                    />

                    {/* --- FLOATING DOCK --- */}
                    {isOpened && (
                        <div className="animate-slide-up-fade absolute bottom-0 left-0 right-0 z-40">
                            <FloatingDock
                                primaryColor={primaryColor}
                                isMusicPlaying={isMusicPlaying}
                                onMusicToggle={() => {
                                    if (audioRef.current?.paused) {
                                        audioRef.current.play();
                                        setIsMusicPlaying(true);
                                    } else {
                                        audioRef.current?.pause();
                                        setIsMusicPlaying(false);
                                    }
                                }}
                                whatsappNumber={event.whatsapp || event.phone || event.contact_phone}
                                showGift={!!(event.bankAccounts || event.bank_accounts || event.giftAccounts)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

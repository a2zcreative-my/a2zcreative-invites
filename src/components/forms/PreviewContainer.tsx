'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Rocket, CheckCircle2, Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import StepIndicator from '@/components/ui/StepIndicator';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export default function PreviewContainer() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const type = params.type as string;
    const slug = searchParams.get('slug');
    const selectedPackage = searchParams.get('package') || 'free';

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [eventData, setEventData] = useState<any>(null);
    const [eventId, setEventId] = useState<number | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEventData = async () => {
            if (!slug) {
                setFetchingData(false);
                return;
            }

            try {
                const response = await fetch(`/api/events/get-details?slug=${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.eventDetails) {
                        setEventData(data.eventDetails);
                        // Store event ID if returned
                        if (data.eventId) {
                            setEventId(data.eventId);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching event data:', err);
            } finally {
                setFetchingData(false);
            }
        };

        fetchEventData();
    }, [slug]);

    const handlePublish = async () => {
        setLoading(true);
        setPaymentError(null);

        try {
            // Check if this is a paid package
            const isPaidPackage = selectedPackage === 'basic' || selectedPackage === 'premium' || selectedPackage === 'business';

            if (isPaidPackage) {
                // Create payment order and redirect to payment checkout page
                const paymentResponse = await fetch('/api/payment/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        eventId: eventId,
                        packageId: selectedPackage,
                        paymentMethod: 'billplz'
                    })
                });

                const paymentData = await paymentResponse.json();

                if (!paymentResponse.ok) {
                    throw new Error(paymentData.error || 'Gagal mencipta pembayaran');
                }

                if (paymentData.success && paymentData.paymentUrl) {
                    // Redirect to payment checkout page with countdown timer
                    const checkoutParams = new URLSearchParams({
                        url: encodeURIComponent(paymentData.paymentUrl),
                        order: paymentData.orderRef,
                        package: selectedPackage,
                        amount: (paymentData.amount / 100).toFixed(2)
                    });
                    router.push(`/create/payment?${checkoutParams.toString()}`);
                    return; // Don't set loading to false, we're redirecting
                } else {
                    throw new Error('URL pembayaran tidak diterima');
                }
            } else {
                // Free package - publish directly without payment
                // Call publish API to set status to 'published'
                const publishResponse = await fetch('/api/events/publish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ slug })
                });

                if (publishResponse.ok) {
                    setIsPublished(true);
                } else {
                    const errorData = await publishResponse.json();
                    throw new Error(errorData.error || 'Gagal menerbitkan kad');
                }
            }

        } catch (err: any) {
            console.error('Publish/Payment error:', err);
            setPaymentError(err.message || 'Ralat berlaku. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (!slug) return null;

    if (isPublished) {
        return (
            <LandingBackground>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <GlassCard className="text-center p-8">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Tahniah!</h2>
                            <p className="text-slate-300 mb-8">Kad jemputan anda telah berjaya diterbitkan.</p>

                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-8">
                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Pautan Jemputan</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm text-[var(--brand-gold)] bg-black/30 p-2 rounded">
                                        a2zcreative.com/inv/{slug}
                                    </code>
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href={`/inv/${slug}`}
                                    target="_blank"
                                    className="btn btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    Lihat Kad Jemputan
                                    <ExternalLink size={18} />
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="btn btn-ghost w-full py-4 rounded-xl font-bold text-slate-400 hover:text-white"
                                >
                                    Kembali ke Dashboard
                                </Link>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </LandingBackground>
        );
    }

    return (
        <LandingBackground>
            <div className="min-h-screen pb-20">
                <Navbar />

                <div className="container mx-auto px-4" style={{ paddingTop: '120px' }}>
                    <div className="max-w-4xl mx-auto mb-8">
                        <Link
                            href={type === 'wedding' || type === 'birthday'
                                ? `/create/gift/${type}?slug=${slug}&package=${selectedPackage}`
                                : `/create/contact/${type}?slug=${slug}&package=${selectedPackage}`
                            }
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </Link>

                        <StepIndicator
                            currentStep={type === 'wedding' || type === 'birthday' ? 7 : 6}
                            eventType={type}
                        />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Pratonton</h2>
                        <p className="text-slate-400 text-sm">Semak kad jemputan anda sebelum diterbitkan.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <GlassCard variant="deep" className="mb-8">
                            <div className="p-4 md:p-8">
                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    {/* Left Column - Info Cards */}
                                    <div className="space-y-6">
                                        {/* Pakej Section */}
                                        <div className="p-5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
                                            <span className="inline-block px-6 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-wider border border-blue-500/20">
                                                Pakej {selectedPackage === 'basic' ? 'Asas' : selectedPackage === 'free' ? 'Percuma' : selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1)}
                                            </span>
                                        </div>

                                        {/* Butiran Majlis Section */}
                                        <div className="p-6 bg-slate-900/50 rounded-xl border border-white/5">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Rocket size={14} />
                                                Butiran Majlis
                                            </h3>
                                            <div className="space-y-4">
                                                {/* Event Name / Title */}
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Tajuk Majlis</label>
                                                    <p className="text-white text-lg font-bold leading-tight">
                                                        {(() => {
                                                            if (!eventData) return 'Belum diisi';

                                                            if (type === 'wedding') {
                                                                return eventData.groom_name && eventData.bride_name
                                                                    ? `${eventData.groom_name} & ${eventData.bride_name}`
                                                                    : (eventData.event_name || 'Majlis Perkahwinan');
                                                            }

                                                            if (type === 'birthday') {
                                                                const name = eventData.celebrant_name || eventData.event_name || 'Majlis Hari Jadi';
                                                                const age = eventData.age ? ` (${eventData.age} Tahun)` : '';
                                                                return `${name}${age}`;
                                                            }

                                                            if (type === 'business' || type === 'corporate') {
                                                                return eventData.event_title || eventData.event_name || 'Majlis Korporat';
                                                            }

                                                            return eventData.event_name || 'Majlis Baru';
                                                        })()}
                                                    </p>
                                                </div>

                                                <div className="h-px bg-white/5 my-2" />

                                                {/* Event Details Grid */}
                                                <div className="grid grid-cols-1 gap-4">
                                                    {/* Date */}
                                                    <div>
                                                        <label className="text-xs text-slate-500 block mb-1">Tarikh</label>
                                                        <p className="text-slate-300 font-medium">{eventData?.event_date || 'Belum ditetapkan'}</p>
                                                    </div>

                                                    {/* Time */}
                                                    {eventData?.event_time && (
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">Masa</label>
                                                            <p className="text-slate-300 font-medium">{eventData.event_time}</p>
                                                        </div>
                                                    )}

                                                    {/* Location */}
                                                    {eventData?.location && (
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">Lokasi</label>
                                                            <p className="text-slate-300 font-medium">{eventData.location}</p>
                                                        </div>
                                                    )}

                                                    {/* Organizer (Business Only) */}
                                                    {(type === 'business' || type === 'corporate') && eventData?.organizer && (
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">Penganjur</label>
                                                            <p className="text-slate-300 font-medium">{eventData.organizer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Mobile Preview */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            {/* Phone Frame */}
                                            <div className="relative w-[260px] h-[520px] bg-[#020617] rounded-[2.5rem] p-2 shadow-2xl border-4 border-slate-800">
                                                {/* Inner phone bezel */}
                                                <div className="relative w-full h-full bg-black rounded-[2rem] overflow-hidden">
                                                    <iframe
                                                        src={`/inv/${slug}?preview=true`}
                                                        className="w-full h-full border-0 bg-white"
                                                        title="Mobile Preview"
                                                    />
                                                    {/* Dynamic Island / Notch */}
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20" />
                                                </div>
                                            </div>
                                            {/* Phone shadow glow */}
                                            <div className="absolute -inset-4 bg-[var(--brand-gold)]/5 rounded-[3rem] blur-2xl -z-10" />
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-6">Pratonton Langsung</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* CTA Button Area */}
                        <div className="w-full">
                            {/* Error message */}
                            {paymentError && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <p className="text-sm font-medium">{paymentError}</p>
                                </div>
                            )}

                            <GlassButton
                                onClick={handlePublish}
                                variant="primary"
                                size="lg"
                                className="w-full font-bold shadow-xl shadow-[var(--brand-gold)]/10"
                                isLoading={loading}
                                rightIcon={<Rocket size={18} />}
                            >
                                {selectedPackage === 'free' ? 'Terbitkan Sekarang' : 'Teruskan ke Pembayaran'}
                            </GlassButton>

                            <p className="text-xs text-center text-slate-500 mt-4">
                                {selectedPackage === 'free'
                                    ? 'Anda masih boleh mengemaskini butiran selepas diterbitkan.'
                                    : 'Anda akan dialihkan ke halaman pembayaran selamat.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </LandingBackground>
    );
}

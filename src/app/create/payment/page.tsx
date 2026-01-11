'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, CreditCard, AlertTriangle, Shield } from 'lucide-react';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

// Package pricing display
const PACKAGES: Record<string, { name: string; price: string }> = {
    basic: { name: 'Asas', price: 'RM 49.00' },
    premium: { name: 'Premium', price: 'RM 99.00' },
    business: { name: 'Bisnes', price: 'RM 199.00' }
};

// Loading fallback component
function LoadingFallback() {
    return (
        <LandingBackground>
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)] rounded-full animate-spin" />
            </div>
        </LandingBackground>
    );
}

function PaymentCheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paymentUrl = searchParams.get('url');
    const orderRef = searchParams.get('order');
    const packageId = searchParams.get('package') || 'basic';
    const amount = searchParams.get('amount') || '49.00';

    // 15 minute countdown (900 seconds)
    const [timeLeft, setTimeLeft] = useState(900);
    const [isExpired, setIsExpired] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get timer color based on time left
    const getTimerColor = () => {
        if (timeLeft <= 60) return 'text-red-500';
        if (timeLeft <= 180) return 'text-orange-400';
        return 'text-[var(--brand-gold)]';
    };

    const handleProceedToPayment = () => {
        if (paymentUrl && !isExpired) {
            setRedirecting(true);
            window.location.href = decodeURIComponent(paymentUrl);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    const pkg = PACKAGES[packageId] || PACKAGES.basic;

    if (!paymentUrl) {
        return (
            <LandingBackground>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <GlassCard className="max-w-md w-full text-center p-8">
                        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Ralat Pembayaran</h2>
                        <p className="text-slate-400 mb-6">URL pembayaran tidak sah. Sila cuba lagi.</p>
                        <GlassButton
                            onClick={() => router.back()}
                            variant="primary"
                            className="px-6 py-3"
                        >
                            Kembali
                        </GlassButton>
                    </GlassCard>
                </div>
            </LandingBackground>
        );
    }

    return (
        <LandingBackground>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12 px-4">
                <div className="max-w-lg mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Pembayaran</h1>
                        <p className="text-slate-400">Sila lengkapkan pembayaran anda</p>
                    </div>

                    <GlassCard variant="deep" className="p-6 md:p-8">
                        {/* Countdown Timer */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full mb-4">
                                <Clock size={18} className={getTimerColor()} />
                                <span className="text-slate-400 text-sm">Masa berbaki</span>
                            </div>
                            <div className={`text-5xl md:text-6xl font-bold font-mono ${getTimerColor()}`}>
                                {formatTime(timeLeft)}
                            </div>
                            {!isExpired && (
                                <p className="text-slate-500 text-sm mt-2">
                                    Sila lengkapkan pembayaran dalam masa 15 minit
                                </p>
                            )}
                        </div>

                        {isExpired ? (
                            /* Expired State */
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={32} className="text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Masa Tamat</h3>
                                    <p className="text-slate-400">
                                        Sesi pembayaran anda telah tamat tempoh. Sila cuba lagi.
                                    </p>
                                </div>
                                <GlassButton
                                    onClick={() => router.back()}
                                    variant="primary"
                                    className="w-full font-bold"
                                >
                                    Cuba Lagi
                                </GlassButton>
                            </div>
                        ) : (
                            /* Active Payment State */
                            <>
                                {/* Order Summary */}
                                <div className="bg-slate-800/50 rounded-xl p-5 mb-6 border border-white/5">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                                        Ringkasan Pesanan
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-300">Pakej</span>
                                            <span className="text-white font-semibold">{pkg.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-300">No. Rujukan</span>
                                            <span className="text-slate-400 font-mono text-sm">{orderRef}</span>
                                        </div>
                                        <div className="border-t border-slate-700 pt-3 mt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-semibold">Jumlah</span>
                                                <span className="text-2xl font-bold text-[var(--brand-gold)]">
                                                    RM {amount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Badge */}
                                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-6">
                                    <Shield size={16} />
                                    <span>Pembayaran selamat melalui Billplz</span>
                                </div>

                                {/* CTA Buttons */}
                                <div className="space-y-3">
                                    <GlassButton
                                        onClick={handleProceedToPayment}
                                        disabled={redirecting}
                                        variant="primary"
                                        size="lg"
                                        className="w-full font-bold shadow-xl shadow-[var(--brand-gold)]/10"
                                        isLoading={redirecting}
                                        leftIcon={<CreditCard size={20} />}
                                    >
                                        {redirecting ? "Mengalihkan..." : "Teruskan ke Pembayaran"}
                                    </GlassButton>

                                    <GlassButton
                                        onClick={handleCancel}
                                        variant="ghost"
                                        className="w-full text-slate-400 hover:text-white"
                                    >
                                        Batal
                                    </GlassButton>
                                </div>
                            </>
                        )}
                    </GlassCard>

                    {/* Note */}
                    <p className="text-center text-slate-500 text-xs mt-6">
                        Jangan tutup halaman ini sehingga pembayaran selesai.
                    </p>
                </div>
            </div>
        </LandingBackground>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentCheckoutContent />
        </Suspense>
    );
}

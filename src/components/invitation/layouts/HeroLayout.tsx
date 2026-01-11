'use client';

import React from 'react';
import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { LayoutProps, SPACING_MAP, FONT_SCALE_MAP, RADIUS_MAP } from './types';
import ItinerarySection from '../ItinerarySection';
import WishesSection from '../WishesSection';
import GiftSection from '../GiftSection';

/**
 * HeroLayout - The default, impressive layout.
 * Full-screen hero section with large typography, followed by stacked content sections.
 * Best for: Weddings, Grand Events
 */
export default function HeroLayout({
    data,
    preset,
    eventRules,
    primaryColor,
    eventSlug,
    wishes = [],
    onWishSubmitted
}: LayoutProps) {

    const spacing = SPACING_MAP[eventRules.spacing];
    const fontScale = FONT_SCALE_MAP[eventRules.fontScale];
    const radius = RADIUS_MAP[eventRules.cornerRadius];

    // Normalize data fields
    const displayTitle = data.eventTitle || data.title || getDefaultTitle(data.eventType);
    const displayCouple = getDisplayCouple(data);
    const displayDate = data.dateStr || formatDate(data.date) || '-';
    const displayTime = data.timeStr || data.time || '-';
    const displayVenue = data.venueName || data.venue || data.location || '-';
    const displayAddress = data.venueAddress || data.address || '';
    const displayMessage = data.greeting || data.message || data.description || getDefaultMessage(data.eventType);
    const agenda = data.agenda || data.itinerary || [];
    const bankAccounts = data.bankAccounts || data.bank_accounts || [];

    const openWaze = () => {
        const query = encodeURIComponent(displayAddress || displayVenue);
        window.open(`https://waze.com/ul?q=${query}`, '_blank');
    };

    const openGoogleMaps = () => {
        const query = encodeURIComponent(displayAddress || displayVenue);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    return (
        <div className="relative min-h-screen pb-32 animate-fade-in" style={{ animationDelay: '0.3s' }}>

            {/* ========================================
          HERO SECTION
      ======================================== */}
            <section id="info" className={`min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-16 pb-8`}>
                <div className={`max-w-lg mx-auto ${spacing.content}`}>

                    {/* Event Type Badge */}
                    <div className="flex flex-col items-center gap-2 mb-4 animate-fade-in">
                        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent to-white/40" />
                        <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-medium text-white/60">
                            {getEventTypeLabel(data.eventType)}
                        </p>
                    </div>

                    {/* Parents Names (Wedding only) */}
                    {eventRules.showParents && (data.groomParents || data.brideParents) && (
                        <div className="space-y-2">
                            {data.groomParents && (
                                <p className="text-white/70 text-sm font-serif">{data.groomParents}</p>
                            )}
                            {data.groomParents && data.brideParents && (
                                <p className="text-white/40 text-xs">&</p>
                            )}
                            {data.brideParents && (
                                <p className="text-white/70 text-sm font-serif">{data.brideParents}</p>
                            )}
                        </div>
                    )}

                    {/* Main Couple/Subject Names */}
                    <h1
                        className={`${fontScale.hero} font-bold font-serif leading-tight`}
                        style={{ color: primaryColor }}
                    >
                        {displayCouple}
                    </h1>

                    {/* Date */}
                    <p className={`text-white/60 text-sm tracking-wider ${eventRules.uppercaseHeaders ? 'uppercase' : ''}`}>
                        {displayDate}
                    </p>

                    {/* Decorative Divider */}
                    <div
                        className="w-24 h-px mx-auto"
                        style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }}
                    />
                </div>
            </section>

            {/* ========================================
          DETAILS SECTION
      ======================================== */}
            <section id="details" className={`px-4 mb-8`}>
                <div
                    className={`max-w-md mx-auto ${radius} ${spacing.card} backdrop-blur-xl relative overflow-hidden`}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Greeting Message */}
                    {displayMessage && (
                        <p className="text-white/70 text-center text-sm leading-relaxed mb-6 font-serif italic">
                            {displayMessage}
                        </p>
                    )}

                    {/* Full Names (for wedding) */}
                    {data.eventType === 'wedding' && (
                        <div className="text-center mb-6 pb-6 border-b border-white/10">
                            <p className="text-white font-serif text-lg font-bold">
                                {data.groomFullName || data.groom_full_name || ''}
                            </p>
                            <p className="text-white/40 my-2">&</p>
                            <p className="text-white font-serif text-lg font-bold">
                                {data.brideFullName || data.bride_full_name || ''}
                            </p>
                        </div>
                    )}

                    <div className={spacing.content}>
                        {/* Date */}
                        <InfoRow icon={<CalendarDays size={20} />} label="Tarikh" value={displayDate} primaryColor={primaryColor} />

                        {/* Time */}
                        <InfoRow icon={<Clock size={20} />} label="Masa" value={displayTime} primaryColor={primaryColor} />

                        {/* Location */}
                        <div id="location" className="pt-4 border-t border-white/10">
                            <InfoRow icon={<MapPin size={20} />} label="Lokasi" value={displayVenue} subValue={displayAddress} primaryColor={primaryColor} />

                            {/* Navigation Buttons */}
                            <div className="flex gap-2 mt-4 ml-12">
                                <button
                                    onClick={openWaze}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 ${radius} text-xs font-bold transition-all hover:scale-[1.02] active:scale-95`}
                                    style={{ background: 'rgba(51, 204, 255, 0.15)', border: '1px solid rgba(51, 204, 255, 0.3)', color: '#33ccff' }}
                                >
                                    <Navigation size={14} /> Waze
                                </button>
                                <button
                                    onClick={openGoogleMaps}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 ${radius} text-xs font-bold transition-all hover:scale-[1.02] active:scale-95`}
                                    style={{ background: 'rgba(52, 168, 83, 0.15)', border: '1px solid rgba(52, 168, 83, 0.3)', color: '#34a853' }}
                                >
                                    <MapPin size={14} /> Google Maps
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
          ITINERARY SECTION
      ======================================== */}
            <ItinerarySection agenda={agenda} primaryColor={primaryColor} eventType={data.eventType} />

            {/* ========================================
          GIFT SECTION
      ======================================== */}
            <GiftSection bankAccounts={bankAccounts} primaryColor={primaryColor} eventType={data.eventType} />

            {/* ========================================
          WISHES SECTION
      ======================================== */}
            <WishesSection wishes={wishes} primaryColor={primaryColor} eventSlug={eventSlug} onWishSubmitted={onWishSubmitted} />

            {/* ========================================
          RSVP SECTION
      ======================================== */}
            <section id="rsvp" className={`px-4 ${spacing.section}`}>
                <div className="max-w-sm mx-auto">
                    <h3 className={`${fontScale.section} font-serif font-bold text-center mb-6 tracking-wide ${eventRules.uppercaseHeaders ? 'uppercase' : ''}`} style={{ color: primaryColor }}>
                        Kehadiran
                    </h3>
                    <div className="flex gap-3">
                        <button
                            className={`flex-1 py-3.5 ${radius} font-bold text-sm transition-all hover:scale-[1.02] active:scale-95`}
                            style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 0 30px ${primaryColor}50` }}
                        >
                            Sahkan Kehadiran
                        </button>
                    </div>
                    <p className="text-xs text-white/40 mt-4 text-center">
                        Mohon sahkan kehadiran anda sebelum tarikh majlis.
                    </p>
                </div>
            </section>

            {/* ========================================
          FOOTER
      ======================================== */}
            <section id="contact" className="py-8 text-center">
                <p className="text-xs text-white/30 mb-1">Dicipta dengan eksklusif oleh</p>
                <p className="text-xs font-bold tracking-widest uppercase text-white/50">A2Z CREATIVE</p>
            </section>
        </div>
    );
}

// ========================================
// HELPER COMPONENTS & FUNCTIONS
// ========================================

function InfoRow({ icon, label, value, subValue, primaryColor }: { icon: React.ReactNode; label: string; value: string; subValue?: string; primaryColor: string; }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-1" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                {icon}
            </div>
            <div className="flex-1 pt-0.5">
                <h4 className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-medium mb-1.5 leading-none">{label}</h4>
                <p className="text-white font-medium text-sm md:text-base leading-snug">{value}</p>
                {subValue && <p className="text-white/50 text-xs md:text-sm mt-1 leading-relaxed">{subValue}</p>}
            </div>
        </div>
    );
}

function getDisplayCouple(data: any): string {
    if (data.couple) return data.couple;
    const groom = data.groomName || data.groom_name;
    const bride = data.brideName || data.bride_name;
    const celebrant = data.celebrantName || data.celebrant_name || data.childName || data.child_name;
    const organizer = data.organizer || data.host || data.companyName || data.company_name;
    if (groom && bride) return `${groom} & ${bride}`;
    if (celebrant) return celebrant;
    if (organizer) return organizer;
    return data.eventTitle || 'Jemputan';
}

function getDefaultTitle(type: string) {
    switch (type?.toLowerCase()) {
        case 'wedding': return 'Walimatul Urus';
        case 'birthday': return 'Happy Birthday';
        case 'corporate': return 'Cordially Invited';
        case 'raya': return 'Selamat Hari Raya';
        default: return 'Jemputan';
    }
}

function getDefaultMessage(type: string) {
    switch (type?.toLowerCase()) {
        case 'wedding': return 'Dengan penuh kesyukuran, kami mempersilakan Dato\' | Datin | Tuan | Puan | Encik | Cik hadir ke Majlis Perkahwinan kami.';
        case 'birthday': return 'Anda dijemput hadir ke majlis sambutan hari lahir kami.';
        case 'corporate': return 'You are cordially invited to attend our event.';
        default: return '';
    }
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
}

function getEventTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
        case 'wedding': return 'Perutusan Raja Sehari';
        case 'birthday': return 'Jemputan Hari Lahir';
        case 'corporate': return 'Cordially Invited';
        case 'raya': return 'Jemputan Hari Raya';
        case 'community': return 'Jemputan Majlis';
        default: return 'Jemputan';
    }
}

'use client';

import React from 'react';
import { CalendarDays, Clock, MapPin, Navigation, Heart } from 'lucide-react';
import { LayoutProps, SPACING_MAP, FONT_SCALE_MAP, RADIUS_MAP } from './types';
import ItinerarySection from '../ItinerarySection';
import WishesSection from '../WishesSection';
import GiftSection from '../GiftSection';

/**
 * ClassicLayout - Traditional card-style invitation.
 * Elegant, centered design with decorative elements.
 * Best for: Family, Traditional events
 */
export default function ClassicLayout({
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

    const displayCouple = getDisplayCouple(data);
    const displayDate = data.dateStr || formatDate(data.date) || '-';
    const displayTime = data.timeStr || data.time || '-';
    const displayVenue = data.venueName || data.venue || data.location || '-';
    const displayAddress = data.venueAddress || data.address || '';
    const displayMessage = data.greeting || data.message || 'Dengan penuh kasih, kami menjemput anda ke majlis kami.';
    const agenda = data.agenda || data.itinerary || [];
    const bankAccounts = data.bankAccounts || data.bank_accounts || [];

    const openWaze = () => window.open(`https://waze.com/ul?q=${encodeURIComponent(displayAddress || displayVenue)}`, '_blank');
    const openGoogleMaps = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || displayVenue)}`, '_blank');

    return (
        <div className="relative min-h-screen pb-32 animate-fade-in" style={{ animationDelay: '0.3s' }}>

            {/* ========================================
          CLASSIC HERO CARD
      ======================================== */}
            <section id="info" className={`min-h-[70vh] flex items-center justify-center px-4 pt-12 pb-8`}>
                <div
                    className={`max-w-md w-full ${radius} ${spacing.card} text-center relative overflow-hidden`}
                    style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)`,
                        border: `2px solid ${primaryColor}30`,
                        boxShadow: `0 0 60px ${primaryColor}15, inset 0 1px 0 rgba(255,255,255,0.1)`
                    }}
                >
                    {/* Decorative Corner Icons */}
                    <div className="absolute top-4 left-4 opacity-30" style={{ color: primaryColor }}><Heart size={16} /></div>
                    <div className="absolute top-4 right-4 opacity-30" style={{ color: primaryColor }}><Heart size={16} /></div>
                    <div className="absolute bottom-4 left-4 opacity-30" style={{ color: primaryColor }}><Heart size={16} /></div>
                    <div className="absolute bottom-4 right-4 opacity-30" style={{ color: primaryColor }}><Heart size={16} /></div>

                    <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6">{getEventTypeLabel(data.eventType)}</p>

                    {/* Names */}
                    <h1 className={`${fontScale.hero} font-serif font-bold italic leading-tight`} style={{ color: primaryColor }}>
                        {displayCouple}
                    </h1>

                    {/* Decorative Divider */}
                    <div className="flex items-center justify-center gap-3 my-6">
                        <div className="w-12 h-px" style={{ background: `${primaryColor}40` }} />
                        <Heart size={14} style={{ color: primaryColor }} className="opacity-60" />
                        <div className="w-12 h-px" style={{ background: `${primaryColor}40` }} />
                    </div>

                    {/* Message */}
                    <p className="text-white/60 text-sm font-serif italic leading-relaxed max-w-xs mx-auto mb-6">
                        {displayMessage}
                    </p>

                    {/* Date & Time */}
                    <div className="space-y-2">
                        <p className="text-white font-medium">{displayDate}</p>
                        <p className="text-white/60 text-sm">{displayTime}</p>
                    </div>
                </div>
            </section>

            {/* ========================================
          LOCATION SECTION
      ======================================== */}
            <section id="location" className={`px-4 ${spacing.section}`}>
                <div className={`max-w-md mx-auto ${radius} ${spacing.card} text-center`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <MapPin size={28} className="mx-auto mb-3" style={{ color: primaryColor }} />
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Lokasi</p>
                    <p className="text-white font-medium">{displayVenue}</p>
                    {displayAddress && <p className="text-white/50 text-sm mt-1">{displayAddress}</p>}
                    <div className="flex gap-3 mt-5 justify-center">
                        <button onClick={openWaze} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold" style={{ background: 'rgba(51, 204, 255, 0.1)', color: '#33ccff' }}>
                            <Navigation size={14} /> Waze
                        </button>
                        <button onClick={openGoogleMaps} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold" style={{ background: 'rgba(52, 168, 83, 0.1)', color: '#34a853' }}>
                            <MapPin size={14} /> Maps
                        </button>
                    </div>
                </div>
            </section>

            {/* Other Sections */}
            <ItinerarySection agenda={agenda} primaryColor={primaryColor} eventType={data.eventType} />
            <GiftSection bankAccounts={bankAccounts} primaryColor={primaryColor} eventType={data.eventType} />
            <WishesSection wishes={wishes} primaryColor={primaryColor} eventSlug={eventSlug} onWishSubmitted={onWishSubmitted} />

            {/* RSVP */}
            <section id="rsvp" className={`px-4 ${spacing.section}`}>
                <div className="max-w-sm mx-auto text-center">
                    <button className={`w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]`} style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 0 30px ${primaryColor}40` }}>
                        Sahkan Kehadiran
                    </button>
                </div>
            </section>

            {/* Footer */}
            <section id="contact" className="py-8 text-center">
                <p className="text-xs text-white/30 mb-1">Dicipta dengan kasih oleh</p>
                <p className="text-xs font-bold tracking-widest uppercase text-white/50">A2Z CREATIVE</p>
            </section>
        </div>
    );
}

// Helpers
function getDisplayCouple(data: any): string {
    if (data.couple) return data.couple;
    const groom = data.groomName || data.groom_name;
    const bride = data.brideName || data.bride_name;
    if (groom && bride) return `${groom} & ${bride}`;
    return data.celebrantName || data.organizer || data.eventTitle || 'Jemputan';
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return dateStr; }
}

function getEventTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
        case 'wedding': return 'Walimatul Urus';
        case 'birthday': return 'Hari Jadi';
        case 'family': return 'Jemputan Keluarga';
        default: return 'Jemputan';
    }
}

'use client';

import React from 'react';
import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { LayoutProps, SPACING_MAP, FONT_SCALE_MAP, RADIUS_MAP } from './types';
import ItinerarySection from '../ItinerarySection';
import WishesSection from '../WishesSection';
import GiftSection from '../GiftSection';

/**
 * MinimalLayout - Clean, typography-focused design.
 * No large hero section, content is presented in a compact, elegant manner.
 * Best for: Corporate, Modern events
 */
export default function MinimalLayout({
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

    const displayTitle = data.eventTitle || data.title || 'Jemputan';
    const displayCouple = getDisplayCouple(data);
    const displayDate = data.dateStr || formatDate(data.date) || '-';
    const displayTime = data.timeStr || data.time || '-';
    const displayVenue = data.venueName || data.venue || data.location || '-';
    const displayAddress = data.venueAddress || data.address || '';
    const displayMessage = data.greeting || data.message || '';
    const agenda = data.agenda || data.itinerary || [];
    const bankAccounts = data.bankAccounts || data.bank_accounts || [];

    const openWaze = () => window.open(`https://waze.com/ul?q=${encodeURIComponent(displayAddress || displayVenue)}`, '_blank');
    const openGoogleMaps = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || displayVenue)}`, '_blank');

    return (
        <div className="relative min-h-screen pb-32 animate-fade-in" style={{ animationDelay: '0.2s' }}>

            {/* ========================================
          COMPACT HEADER
      ======================================== */}
            <section id="info" className={`pt-16 pb-8 px-6 text-center border-b border-white/10`}>
                <p className={`text-[10px] md:text-xs tracking-[0.25em] ${eventRules.uppercaseHeaders ? 'uppercase' : ''} font-semibold mb-4`} style={{ color: primaryColor }}>
                    {getEventTypeLabel(data.eventType)}
                </p>
                <h1 className={`${fontScale.hero} font-bold font-sans leading-tight text-white mb-2`}>
                    {displayCouple}
                </h1>
                <p className="text-white/50 text-sm">{displayDate}</p>
            </section>

            {/* ========================================
          DETAILS GRID
      ======================================== */}
            <section id="details" className={`px-4 ${spacing.section}`}>
                <div className={`max-w-lg mx-auto grid grid-cols-2 gap-4`}>
                    {/* Date Card */}
                    <div className={`${radius} ${spacing.card} text-center`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <CalendarDays size={24} className="mx-auto mb-2" style={{ color: primaryColor }} />
                        <p className="text-xs text-white/50 uppercase tracking-wider">Tarikh</p>
                        <p className="text-white font-medium text-sm mt-1">{displayDate}</p>
                    </div>
                    {/* Time Card */}
                    <div className={`${radius} ${spacing.card} text-center`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Clock size={24} className="mx-auto mb-2" style={{ color: primaryColor }} />
                        <p className="text-xs text-white/50 uppercase tracking-wider">Masa</p>
                        <p className="text-white font-medium text-sm mt-1">{displayTime}</p>
                    </div>
                </div>

                {/* Venue Card */}
                <div className={`max-w-lg mx-auto mt-4 ${radius} ${spacing.card}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start gap-3">
                        <MapPin size={20} style={{ color: primaryColor }} className="shrink-0 mt-1" />
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider">Lokasi</p>
                            <p className="text-white font-medium text-sm mt-1">{displayVenue}</p>
                            {displayAddress && <p className="text-white/50 text-xs mt-1">{displayAddress}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={openWaze} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: 'rgba(51, 204, 255, 0.1)', color: '#33ccff' }}>
                            <Navigation size={14} /> Waze
                        </button>
                        <button onClick={openGoogleMaps} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: 'rgba(52, 168, 83, 0.1)', color: '#34a853' }}>
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
                <div className="max-w-sm mx-auto">
                    <button className={`w-full py-3 ${radius} font-bold text-sm`} style={{ backgroundColor: primaryColor, color: '#000' }}>
                        Sahkan Kehadiran
                    </button>
                </div>
            </section>

            {/* Footer */}
            <section id="contact" className="py-8 text-center">
                <p className="text-xs text-white/30 mb-1">Dicipta oleh</p>
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
    return data.celebrantName || data.organizer || data.companyName || data.eventTitle || 'Jemputan';
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return dateStr; }
}

function getEventTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
        case 'wedding': return 'Walimatul Urus';
        case 'birthday': return 'Hari Jadi';
        case 'corporate': return 'Invitation';
        default: return 'Jemputan';
    }
}

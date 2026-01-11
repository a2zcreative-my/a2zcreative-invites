'use client';

import React from 'react';
import { DesignPreset } from '@/lib/presets';
import { applyPreset, getSampleInvitationData } from '@/lib/presetEngine';

interface MiniPreviewProps {
    preset: DesignPreset;
    eventType?: string;
    className?: string;
}

/**
 * MiniPreview - Live-rendered mini invitation showing the full structure
 * Scaled down to fit in preset card (scale 0.28)
 */
export default function MiniPreview({ preset, eventType = 'wedding', className = '' }: MiniPreviewProps) {
    const applied = applyPreset(preset);
    const sampleData = getSampleInvitationData(eventType);

    return (
        <div className={`relative overflow-hidden rounded-xl ${className}`}>
            {/* Phone Frame */}
            <div
                className={`w-full aspect-[9/16] rounded-xl overflow-hidden ${applied.themeClass}`}
                style={{
                    backgroundColor: 'var(--background, #0f172a)',
                    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1)',
                }}
            >
                {/* Scaled Content Container */}
                <div
                    className="origin-top-left w-[375px] h-[812px] overflow-hidden"
                    style={{
                        transform: 'scale(0.28)',
                        transformOrigin: 'top left',
                        fontFamily: applied.fontFamily,
                    }}
                >
                    {/* Background with theme */}
                    <div
                        className="w-full h-full relative"
                        style={{
                            background: `var(--background, ${applied.colors.secondary})`,
                        }}
                    >
                        {/* Decorative Frame Elements */}
                        {preset.cover === 'frame' && (
                            <>
                                <div
                                    className="absolute top-4 left-4 right-4 bottom-4 border-2 rounded-lg opacity-20 pointer-events-none"
                                    style={{ borderColor: 'var(--primary)' }}
                                />
                                <div
                                    className="absolute top-6 left-6 right-6 bottom-6 border opacity-10 rounded pointer-events-none"
                                    style={{ borderColor: 'var(--primary)' }}
                                />
                            </>
                        )}

                        {preset.cover === 'islamic' && (
                            <div
                                className="absolute top-0 left-0 right-0 h-32 opacity-30"
                                style={{
                                    background: `linear-gradient(180deg, var(--primary), transparent)`,
                                    clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)'
                                }}
                            />
                        )}

                        {preset.cover === 'floral' && (
                            <>
                                <div
                                    className="absolute top-4 left-4 w-20 h-20 rounded-full opacity-30"
                                    style={{ background: `radial-gradient(circle, var(--accent), transparent 70%)` }}
                                />
                                <div
                                    className="absolute bottom-32 right-4 w-24 h-24 rounded-full opacity-30"
                                    style={{ background: `radial-gradient(circle, var(--accent), transparent 70%)` }}
                                />
                            </>
                        )}

                        {/* ======== HERO SECTION ======== */}
                        <div className="pt-16 px-6 text-center">
                            {/* Event Type Label */}
                            <p
                                className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-4"
                                style={{ color: 'var(--primary)' }}
                            >
                                {sampleData.eventType}
                            </p>

                            {/* Main Title / Names */}
                            <h1
                                className="text-2xl font-bold font-serif mb-2"
                                style={{ color: 'var(--primary)' }}
                            >
                                {sampleData.eventTitle}
                            </h1>

                            {/* Subject */}
                            <p
                                className="text-lg font-serif"
                                style={{ color: 'var(--text, white)' }}
                            >
                                {sampleData.couple}
                            </p>

                            {/* Date */}
                            <p
                                className="text-xs mt-4 opacity-60"
                                style={{ color: 'var(--text, white)' }}
                            >
                                {sampleData.dateStr}
                            </p>

                            {/* Divider */}
                            <div
                                className="w-16 h-px mx-auto mt-6"
                                style={{ background: `linear-gradient(90deg, transparent, var(--primary), transparent)` }}
                            />
                        </div>

                        {/* ======== DETAILS CARD ======== */}
                        <div className="px-4 mt-8">
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]"
                                            style={{ background: 'var(--primary)', opacity: 0.2 }}
                                        >📅</div>
                                        <div>
                                            <p className="text-[9px] opacity-50" style={{ color: 'var(--text)' }}>Tarikh</p>
                                            <p className="text-[11px]" style={{ color: 'var(--text)' }}>{sampleData.dateStr}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]"
                                            style={{ background: 'var(--primary)', opacity: 0.2 }}
                                        >🕐</div>
                                        <div>
                                            <p className="text-[9px] opacity-50" style={{ color: 'var(--text)' }}>Masa</p>
                                            <p className="text-[11px]" style={{ color: 'var(--text)' }}>{sampleData.timeStr}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]"
                                            style={{ background: 'var(--primary)', opacity: 0.2 }}
                                        >📍</div>
                                        <div>
                                            <p className="text-[9px] opacity-50" style={{ color: 'var(--text)' }}>Lokasi</p>
                                            <p className="text-[11px]" style={{ color: 'var(--text)' }}>{sampleData.venueName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ======== ITINERARY MINI ======== */}
                        <div className="px-4 mt-6 text-center">
                            <p
                                className="text-[10px] font-semibold tracking-wide uppercase mb-2"
                                style={{ color: 'var(--primary)' }}
                            >
                                Atur Cara
                            </p>
                            <div
                                className="rounded-lg p-3"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <p className="text-[9px] opacity-60" style={{ color: 'var(--text)' }}>
                                    Ketibaan Tetamu • Majlis Dimulakan
                                </p>
                            </div>
                        </div>

                        {/* ======== RSVP BUTTON ======== */}
                        <div className="px-4 mt-6 text-center">
                            <button
                                className="w-full py-2.5 rounded-full text-[11px] font-bold"
                                style={{
                                    background: 'var(--primary)',
                                    color: 'var(--background, #000)'
                                }}
                            >
                                Sahkan Kehadiran
                            </button>
                        </div>

                        {/* ======== BOTTOM DOCK ======== */}
                        <div
                            className="absolute bottom-0 left-0 right-0 py-2 px-1"
                            style={{ background: 'var(--primary)' }}
                        >
                            <div className="flex justify-around">
                                {['📞', '▶️', '📍', '🎁', '✉️'].map((icon, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <span className="text-[12px]">{icon}</span>
                                        <span className="text-[7px] mt-0.5 opacity-70">
                                            {['Call', 'Lagu', 'Loc', 'Gift', 'RSVP'][i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

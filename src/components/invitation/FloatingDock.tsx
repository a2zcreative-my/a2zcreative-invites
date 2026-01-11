'use client';

import React, { useState } from 'react';
import { Phone, Play, Pause, MapPin, Gift, Mail } from 'lucide-react';

interface FloatingDockProps {
    primaryColor: string;
    onMusicToggle?: () => void;
    isMusicPlaying?: boolean;
    whatsappNumber?: string;
    showGift?: boolean;
}

/**
 * FloatingDock - Bottom navigation bar for invitation
 * Icons: Hubungi, Lagu, Lokasi, Hadiah, RSVP
 */
export default function FloatingDock({
    primaryColor,
    onMusicToggle,
    isMusicPlaying = false,
    whatsappNumber,
    showGift = true
}: FloatingDockProps) {

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const openWhatsApp = () => {
        if (whatsappNumber) {
            const cleanNumber = whatsappNumber.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanNumber}`, '_blank');
        }
    };

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-safe">
            <div className="flex justify-center px-4 pb-4">
                <div
                    className="flex items-center gap-0 pointer-events-auto rounded-2xl overflow-hidden"
                    style={{
                        background: `linear-gradient(180deg, ${primaryColor}dd, ${primaryColor}cc)`,
                        boxShadow: `0 -4px 30px ${primaryColor}40, 0 4px 20px rgba(0,0,0,0.3)`
                    }}
                >
                    {/* Hubungi */}
                    <DockButton
                        icon={<Phone size={20} />}
                        label="Hubungi"
                        onClick={openWhatsApp}
                        disabled={!whatsappNumber}
                    />

                    {/* Lagu */}
                    <DockButton
                        icon={isMusicPlaying ? <Pause size={20} /> : <Play size={20} />}
                        label="Lagu"
                        onClick={onMusicToggle}
                        active={isMusicPlaying}
                    />

                    {/* Lokasi */}
                    <DockButton
                        icon={<MapPin size={20} />}
                        label="Lokasi"
                        onClick={() => scrollToSection('location')}
                    />

                    {/* Hadiah */}
                    {showGift && (
                        <DockButton
                            icon={<Gift size={20} />}
                            label="Hadiah"
                            onClick={() => scrollToSection('gift')}
                        />
                    )}

                    {/* RSVP */}
                    <DockButton
                        icon={<Mail size={20} />}
                        label="RSVP"
                        onClick={() => scrollToSection('rsvp')}
                    />
                </div>
            </div>
        </div>
    );
}

interface DockButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
}

function DockButton({ icon, label, onClick, active, disabled }: DockButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex flex-col items-center justify-center gap-1 
                px-4 py-3 min-w-[60px]
                transition-all duration-200 
                hover:bg-black/10 active:scale-95
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${active ? 'bg-black/20' : ''}
            `}
        >
            <div className="text-black/80">
                {icon}
            </div>
            <span className="text-[10px] font-semibold text-black/70 tracking-wide">
                {label}
            </span>
        </button>
    );
}

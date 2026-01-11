import React from 'react';
import { MailOpen, Music2 } from 'lucide-react';
import { DesignTemplate } from '@/lib/themes';

interface OpeningCardProps {
    template: DesignTemplate;
    title: string;
    coupleName: string;
    musicName?: string;
    onOpen: () => void;
    isVisible: boolean;
}

export default function OpeningCard({ template, title, coupleName, musicName, onOpen, isVisible }: OpeningCardProps) {
    if (!isVisible) return null;

    const { design } = template;
    const primaryColor = design.accentColor || '#d4af37';
    const textColor = design.textColor || '#fff';
    const bgColor = design.bgColor || '#020617';
    // Use a simpler, deeper gradient for the opening
    const bgGradient = `radial-gradient(circle at center, ${primaryColor}05 0%, ${bgColor} 100%)`;

    return (
        <div
            className="absolute inset-0 z-[60] flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ease-in-out"
            style={{
                background: bgColor,
                backgroundImage: bgGradient,
                color: textColor
            }}
        >
            <div className="relative z-10 max-w-lg w-full flex flex-col items-center animate-fade-in-up space-y-8">

                {/* Header Label - Minimalist Line */}
                <div className="flex flex-col items-center gap-3">
                    <p
                        className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-medium opacity-60"
                        style={{ color: primaryColor }}
                    >
                        Jemputan Ke Majlis
                    </p>
                </div>

                {/* Main Title & Couple - Typography Focus */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold font-serif leading-tight text-white drop-shadow-2xl">
                        {title}
                    </h1>
                    <div className="h-px w-20 bg-white/20 mx-auto" />
                    <h2
                        className="text-2xl md:text-4xl font-serif italic"
                        style={{ color: primaryColor }}
                    >
                        {coupleName}
                    </h2>
                </div>

                {/* Open Button - Elegant Pill */}
                <div className="pt-8">
                    <button
                        onClick={onOpen}
                        className="group relative flex items-center justify-center gap-4 px-10 py-4 rounded-full transition-all duration-500 hover:scale-105 active:scale-95"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${primaryColor}40`,
                            backdropFilter: 'blur(10px)',
                            boxShadow: `0 0 40px ${primaryColor}10`
                        }}
                    >
                        <span className="font-medium tracking-widest text-sm uppercase text-white group-hover:text-white transition-colors">
                            Buka Jemputan
                        </span>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1"
                            style={{ background: `${primaryColor}20`, color: primaryColor }}
                        >
                            <MailOpen size={14} />
                        </div>
                    </button>

                    {/* Music Indicator */}
                    {musicName && (
                        <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 mt-6 uppercase tracking-wider">
                            <Music2 size={10} className="animate-pulse" />
                            <span>{musicName}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

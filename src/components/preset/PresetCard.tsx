'use client';

import React from 'react';
import { Check, Star, Lock, Sparkles } from 'lucide-react';
import { DesignPreset } from '@/lib/presets';
import MiniPreview from '@/components/ui/MiniPreview';

interface PresetCardProps {
    preset: DesignPreset;
    eventType: string;  // Event type from URL (wedding, birthday, etc.)
    isSelected: boolean;
    isLocked?: boolean;
    onSelect: () => void;
}

/**
 * PresetCard - Marketplace preset card with live MiniPreview
 */
export default function PresetCard({ preset, eventType, isSelected, isLocked, onSelect }: PresetCardProps) {
    return (
        <div
            className={`group flex flex-col gap-2 cursor-pointer transition-transform duration-300 ${isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
                }`}
            onClick={isLocked ? undefined : onSelect}
        >
            {/* Preview Container */}
            <div
                className={`relative rounded-xl overflow-hidden shadow-md transition-all duration-300 ${isSelected
                    ? 'ring-4 ring-violet-500 shadow-violet-500/30'
                    : 'ring-1 ring-white/10 hover:shadow-xl'
                    }`}
            >
                {/* MiniPreview */}
                <MiniPreview preset={preset} eventType={eventType} />

                {/* Selected Check Badge */}
                {isSelected && !isLocked && (
                    <div className="absolute top-2 left-2 z-20">
                        <div className="bg-violet-500 text-white p-1.5 rounded-full shadow-lg">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    </div>
                )}

                {/* Premium Badge */}
                {preset.isPremium && (
                    <div className="absolute top-2 right-2 z-20">
                        <div className="bg-amber-400 text-amber-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Star size={8} fill="currentColor" />
                            <span>PRO</span>
                        </div>
                    </div>
                )}

                {/* Locked Overlay */}
                {isLocked && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                        <div className="bg-slate-800/90 p-2 rounded-full">
                            <Lock size={20} className="text-slate-400" />
                        </div>
                    </div>
                )}

                {/* Try Now Button - Appears on Hover */}
                {!isLocked && !isSelected && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <button
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                        >
                            <Sparkles size={12} />
                            Try Now
                        </button>
                    </div>
                )}
            </div>

            {/* Card Footer */}
            <div className="px-1">
                {/* Preset Name */}
                <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-violet-400' : 'text-white'
                    }`}>
                    {preset.name}
                </h3>

                {/* Color Dots */}
                <div className="flex items-center gap-1 mt-1">
                    {preset.colors.slice(0, 3).map((color, i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                    <span className="text-[10px] text-slate-500 ml-1 capitalize">{preset.font}</span>
                </div>

                {/* Category Tags */}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                    {preset.categories.slice(0, 2).map(cat => (
                        <span
                            key={cat}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400"
                        >
                            {cat}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

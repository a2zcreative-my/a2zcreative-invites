'use client';

import React from 'react';
import { COLOR_PALETTES } from '@/lib/presets';
import { Check } from 'lucide-react';

interface ColorFilterProps {
    selected: string | null;
    onChange: (colorId: string | null) => void;
}

/**
 * ColorFilter - Color dot selector for palette filtering
 */
export default function ColorFilter({ selected, onChange }: ColorFilterProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Color:</span>

            {/* All Colors Button */}
            <button
                onClick={() => onChange(null)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selected === null
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                style={{
                    background: 'conic-gradient(#D4AF37, #E11D48, #7C3AED, #3B82F6, #14B8A6, #22C55E, #D4AF37)'
                }}
                title="All colors"
            />

            {/* Color Palette Dots */}
            {COLOR_PALETTES.map(palette => (
                <button
                    key={palette.id}
                    onClick={() => onChange(selected === palette.id ? null : palette.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selected === palette.id
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                            : 'opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                    style={{ backgroundColor: palette.color }}
                    title={palette.name}
                >
                    {selected === palette.id && (
                        <Check size={12} className="text-white drop-shadow" strokeWidth={3} />
                    )}
                </button>
            ))}
        </div>
    );
}

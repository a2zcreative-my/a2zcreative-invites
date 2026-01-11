'use client';

import React from 'react';
import { PRESET_CATEGORIES } from '@/lib/presets';

interface CategoryFilterProps {
    selected: string;
    onChange: (category: string) => void;
}

/**
 * CategoryFilter - Horizontal scrollable category pills
 */
export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {PRESET_CATEGORIES.map(category => (
                <button
                    key={category}
                    onClick={() => onChange(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selected === category
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}

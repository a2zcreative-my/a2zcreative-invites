'use client';

import React from 'react';
import { DesignPreset } from '@/lib/presets';
import PresetCard from './PresetCard';

interface PresetGridProps {
    presets: DesignPreset[];
    eventType: string;  // Event type from URL (wedding, birthday, etc.)
    selectedPresetId: string | null;
    lockedPresetIds?: string[];
    onSelectPreset: (preset: DesignPreset) => void;
}

/**
 * PresetGrid - Responsive grid of preset cards
 * Mobile: Horizontal scroll
 * Tablet: 2-3 columns
 * Desktop: 4-5 columns
 */
export default function PresetGrid({
    presets,
    eventType,
    selectedPresetId,
    lockedPresetIds = [],
    onSelectPreset
}: PresetGridProps) {
    if (presets.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-slate-400">No presets found matching your filters.</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your category or color selection.</p>
            </div>
        );
    }

    return (
        <div className="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 scrollbar-hide theme-picker-scroll snap-x snap-mandatory sm:snap-none sm:overflow-visible">
            {presets.map(preset => (
                <div
                    key={preset.id}
                    className="flex-shrink-0 w-[160px] sm:w-auto snap-start"
                >
                    <PresetCard
                        preset={preset}
                        eventType={eventType}
                        isSelected={selectedPresetId === preset.id}
                        isLocked={lockedPresetIds.includes(preset.id)}
                        onSelect={() => onSelectPreset(preset)}
                    />
                </div>
            ))}
        </div>
    );
}

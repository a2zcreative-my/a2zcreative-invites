'use client';

import React from 'react';
import { LayoutType } from '@/lib/types/design';
import { getEventDesignRules } from '@/lib/design/eventRules';
import { getPresetById, DESIGN_PRESETS } from '@/lib/design/presets';
import { HeroLayout, MinimalLayout, ClassicLayout, LayoutProps } from './layouts';

interface InvitationContentProps {
    data: any;
    template?: any; // Legacy support
    presetId?: string; // New: Preset ID
    primaryColor?: string; // Can be overridden
    eventSlug: string;
    wishes?: any[];
    onWishSubmitted?: () => void;
}

/**
 * InvitationContent - The Layout Router
 * 
 * This component acts as a controller that:
 * 1. Resolves the event type and applies event-specific design rules
 * 2. Loads the selected Design Preset
 * 3. Routes to the correct Layout component based on the preset's layout type
 */
export default function InvitationContent({
    data,
    template,
    presetId,
    primaryColor: overridePrimaryColor,
    eventSlug,
    wishes = [],
    onWishSubmitted
}: InvitationContentProps) {

    // ========================================
    // RESOLVE CONFIGURATION
    // ========================================

    // Normalize event type
    const rawEventType = data.eventType || data.event_type || data.type || 'wedding';
    const eventType = normalizeEventType(rawEventType);

    // Get event design rules
    const eventRules = getEventDesignRules(eventType);

    // Resolve preset (use provided presetId, or fall back to template-based mapping, or default)
    const preset = resolvePreset(presetId, template, eventType);

    // Determine primary color (override > preset > fallback)
    const primaryColor = overridePrimaryColor || preset.colors.primary || '#d4af37';

    // Prepare normalized data for layouts
    const normalizedData = {
        ...data,
        eventType
    };

    // Common props for all layouts
    const layoutProps: LayoutProps = {
        data: normalizedData,
        preset,
        eventRules,
        primaryColor,
        eventSlug,
        wishes,
        onWishSubmitted
    };

    // ========================================
    // LAYOUT ROUTING
    // ========================================
    const LayoutComponent = getLayoutComponent(preset.layout);

    return <LayoutComponent {...layoutProps} />;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function normalizeEventType(rawType: string): string {
    const type = (rawType || '').toLowerCase().trim();

    const directMatches = ['wedding', 'birthday', 'corporate', 'raya', 'community', 'family', 'business'];
    if (directMatches.includes(type)) return type;

    const malayToEnglish: Record<string, string> = {
        'perkahwinan': 'wedding',
        'kahwin': 'wedding',
        'hari jadi': 'birthday',
        'harijadi': 'birthday',
        'ulangtahun': 'birthday',
        'korporat': 'corporate',
        'keluarga': 'family',
        'komuniti': 'community',
        'hari raya': 'raya',
        'aidilfitri': 'raya'
    };

    return malayToEnglish[type] || 'wedding';
}

function resolvePreset(presetId: string | undefined, legacyTemplate: any, eventType: string) {
    // Priority 1: Direct preset ID
    if (presetId) {
        return getPresetById(presetId);
    }

    // Priority 2: Map legacy template to a preset (basic heuristic)
    if (legacyTemplate?.id) {
        const found = DESIGN_PRESETS.find(p => p.id.toLowerCase() === legacyTemplate.id.toLowerCase());
        if (found) return found;
    }

    // Priority 3: Default preset based on event type
    const eventDefaults: Record<string, string> = {
        wedding: 'ROYAL_ELEGANT',
        birthday: 'TROPICAL_VIBE',
        corporate: 'MODERN_MINIMAL',
        family: 'CLASSIC_FLORAL',
        community: 'MODERN_MINIMAL',
        raya: 'DARK_LUXURY'
    };

    const defaultPresetId = eventDefaults[eventType] || 'ROYAL_ELEGANT';
    return getPresetById(defaultPresetId);
}

function getLayoutComponent(layout: LayoutType): React.ComponentType<LayoutProps> {
    switch (layout) {
        case 'minimal':
            return MinimalLayout;
        case 'classic':
            return ClassicLayout;
        case 'hero':
        default:
            return HeroLayout;
    }
}

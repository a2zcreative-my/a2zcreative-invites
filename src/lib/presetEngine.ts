// =============================================
// PRESET ENGINE
// Applies preset configuration to invitation rendering
// =============================================

import { DesignPreset, ThemeId, LayoutId, CoverId, FontId, MotionId } from './presets';

// Theme CSS class mapping
export const THEME_CLASSES: Record<ThemeId, string> = {
    royal: 'theme-royal',
    modern: 'theme-modern',
    tropical: 'theme-tropical',
    dark: 'theme-dark',
    elegant: 'theme-elegant',
    rustic: 'theme-rustic',
    blush: 'theme-blush',
    ocean: 'theme-ocean',
    sunset: 'theme-sunset',
    garden: 'theme-garden',
};

// Font family mapping
export const FONT_FAMILIES: Record<FontId, string> = {
    playfair: 'var(--font-playfair)',
    inter: 'var(--font-inter)',
    dancing: 'var(--font-dancing)',
    roboto: 'var(--font-roboto)',
    poppins: 'var(--font-poppins)',
    cormorant: 'var(--font-cormorant)',
};

// Cover style configurations
export const COVER_CONFIGS: Record<CoverId, CoverConfig> = {
    photo: { type: 'image', overlay: true, overlayOpacity: 0.4 },
    frame: { type: 'border', borderStyle: 'ornate', cornerAccents: true },
    floral: { type: 'pattern', asset: 'floral-corners', position: 'corners' },
    islamic: { type: 'pattern', asset: 'islamic-arch', position: 'top' },
    gradient: { type: 'gradient', direction: '135deg' },
    geometric: { type: 'pattern', asset: 'geometric-shapes', position: 'scattered' },
    minimal: { type: 'none' },
};

export interface CoverConfig {
    type: 'image' | 'border' | 'pattern' | 'gradient' | 'none';
    overlay?: boolean;
    overlayOpacity?: number;
    borderStyle?: 'ornate' | 'simple' | 'double';
    cornerAccents?: boolean;
    asset?: string;
    position?: 'corners' | 'top' | 'scattered' | 'full';
    direction?: string;
}

// Motion/Animation configurations
export const MOTION_CONFIGS: Record<MotionId, MotionConfig> = {
    soft: {
        fadeIn: true,
        duration: 600,
        easing: 'ease-out',
        stagger: 150,
        scrollReveal: true,
    },
    modern: {
        fadeIn: true,
        slideUp: true,
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        stagger: 100,
        scrollReveal: true,
    },
    luxury: {
        fadeIn: true,
        scale: true,
        duration: 800,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        stagger: 200,
        scrollReveal: true,
    },
    calm: {
        fadeIn: true,
        duration: 1000,
        easing: 'ease-in-out',
        stagger: 300,
        scrollReveal: false,
    },
    playful: {
        fadeIn: true,
        bounce: true,
        duration: 500,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        stagger: 80,
        scrollReveal: true,
    },
};

export interface MotionConfig {
    fadeIn: boolean;
    slideUp?: boolean;
    scale?: boolean;
    bounce?: boolean;
    duration: number;
    easing: string;
    stagger: number;
    scrollReveal: boolean;
}

// Applied preset result
export interface AppliedPreset {
    themeClass: string;
    fontFamily: string;
    coverConfig: CoverConfig;
    motionConfig: MotionConfig;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    musicId: string;
    layoutId: LayoutId;
}

/**
 * Apply a preset and return computed values for rendering
 */
export function applyPreset(preset: DesignPreset): AppliedPreset {
    return {
        themeClass: THEME_CLASSES[preset.theme],
        fontFamily: FONT_FAMILIES[preset.font],
        coverConfig: COVER_CONFIGS[preset.cover],
        motionConfig: MOTION_CONFIGS[preset.motion],
        colors: {
            primary: preset.colors[0] || '#D4AF37',
            secondary: preset.colors[1] || '#0F172A',
            accent: preset.colors[2] || '#FCD34D',
        },
        musicId: preset.music,
        layoutId: preset.layout,
    };
}

/**
 * Get CSS custom properties for a preset
 */
export function getPresetCSSVariables(preset: DesignPreset): Record<string, string> {
    return {
        '--preset-primary': preset.colors[0] || '#D4AF37',
        '--preset-secondary': preset.colors[1] || '#0F172A',
        '--preset-accent': preset.colors[2] || '#FCD34D',
    };
}

/**
 * Generate inline style object from preset
 */
export function getPresetStyles(applied: AppliedPreset): React.CSSProperties {
    return {
        '--primary': applied.colors.primary,
        '--background': applied.colors.secondary,
        '--accent': applied.colors.accent,
        fontFamily: applied.fontFamily,
    } as React.CSSProperties;
}

// Sample invitation data for MiniPreview - keyed by EVENT TYPE
export function getSampleInvitationData(eventType: string) {
    const samples: Record<string, any> = {
        wedding: {
            eventTitle: 'Walimatul Urus',
            couple: 'Ahmad & Siti',
            dateStr: '25 Mac 2026',
            timeStr: '11:00 Pagi',
            venueName: 'Dewan Seri Melati',
            venueAddress: 'Jalan Bunga Raya, Shah Alam',
            eventType: 'Perkahwinan',
        },
        birthday: {
            eventTitle: 'Happy Birthday!',
            couple: 'Baby Ariana',
            dateStr: '15 April 2026',
            timeStr: '2:00 Petang',
            venueName: 'Rumah Keluarga',
            venueAddress: 'Taman Bahagia, Petaling Jaya',
            eventType: 'Birthday',
        },
        corporate: {
            eventTitle: 'Annual Gala Dinner',
            couple: 'ABC Corporation',
            dateStr: 'December 15, 2026',
            timeStr: '7:00 PM',
            venueName: 'Hilton Kuala Lumpur',
            venueAddress: 'Sentral Station',
            eventType: 'Corporate',
        },
        raya: {
            eventTitle: 'Rumah Terbuka Aidilfitri',
            couple: 'Keluarga Encik Ahmad',
            dateStr: '1 Syawal 1447H',
            timeStr: '10:00 Pagi - 5:00 Petang',
            venueName: 'Kediaman Kami',
            venueAddress: 'No. 10, Jalan Hari Raya',
            eventType: 'Raya',
        },
        community: {
            eventTitle: 'Majlis Kesyukuran',
            couple: 'Komuniti Taman Damai',
            dateStr: '20 Jun 2026',
            timeStr: '3:00 Petang',
            venueName: 'Dewan Komuniti',
            venueAddress: 'Jalan Utama',
            eventType: 'Community',
        },
    };

    // Default to wedding if eventType not found
    return samples[eventType?.toLowerCase()] || samples.wedding;
}

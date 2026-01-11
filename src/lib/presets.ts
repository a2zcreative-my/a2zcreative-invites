// =============================================
// DESIGN PRESET SYSTEM
// A2Z Creative - Invitation Design Marketplace
// =============================================

// Type definitions for the preset system
export type ThemeId = 'royal' | 'modern' | 'tropical' | 'dark' | 'elegant' | 'rustic' | 'blush' | 'ocean' | 'sunset' | 'garden';
export type LayoutId = 'hero' | 'minimal' | 'classic' | 'split' | 'timeline';
export type CoverId = 'photo' | 'frame' | 'floral' | 'islamic' | 'gradient' | 'geometric' | 'minimal';
export type FontId = 'playfair' | 'inter' | 'dancing' | 'roboto' | 'poppins' | 'cormorant';
export type MotionId = 'soft' | 'modern' | 'luxury' | 'calm' | 'playful';

// Event types that presets can be used for
export type EventTypeId = 'wedding' | 'birthday' | 'corporate' | 'community' | 'raya' | 'all';

// Design Preset Interface
export interface DesignPreset {
    id: string;
    name: string;
    eventTypes: EventTypeId[];  // Events this preset is suitable for
    categories: string[];
    colors: string[];          // [primary, secondary, accent]
    theme: ThemeId;
    layout: LayoutId;
    cover: CoverId;
    font: FontId;
    motion: MotionId;
    music: string;
    isPremium: boolean;
}

// Available categories for filtering
export const PRESET_CATEGORIES = [
    'All',
    'Traditional',
    'Modern',
    'Floral',
    'Islamic',
    'Vintage',
    'Luxury',
    'Baby',
    'Raya',
    'Corporate',
] as const;

// Available color palettes for filtering
export const COLOR_PALETTES = [
    { id: 'gold', color: '#D4AF37', name: 'Gold' },
    { id: 'rose', color: '#E11D48', name: 'Rose' },
    { id: 'purple', color: '#7C3AED', name: 'Purple' },
    { id: 'blue', color: '#3B82F6', name: 'Blue' },
    { id: 'teal', color: '#14B8A6', name: 'Teal' },
    { id: 'slate', color: '#64748B', name: 'Slate' },
    { id: 'green', color: '#22C55E', name: 'Green' },
    { id: 'orange', color: '#F97316', name: 'Orange' },
] as const;

// =============================================
// DESIGN PRESETS COLLECTION
// =============================================
export const DESIGN_PRESETS: DesignPreset[] = [
    // ===== WEDDING - TRADITIONAL =====
    {
        id: 'royal-gold',
        name: 'Royal Gold',
        eventTypes: ['wedding', 'corporate'],
        categories: ['Traditional', 'Luxury'],
        colors: ['#D4AF37', '#0F172A', '#FCD34D'],
        theme: 'dark',
        layout: 'hero',
        cover: 'frame',
        font: 'playfair',
        motion: 'luxury',
        music: 'romantic',
        isPremium: false,
    },
    {
        id: 'elegant-purple',
        name: 'Elegant Purple',
        eventTypes: ['wedding', 'corporate'],
        categories: ['Traditional', 'Luxury'],
        colors: ['#7C3AED', '#1E1B4B', '#C4B5FD'],
        theme: 'royal',
        layout: 'hero',
        cover: 'frame',
        font: 'playfair',
        motion: 'luxury',
        music: 'romantic',
        isPremium: true,
    },
    {
        id: 'classic-ivory',
        name: 'Classic Ivory',
        eventTypes: ['wedding'],
        categories: ['Traditional', 'Vintage'],
        colors: ['#92400E', '#FFFBEB', '#D97706'],
        theme: 'rustic',
        layout: 'classic',
        cover: 'floral',
        font: 'cormorant',
        motion: 'soft',
        music: 'acoustic',
        isPremium: false,
    },

    // ===== WEDDING - FLORAL =====
    {
        id: 'rose-garden',
        name: 'Rose Garden',
        eventTypes: ['wedding'],
        categories: ['Floral', 'Traditional'],
        colors: ['#E11D48', '#FFF1F2', '#FB7185'],
        theme: 'elegant',
        layout: 'hero',
        cover: 'floral',
        font: 'dancing',
        motion: 'soft',
        music: 'romantic',
        isPremium: false,
    },
    {
        id: 'blush-peony',
        name: 'Blush Peony',
        eventTypes: ['wedding', 'birthday'],
        categories: ['Floral', 'Modern'],
        colors: ['#F472B6', '#FDF2F8', '#FBCFE8'],
        theme: 'blush',
        layout: 'minimal',
        cover: 'floral',
        font: 'poppins',
        motion: 'modern',
        music: 'upbeat',
        isPremium: true,
    },
    {
        id: 'tropical-paradise',
        name: 'Tropical Paradise',
        eventTypes: ['wedding', 'birthday', 'community'],
        categories: ['Floral', 'Modern'],
        colors: ['#14B8A6', '#F0FDFA', '#5EEAD4'],
        theme: 'tropical',
        layout: 'hero',
        cover: 'floral',
        font: 'dancing',
        motion: 'playful',
        music: 'upbeat',
        isPremium: false,
    },

    // ===== ISLAMIC =====
    {
        id: 'masjid-gold',
        name: 'Masjid Gold',
        eventTypes: ['wedding', 'raya', 'community'],
        categories: ['Islamic', 'Traditional'],
        colors: ['#D4AF37', '#1A1A2E', '#F4D03F'],
        theme: 'dark',
        layout: 'hero',
        cover: 'islamic',
        font: 'playfair',
        motion: 'calm',
        music: 'acoustic',
        isPremium: false,
    },
    {
        id: 'minaret-teal',
        name: 'Minaret Teal',
        eventTypes: ['wedding', 'raya', 'community'],
        categories: ['Islamic', 'Modern'],
        colors: ['#0D9488', '#042F2E', '#5EEAD4'],
        theme: 'ocean',
        layout: 'classic',
        cover: 'islamic',
        font: 'inter',
        motion: 'calm',
        music: 'acoustic',
        isPremium: true,
    },
    {
        id: 'crescent-purple',
        name: 'Crescent Purple',
        eventTypes: ['wedding', 'raya'],
        categories: ['Islamic', 'Luxury'],
        colors: ['#A855F7', '#1E1B4B', '#E9D5FF'],
        theme: 'royal',
        layout: 'hero',
        cover: 'islamic',
        font: 'playfair',
        motion: 'luxury',
        music: 'romantic',
        isPremium: true,
    },

    // ===== MODERN =====
    {
        id: 'clean-minimal',
        name: 'Clean Minimal',
        eventTypes: ['wedding', 'birthday', 'corporate', 'community'],
        categories: ['Modern', 'Corporate'],
        colors: ['#64748B', '#FFFFFF', '#94A3B8'],
        theme: 'modern',
        layout: 'minimal',
        cover: 'minimal',
        font: 'inter',
        motion: 'modern',
        music: 'upbeat',
        isPremium: false,
    },
    {
        id: 'geometric-blue',
        name: 'Geometric Blue',
        eventTypes: ['wedding', 'corporate', 'community'],
        categories: ['Modern', 'Corporate'],
        colors: ['#3B82F6', '#EFF6FF', '#60A5FA'],
        theme: 'modern',
        layout: 'split',
        cover: 'geometric',
        font: 'poppins',
        motion: 'modern',
        music: 'upbeat',
        isPremium: true,
    },
    {
        id: 'sunset-gradient',
        name: 'Sunset Gradient',
        eventTypes: ['wedding', 'birthday', 'community'],
        categories: ['Modern', 'Luxury'],
        colors: ['#F97316', '#FFFBEB', '#FB923C'],
        theme: 'sunset',
        layout: 'hero',
        cover: 'gradient',
        font: 'poppins',
        motion: 'modern',
        music: 'upbeat',
        isPremium: false,
    },

    // ===== BABY/BIRTHDAY =====
    {
        id: 'baby-blue',
        name: 'Baby Blue',
        eventTypes: ['birthday'],
        categories: ['Baby', 'Modern'],
        colors: ['#60A5FA', '#EFF6FF', '#93C5FD'],
        theme: 'modern',
        layout: 'minimal',
        cover: 'minimal',
        font: 'poppins',
        motion: 'playful',
        music: 'upbeat',
        isPremium: false,
    },
    {
        id: 'baby-pink',
        name: 'Baby Pink',
        eventTypes: ['birthday'],
        categories: ['Baby', 'Modern'],
        colors: ['#F472B6', '#FDF2F8', '#FBCFE8'],
        theme: 'blush',
        layout: 'minimal',
        cover: 'floral',
        font: 'poppins',
        motion: 'playful',
        music: 'upbeat',
        isPremium: false,
    },
    {
        id: 'party-confetti',
        name: 'Party Confetti',
        eventTypes: ['birthday', 'community'],
        categories: ['Baby', 'Modern'],
        colors: ['#F59E0B', '#FEF3C7', '#FBBF24'],
        theme: 'sunset',
        layout: 'hero',
        cover: 'geometric',
        font: 'poppins',
        motion: 'playful',
        music: 'upbeat',
        isPremium: false,
    },

    // ===== RAYA =====
    {
        id: 'raya-green',
        name: 'Raya Hijau',
        eventTypes: ['raya', 'community'],
        categories: ['Raya', 'Traditional'],
        colors: ['#22C55E', '#052E16', '#86EFAC'],
        theme: 'garden',
        layout: 'hero',
        cover: 'islamic',
        font: 'playfair',
        motion: 'calm',
        music: 'acoustic',
        isPremium: false,
    },
    {
        id: 'raya-purple',
        name: 'Raya Purple',
        eventTypes: ['raya'],
        categories: ['Raya', 'Luxury'],
        colors: ['#A855F7', '#2E1065', '#D8B4FE'],
        theme: 'royal',
        layout: 'hero',
        cover: 'islamic',
        font: 'playfair',
        motion: 'luxury',
        music: 'acoustic',
        isPremium: true,
    },

    // ===== VINTAGE =====
    {
        id: 'vintage-sepia',
        name: 'Vintage Sepia',
        eventTypes: ['wedding', 'corporate'],
        categories: ['Vintage', 'Traditional'],
        colors: ['#78350F', '#FFFBEB', '#A16207'],
        theme: 'rustic',
        layout: 'classic',
        cover: 'frame',
        font: 'cormorant',
        motion: 'soft',
        music: 'acoustic',
        isPremium: false,
    },
    {
        id: 'art-deco',
        name: 'Art Deco',
        eventTypes: ['wedding', 'corporate'],
        categories: ['Vintage', 'Luxury'],
        colors: ['#D4AF37', '#1C1917', '#FDE68A'],
        theme: 'dark',
        layout: 'classic',
        cover: 'geometric',
        font: 'playfair',
        motion: 'luxury',
        music: 'romantic',
        isPremium: true,
    },

    // ===== CORPORATE =====
    {
        id: 'corporate-slate',
        name: 'Corporate Slate',
        eventTypes: ['corporate', 'community'],
        categories: ['Corporate', 'Modern'],
        colors: ['#475569', '#F8FAFC', '#94A3B8'],
        theme: 'modern',
        layout: 'minimal',
        cover: 'minimal',
        font: 'inter',
        motion: 'modern',
        music: 'upbeat',
        isPremium: false,
    },
    {
        id: 'gala-black',
        name: 'Gala Black',
        eventTypes: ['corporate'],
        categories: ['Corporate', 'Luxury'],
        colors: ['#D4AF37', '#020617', '#FCD34D'],
        theme: 'dark',
        layout: 'hero',
        cover: 'frame',
        font: 'playfair',
        motion: 'luxury',
        music: 'romantic',
        isPremium: true,
    },
];

// Helper: Get presets by category
export function getPresetsByCategory(category: string): DesignPreset[] {
    if (category === 'All') return DESIGN_PRESETS;
    return DESIGN_PRESETS.filter(p => p.categories.includes(category));
}

// Helper: Get presets by color
export function getPresetsByColor(colorId: string): DesignPreset[] {
    const palette = COLOR_PALETTES.find(c => c.id === colorId);
    if (!palette) return DESIGN_PRESETS;
    return DESIGN_PRESETS.filter(p =>
        p.colors.some(c => c.toLowerCase() === palette.color.toLowerCase())
    );
}

// Helper: Filter presets by multiple criteria
export function filterPresets(
    eventType: string | null,
    category: string | null,
    colorId: string | null
): DesignPreset[] {
    let results = DESIGN_PRESETS;

    // First filter by event type
    if (eventType) {
        results = results.filter(p =>
            p.eventTypes.includes(eventType as EventTypeId) ||
            p.eventTypes.includes('all')
        );
    }

    // Then filter by category
    if (category && category !== 'All') {
        results = results.filter(p => p.categories.includes(category));
    }

    // Finally filter by color
    if (colorId) {
        const palette = COLOR_PALETTES.find(c => c.id === colorId);
        if (palette) {
            const targetColor = palette.color.toUpperCase();
            results = results.filter(p =>
                p.colors.some(c => c.toUpperCase() === targetColor)
            );
        }
    }

    return results;
}

// Helper: Get a preset by ID
export function getPresetById(id: string): DesignPreset | undefined {
    return DESIGN_PRESETS.find(p => p.id === id);
}

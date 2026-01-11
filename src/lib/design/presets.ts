import { DesignPreset } from "../types/design";

export const DESIGN_PRESETS: DesignPreset[] = [
    {
        id: 'ROYAL_ELEGANT',
        name: 'Royal Elegance',
        description: 'A luxurious purple and gold theme perfect for grand weddings.',
        categories: ['Wedding', 'Traditional', 'Luxury'],
        colors: {
            primary: '#7C3AED',
            background: '#1E1B4B',
            text: '#F3E8FF',
            accent: '#C4B5FD',
            secondary: '#4C1D95'
        },
        theme: 'royal',
        layout: 'hero',
        cover: 'frame',
        font: 'playfair',
        motion: 'luxury',
        music: 'piano_romantic'
    },
    {
        id: 'MODERN_MINIMAL',
        name: 'Modern Minimal',
        description: 'Clean, bold and sophisticated. Ideal for corporate or modern events.',
        categories: ['Corporate', 'Modern', 'Minimalist'],
        colors: {
            primary: '#3B82F6',
            background: '#FFFFFF',
            text: '#1E293B',
            accent: '#60A5FA',
            secondary: '#F8FAFC'
        },
        theme: 'modern',
        layout: 'minimal',
        cover: 'gradient',
        font: 'inter',
        motion: 'modern',
        music: 'upbeat_corporate'
    },
    {
        id: 'TROPICAL_VIBE',
        name: 'Tropical Vibe',
        description: 'Fresh and lively teal tones for outdoor or fun gatherings.',
        categories: ['Birthday', 'Fun', 'Outdoor'],
        colors: {
            primary: '#14B8A6',
            background: '#F0FDFA',
            text: '#134E4A',
            accent: '#5EEAD4',
            secondary: '#CCFBF1'
        },
        theme: 'tropical',
        layout: 'split',
        cover: 'floral',
        font: 'montserrat',
        motion: 'pop',
        music: 'fun_ukulele'
    },
    {
        id: 'CLASSIC_FLORAL',
        name: 'Classic Floral',
        description: 'Timeless floral beauty with soft rose and white/pink tones.',
        categories: ['Wedding', 'Family', 'Floral'],
        colors: {
            primary: '#E11D48',
            background: '#FFF1F2',
            text: '#881337',
            accent: '#FB7185',
            secondary: '#FFE4E6'
        },
        theme: 'elegant',
        layout: 'classic',
        cover: 'floral',
        font: 'greatvibes',
        motion: 'soft',
        music: 'violin_classic'
    },
    {
        id: 'DARK_LUXURY',
        name: 'Dark Luxury',
        description: 'Premium gold on black. High contrast and exclusive feel.',
        categories: ['Corporate', 'Wedding', 'Exclusive'],
        colors: {
            primary: '#D4AF37',
            background: '#0F172A',
            text: '#F8FAFC',
            accent: '#FCD34D',
            secondary: '#1E293B'
        },
        theme: 'dark',
        layout: 'timeline',
        cover: 'islamic',
        font: 'cormorant',
        motion: 'luxury',
        music: 'cinematic_ambient'
    }
];

export const getPresetById = (id: string): DesignPreset => {
    return DESIGN_PRESETS.find(p => p.id === id) || DESIGN_PRESETS[0];
};

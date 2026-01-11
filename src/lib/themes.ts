// Design Templates with rich configuration for real mini-invitation previews
// Easy to add new templates - just add to this array!

export interface TemplateDesign {
    bgColor: string;
    bgGradient?: string;
    frameColor: string;
    textColor: string;
    accentColor: string;
    font: 'playfair' | 'inter' | 'dancing' | 'roboto';
    frameType: 'elegant-border' | 'double-line' | 'floral-corners' | 'oval' | 'minimal' | 'golden-frame' | 'none';
    style: 'classic' | 'modern' | 'romantic' | 'luxury' | 'playful' | 'corporate';
}

export interface TemplateConfig {
    layout: 'centered' | 'left-align' | 'story-scroll';
    animation: 'fade-in' | 'slide-up' | 'envelope-open' | 'none';
    sections: {
        greeting: boolean;
        program: boolean;
        dressCode: boolean;
        contacts: boolean;
        gift: boolean;
        gallery: boolean;
        wishes: boolean;
        rsvp: boolean;
        map: boolean;
    };
}

export interface DesignTemplate {
    id: string;
    name: string;
    category: 'wedding' | 'birthday' | 'corporate' | 'community' | 'all';
    isPremium: boolean;
    thumbnail: string; // Path to preview image, e.g., '/templates/classic-gold-thumb.png'
    design: TemplateDesign;
    config: TemplateConfig;
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
    // WEDDING TEMPLATES
    {
        id: 'classic-gold',
        name: 'Classic Gold',
        category: 'wedding',
        isPremium: false,
        thumbnail: '/templates/classic-gold.png',
        design: {
            bgColor: '#0f172a',
            frameColor: '#d4af37',
            textColor: '#ffffff',
            accentColor: '#d4af37',
            font: 'playfair',
            frameType: 'elegant-border',
            style: 'classic',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },
    {
        id: 'floral-rose',
        name: 'Floral Rose',
        category: 'wedding',
        isPremium: false,
        thumbnail: '/templates/floral-rose.png',
        design: {
            bgColor: '#fff1f2',
            frameColor: '#e11d48',
            textColor: '#881337',
            accentColor: '#fb7185',
            font: 'dancing',
            frameType: 'floral-corners',
            style: 'romantic',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },
    {
        id: 'rustic-charm',
        name: 'Rustic Charm',
        category: 'wedding',
        isPremium: true,
        thumbnail: '/templates/rustic-charm.png',
        design: {
            bgColor: '#fffbeb',
            frameColor: '#92400e',
            textColor: '#78350f',
            accentColor: '#d97706',
            font: 'playfair',
            frameType: 'double-line',
            style: 'classic',
        },
        config: {
            layout: 'centered',
            animation: 'slide-up',
            sections: { greeting: true, program: true, dressCode: true, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },

    // BIRTHDAY TEMPLATES
    {
        id: 'tropical-vibes',
        name: 'Tropical Fun',
        category: 'birthday',
        isPremium: false,
        thumbnail: '/templates/tropical-vibes.png',
        design: {
            bgColor: '#f0fdfa',
            bgGradient: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
            frameColor: '#0d9488',
            textColor: '#134e4a',
            accentColor: '#14b8a6',
            font: 'dancing',
            frameType: 'minimal',
            style: 'playful',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },
    {
        id: 'party-confetti',
        name: 'Party Confetti',
        category: 'birthday',
        isPremium: false,
        thumbnail: '/templates/party-confetti.png',
        design: {
            bgColor: '#fef3c7',
            frameColor: '#f59e0b',
            textColor: '#78350f',
            accentColor: '#fb923c',
            font: 'inter',
            frameType: 'none',
            style: 'playful',
        },
        config: {
            layout: 'centered',
            animation: 'slide-up',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },
    {
        id: 'elegant-birthday',
        name: 'Elegant',
        category: 'birthday',
        isPremium: true,
        thumbnail: '/templates/elegant-birthday.png',
        design: {
            bgColor: '#1e1b4b',
            frameColor: '#a78bfa',
            textColor: '#ffffff',
            accentColor: '#c4b5fd',
            font: 'playfair',
            frameType: 'oval',
            style: 'luxury',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: true, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },

    // CORPORATE TEMPLATES
    {
        id: 'modern-minimal',
        name: 'Modern',
        category: 'corporate',
        isPremium: false,
        thumbnail: '/templates/modern-minimal.png',
        design: {
            bgColor: '#ffffff',
            frameColor: '#64748b',
            textColor: '#0f172a',
            accentColor: '#475569',
            font: 'inter',
            frameType: 'minimal',
            style: 'modern',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: false, gallery: false, wishes: false, rsvp: true, map: true },
        },
    },
    {
        id: 'gala-gold',
        name: 'Gala Gold',
        category: 'corporate',
        isPremium: true,
        thumbnail: '/templates/gala-gold.png',
        design: {
            bgColor: '#020617',
            bgGradient: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
            frameColor: '#d4af37',
            textColor: '#fef3c7',
            accentColor: '#d4af37',
            font: 'playfair',
            frameType: 'golden-frame',
            style: 'luxury',
        },
        config: {
            layout: 'centered',
            animation: 'slide-up',
            sections: { greeting: true, program: true, dressCode: true, contacts: true, gift: false, gallery: true, wishes: false, rsvp: true, map: true },
        },
    },
    {
        id: 'corporate-blue',
        name: 'Corporate',
        category: 'corporate',
        isPremium: false,
        thumbnail: '/templates/corporate-blue.png',
        design: {
            bgColor: '#eff6ff',
            frameColor: '#2563eb',
            textColor: '#1e3a8a',
            accentColor: '#3b82f6',
            font: 'roboto',
            frameType: 'double-line',
            style: 'corporate',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: false, gallery: false, wishes: false, rsvp: true, map: true },
        },
    },

    // UNIVERSAL TEMPLATES (all event types)
    {
        id: 'royal-purple',
        name: 'Royal Purple',
        category: 'all',
        isPremium: true,
        thumbnail: '/templates/royal-purple.png',
        design: {
            bgColor: '#1e1b4b',
            bgGradient: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
            frameColor: '#a855f7',
            textColor: '#f3e8ff',
            accentColor: '#c084fc',
            font: 'playfair',
            frameType: 'elegant-border',
            style: 'luxury',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: true, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },
    {
        id: 'clean-white',
        name: 'Clean White',
        category: 'all',
        isPremium: false,
        thumbnail: '/templates/clean-white.png',
        design: {
            bgColor: '#ffffff',
            frameColor: '#e2e8f0',
            textColor: '#334155',
            accentColor: '#94a3b8',
            font: 'inter',
            frameType: 'minimal',
            style: 'modern',
        },
        config: {
            layout: 'centered',
            animation: 'fade-in',
            sections: { greeting: true, program: true, dressCode: false, contacts: true, gift: true, gallery: true, wishes: true, rsvp: true, map: true },
        },
    },
];

// Legacy exports for backward compatibility
export const THEMES = DESIGN_TEMPLATES.slice(0, 5).map(t => ({
    id: t.id,
    name: t.name,
    description: t.design.style,
    color: t.design.accentColor,
    font: t.design.font,
    gradient: t.design.bgGradient || `linear-gradient(135deg, ${t.design.bgColor} 0%, ${t.design.frameColor}40 100%)`,
}));

export const THEME_COLORS = [
    { id: 'slate', name: 'Slate', value: '#64748b' },
    { id: 'gold', name: 'Luxury Gold', value: '#d4af37' },
    { id: 'rose', name: 'Rose Gold', value: '#fb7185' },
    { id: 'emerald', name: 'Emerald', value: '#10b981' },
    { id: 'blue', name: 'Royal Blue', value: '#3b82f6' },
    { id: 'purple', name: 'Majestic Purple', value: '#a855f7' },
];

export const FONTS = [
    { id: 'inter', name: 'Modern (Inter)', variable: '--font-inter' },
    { id: 'playfair', name: 'Classic (Playfair)', variable: '--font-playfair' },
    { id: 'dancing', name: 'Script (Dancing Script)', variable: '--font-dancing' },
    { id: 'roboto', name: 'Clean (Roboto)', variable: '--font-roboto' },
];

export const DEFAULT_MUSIC = [
    { id: 'romantic', name: 'Romantic Piano', src: '/music/romantic.mp3' },
    { id: 'upbeat', name: 'Upbeat Celebration', src: '/music/upbeat.mp3' },
    { id: 'acoustic', name: 'Acoustic Guitar', src: '/music/acoustic.mp3' },
];

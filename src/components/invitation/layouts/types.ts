import { EventDesignConfig, DesignPreset } from '@/lib/types/design';

export interface LayoutProps {
    data: {
        eventType: string;
        eventTitle?: string;
        couple?: string;
        groomName?: string;
        brideName?: string;
        groomFullName?: string;
        brideFullName?: string;
        groomParents?: string;
        brideParents?: string;
        celebrantName?: string;
        organizer?: string;
        companyName?: string;
        dateStr?: string;
        date?: string;
        timeStr?: string;
        time?: string;
        venueName?: string;
        venue?: string;
        venueAddress?: string;
        address?: string;
        greeting?: string;
        message?: string;
        description?: string;
        agenda?: any[];
        itinerary?: any[];
        bankAccounts?: any[];
        whatsapp?: string;
        phone?: string;
        [key: string]: any;
    };
    preset: DesignPreset;
    eventRules: EventDesignConfig;
    primaryColor: string;
    eventSlug: string;
    wishes?: any[];
    onWishSubmitted?: () => void;
}

// Spacing map based on event rules
export const SPACING_MAP = {
    tight: { section: 'py-4', content: 'space-y-3', card: 'p-4' },
    medium: { section: 'py-6', content: 'space-y-5', card: 'p-6' },
    large: { section: 'py-10', content: 'space-y-7', card: 'p-8' },
    comfortable: { section: 'py-8', content: 'space-y-6', card: 'p-6' }
};

// Font scale map
export const FONT_SCALE_MAP = {
    sm: { hero: 'text-3xl md:text-4xl', section: 'text-lg', body: 'text-sm' },
    base: { hero: 'text-4xl md:text-5xl', section: 'text-xl', body: 'text-base' },
    lg: { hero: 'text-5xl md:text-6xl', section: 'text-2xl', body: 'text-base' },
    xl: { hero: 'text-6xl md:text-7xl', section: 'text-3xl', body: 'text-lg' }
};

// Corner radius map
export const RADIUS_MAP = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
    full: 'rounded-full'
};

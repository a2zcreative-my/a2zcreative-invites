import { EventType, EventDesignConfig } from "../types/design";

export const EVENT_DESIGN_RULES: Record<EventType, EventDesignConfig> = {
    wedding: {
        spacing: 'large',
        fontScale: 'lg',
        cornerRadius: 'lg',
        defaultMotion: 'soft',
        colorTone: 'warm',
        showParents: true,
        uppercaseHeaders: true
    },
    birthday: {
        spacing: 'medium',
        fontScale: 'base',
        cornerRadius: 'md',
        defaultMotion: 'pop',
        colorTone: 'bright',
        showParents: false,
        uppercaseHeaders: false
    },
    family: {
        spacing: 'comfortable',
        fontScale: 'base',
        cornerRadius: 'md',
        defaultMotion: 'calm',
        colorTone: 'warm',
        showParents: false,
        uppercaseHeaders: false
    },
    community: {
        spacing: 'medium',
        fontScale: 'lg',
        cornerRadius: 'sm',
        defaultMotion: 'modern',
        colorTone: 'neutral',
        showParents: false,
        uppercaseHeaders: true
    },
    corporate: {
        spacing: 'tight',
        fontScale: 'base',
        cornerRadius: 'none',
        defaultMotion: 'modern',
        colorTone: 'neutral',
        showParents: false,
        uppercaseHeaders: true
    }
};

export const getEventDesignRules = (type: string): EventDesignConfig => {
    const normalizedType = (type || 'wedding').toLowerCase() as EventType;
    return EVENT_DESIGN_RULES[normalizedType] || EVENT_DESIGN_RULES.wedding;
};

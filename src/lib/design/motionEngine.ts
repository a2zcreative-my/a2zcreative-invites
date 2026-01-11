import { MotionStyle } from '../types/design';

/**
 * Motion Engine
 * 
 * Defines animation configurations for different motion styles.
 * These can be applied via CSS classes or used with framer-motion.
 */

export interface MotionConfig {
    fadeIn: string;
    fadeInUp: string;
    scaleIn: string;
    hoverScale: string;
    duration: string;
    easing: string;
    staggerDelay: string;
}

export const MOTION_CONFIGS: Record<MotionStyle, MotionConfig> = {
    soft: {
        fadeIn: 'animate-fade-in-soft',
        fadeInUp: 'animate-fade-in-up-soft',
        scaleIn: 'animate-scale-in-soft',
        hoverScale: 'hover:scale-[1.01]',
        duration: '800ms',
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        staggerDelay: '150ms'
    },
    modern: {
        fadeIn: 'animate-fade-in-modern',
        fadeInUp: 'animate-fade-in-up-modern',
        scaleIn: 'animate-scale-in-modern',
        hoverScale: 'hover:scale-[1.03]',
        duration: '400ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        staggerDelay: '80ms'
    },
    luxury: {
        fadeIn: 'animate-fade-in-luxury',
        fadeInUp: 'animate-fade-in-up-luxury',
        scaleIn: 'animate-scale-in-luxury',
        hoverScale: 'hover:scale-[1.02]',
        duration: '1200ms',
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        staggerDelay: '200ms'
    },
    calm: {
        fadeIn: 'animate-fade-in-calm',
        fadeInUp: 'animate-fade-in-up-calm',
        scaleIn: 'animate-scale-in-calm',
        hoverScale: 'hover:scale-[1.01]',
        duration: '600ms',
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        staggerDelay: '120ms'
    },
    pop: {
        fadeIn: 'animate-fade-in-pop',
        fadeInUp: 'animate-fade-in-up-pop',
        scaleIn: 'animate-scale-in-pop',
        hoverScale: 'hover:scale-[1.05]',
        duration: '300ms',
        easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        staggerDelay: '60ms'
    }
};

export const getMotionConfig = (style: MotionStyle): MotionConfig => {
    return MOTION_CONFIGS[style] || MOTION_CONFIGS.soft;
};

/**
 * Get CSS animation class for a motion style
 */
export const getAnimationClass = (style: MotionStyle, type: keyof MotionConfig): string => {
    const config = getMotionConfig(style);
    return config[type] as string;
};

export type EventType = 'wedding' | 'birthday' | 'family' | 'community' | 'corporate';

export type LayoutType = 'hero' | 'minimal' | 'classic' | 'split' | 'timeline';
export type MotionStyle = 'soft' | 'modern' | 'luxury' | 'calm' | 'pop';
export type CoverStyle = 'photo' | 'frame' | 'floral' | 'islamic' | 'gradient';
export type FontTheme = 'playfair' | 'inter' | 'cormorant' | 'greatvibes' | 'montserrat';

export interface EventDesignConfig {
    spacing: 'tight' | 'medium' | 'large' | 'comfortable';
    fontScale: 'sm' | 'base' | 'lg' | 'xl';
    cornerRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    defaultMotion: MotionStyle;
    colorTone: 'warm' | 'cool' | 'neutral' | 'bright';
    showParents: boolean;
    uppercaseHeaders: boolean;
}

export interface DesignPreset {
    id: string;
    name: string;
    description: string;
    categories: string[];
    colors: {
        primary: string;
        background: string;
        text: string;
        accent: string;
        secondary?: string;
    };
    theme: string; // CSS class suffix (e.g. 'royal' -> .theme-royal)
    layout: LayoutType;
    cover: CoverStyle;
    font: FontTheme;
    motion: MotionStyle;
    music?: string;
}

export interface ThemeVariables {
    '--primary': string;
    '--background': string;
    '--text': string;
    '--accent': string;
    '--font-display': string;
    '--font-body': string;
}

import { DesignPreset, EventType, ThemeVariables } from "../types/design";
import { getEventDesignRules } from "./eventRules";
import { getPresetById } from "./presets";

export interface ResolvedTheme {
    preset: DesignPreset;
    variables: ThemeVariables;
    config: ReturnType<typeof getEventDesignRules>;
}

/**
 * Merges the Event Type Rules with the chosen Preset to produce the final theme configuration.
 */
export const resolveTheme = (presetId: string, eventType: string): ResolvedTheme => {
    const preset = getPresetById(presetId);
    const eventRules = getEventDesignRules(eventType);

    // Map font themes to actual font families (this should match your tailwind config or loaded fonts)
    const fontMap: Record<string, { display: string; body: string }> = {
        playfair: { display: 'Playfair Display, serif', body: 'Lato, sans-serif' },
        inter: { display: 'Inter, sans-serif', body: 'Inter, sans-serif' },
        cormorant: { display: 'Cormorant Garamond, serif', body: 'Proza Libre, sans-serif' },
        greatvibes: { display: 'Great Vibes, cursive', body: 'Montserrat, sans-serif' },
        montserrat: { display: 'Montserrat, sans-serif', body: 'Open Sans, sans-serif' },
    };

    const fonts = fontMap[preset.font] || fontMap.inter;

    const variables: ThemeVariables = {
        '--primary': preset.colors.primary,
        '--background': preset.colors.background,
        '--text': preset.colors.text,
        '--accent': preset.colors.accent,
        '--font-display': fonts.display,
        '--font-body': fonts.body,
    };

    return {
        preset,
        variables,
        config: eventRules
    };
};

/**
 * Apply the theme variables to a DOM element (usually the root or a wrapper)
 */
export const applyTheme = (element: HTMLElement | null, theme: ResolvedTheme) => {
    if (!element) return;

    Object.entries(theme.variables).forEach(([key, value]) => {
        element.style.setProperty(key, value);
    });
};

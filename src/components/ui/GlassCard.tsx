import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'featured' | 'glow' | 'deep'; // Added 'deep' for forms
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * GlassCard Component
 * Standardized glassmorphism container for the application.
 */
export default function GlassCard({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    ...props
}: GlassCardProps) {

    // Base styles consistent with globals.css but applied as Tailwind utilities where possible
    // or relying on the global classes as the source of truth if they exist.
    // Here we define the variants explicitly for better control.

    const baseStyles = "relative overflow-hidden transition-all duration-300 border backdrop-blur-xl";

    const variants = {
        default: "bg-slate-950/30 border-white/10 shadow-lg",
        featured: "bg-slate-900/40 border-[var(--brand-gold)]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]",
        glow: "bg-white/5 border-white/20 shadow-[0_0_20px_rgba(0,242,255,0.1)]",
        deep: "bg-[#020617]/70 border-white/10 shadow-xl" // For heavy forms, matching pickers
    };

    const paddings = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10"
    };

    const rounded = "rounded-3xl"; // Standardizing to 3xl for premium feel

    return (
        <div
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${paddings[padding]} 
                ${rounded} 
                ${className}
            `}
            {...props}
        >
            {/* Inner Highlight for Depth */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

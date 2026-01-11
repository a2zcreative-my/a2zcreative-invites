import React from 'react';

interface GlassCardProps {
    variant?: 'default' | 'featured' | 'glow';
    className?: string;
    children: React.ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function GlassCard({
    variant = 'default',
    className = '',
    children,
    padding = 'md'
}: GlassCardProps) {
    const isFeatured = variant === 'featured';
    const isGlow = variant === 'glow';

    // Base class for the card wrapper
    const wrapperClass = `glass-card-wrap ${className}`;

    // Mapping internal padding classes if needed, or rely on global CSS
    // Assuming .glass-card has default padding, we can append utility classes if we want override
    // But typically glass-card has fixed padding. Let's add specific padding classes if needed.
    const paddingClass =
        padding === 'none' ? 'p-0' :
            padding === 'sm' ? 'p-4' :
                padding === 'lg' ? 'p-8' :
                    ''; // md is default usually handled by CSS or p-6

    // Combine variant classes
    // .glass-card is default
    // .glass-card.featured matches existing css
    // .glass-card-glow matches existing css for glow variant if we use that directly, 
    // but the CSS has .glass-card-glow as a separate class. Let's unify.

    let cardClass = 'glass-card';
    if (isFeatured) cardClass += ' featured';
    if (isGlow) cardClass = 'glass-card-glow'; // Replace base class or append? CSS shows .glass-card-glow is standalone

    // If standard glass card, we might want to merge with padding
    if (paddingClass) cardClass += ` ${paddingClass}`;

    return (
        <div className={wrapperClass} style={{ position: 'relative' }}>
            {/* Optional Outer Glow (Featured only) */}
            {isFeatured && <div className="glass-card-glow-effect" />}

            {/* Main Card */}
            <div className={cardClass}>
                {/* Inner Glass Highlight for standard/featured cards */}
                {(variant === 'default' || variant === 'featured') && (
                    <div className="glass-card-highlight" />
                )}

                {/* Content Wrapper */}
                <div className="glass-card-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

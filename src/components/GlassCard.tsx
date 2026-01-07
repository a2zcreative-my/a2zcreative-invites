
import React from 'react';

interface GlassCardProps {
    variant?: 'default' | 'featured';
    className?: string;
    children: React.ReactNode;
}

export default function GlassCard({
    variant = 'default',
    className = '',
    children
}: GlassCardProps) {
    const isFeatured = variant === 'featured';

    return (
        <div className={`glass-card-wrap ${className}`} style={{ position: 'relative' }}>
            {/* Optional Outer Glow (Featured only) */}
            {isFeatured && <div className="glass-card-glow-effect" />}

            {/* Main Card */}
            <div className={`glass-card ${isFeatured ? 'featured' : ''}`}>
                {/* Inner Glass Highlight */}
                <div className="glass-card-highlight" />

                {/* Content Wrapper */}
                <div className="glass-card-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

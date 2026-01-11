import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ElementType;
    iconPosition?: 'left' | 'right';
    containerClassName?: string;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(({
    className = '',
    label,
    error,
    icon: Icon,
    iconPosition = 'left',
    containerClassName = '',
    ...props
}, ref) => {

    const baseInputStyles = "w-full bg-[#020617]/30 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 py-3 px-4";

    // Dynamic padding based on icon
    const paddingLeft = Icon && iconPosition === 'left' ? 'pl-11' : 'pl-4';
    const paddingRight = Icon && iconPosition === 'right' ? 'pr-11' : 'pr-4';

    const errorStyles = error
        ? "border-red-500/50 focus:ring-red-500/50"
        : "hover:border-white/20";

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-slate-300 mb-2 text-sm font-medium ml-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {/* Icon (Left) */}
                {Icon && iconPosition === 'left' && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--brand-gold)] transition-colors pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}

                <input
                    ref={ref}
                    className={`${baseInputStyles} ${paddingLeft} ${paddingRight} ${errorStyles} ${className}`}
                    {...props}
                />

                {/* Icon (Right) */}
                {Icon && iconPosition === 'right' && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--brand-gold)] transition-colors pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs ml-1 animate-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;

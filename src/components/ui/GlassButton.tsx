import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function GlassButton({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}: GlassButtonProps) {

    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl relative overflow-hidden group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const variants = {
        primary: "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-pink-500/25 border border-white/20",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 backdrop-blur-md",
        ghost: "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-red-100 border border-red-500/20"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3.5 text-base font-bold tracking-wide",
        icon: "p-2 aspect-square"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Loading Spinner */}
            {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {/* Left Icon (if not loading) */}
            {!isLoading && leftIcon && (
                <span className="mr-2">{leftIcon}</span>
            )}

            {children}

            {/* Right Icon */}
            {!isLoading && rightIcon && (
                <span className="ml-2 group-hover:translate-x-0.5 transition-transform">{rightIcon}</span>
            )}

            {/* Shine Effect for Primary */}
            {variant === 'primary' && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
            )}
        </button>
    );
}

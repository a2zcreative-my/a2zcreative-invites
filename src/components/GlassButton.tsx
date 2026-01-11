import React, { ButtonHTMLAttributes } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
    size?: 'sm' | 'md' | 'lg' | 'full';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function GlassButton({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    disabled,
    ...props
}: GlassButtonProps) {

    // Map variants to CSS classes defined in globals.css
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        gold: 'btn-gold',
    };

    // Map sizes to CSS classes
    const sizeClasses = {
        sm: 'btn-sm',
        md: '', // Default size
        lg: 'btn-lg',
        full: 'btn-full', // Helper class for width: 100%
    };

    const baseClass = 'btn';
    const computedClass = `
        ${baseClass} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${className}
    `.trim();

    return (
        <button
            className={computedClass}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}

            {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
        </button>
    );
}

import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

interface BaseProps {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
    as?: 'input' | 'textarea' | 'select';
}

// Union type for props to handle both input and textarea attributes
type GlassInputProps = BaseProps & (InputProps | TextareaProps) & {
    // Add any specific props if needed
    children?: React.ReactNode; // For select options
};

export default function GlassInput({
    label,
    error,
    helperText,
    icon,
    containerClassName = '',
    className = '',
    as = 'input',
    children,
    id,
    ...props
}: GlassInputProps) {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    const baseInputClass = as === 'textarea' ? 'form-textarea' : as === 'select' ? 'form-select' : 'form-input';
    const errorClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
    const iconClass = icon ? 'pl-10' : '';

    const computedInputClass = `${baseInputClass} ${errorClass} ${iconClass} ${className}`;

    const renderInput = () => {
        if (as === 'textarea') {
            return (
                <textarea
                    id={inputId}
                    className={computedInputClass}
                    {...(props as TextareaProps)}
                />
            );
        }
        if (as === 'select') {
            return (
                <select
                    id={inputId}
                    className={computedInputClass}
                    {...(props as any)} // Select props
                >
                    {children}
                </select>
            );
        }
        return (
            <input
                id={inputId}
                className={computedInputClass}
                {...(props as InputProps)}
            />
        );
    };

    return (
        <div className={`form-group ${containerClassName}`}>
            {label && (
                <label htmlFor={inputId} className="form-label">
                    {label}
                </label>
            )}

            <div className="input-group relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                {renderInput()}
            </div>

            {error && (
                <p className="form-error text-sm text-red-400 mt-1">{error}</p>
            )}

            {!error && helperText && (
                <p className="text-xs text-slate-400 mt-1">{helperText}</p>
            )}
        </div>
    );
}

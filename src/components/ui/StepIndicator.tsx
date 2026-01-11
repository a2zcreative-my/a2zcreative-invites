'use client';

import React from 'react';
import { Check, ClipboardList, Palette, Eye, Sparkles, Music, Users, Gift, ListOrdered } from 'lucide-react';

interface Step {
    number: number;
    label: string;
    icon: React.ReactNode;
}

interface StepIndicatorProps {
    currentStep: number;
    eventType?: string; // To show/hide Gift step for non-wedding/birthday
}

// Extended steps for the full wizard
const getSteps = (eventType?: string): Step[] => {
    const baseSteps: Step[] = [
        { number: 1, label: 'Pilih Jenis', icon: <Sparkles size={16} /> },
        { number: 2, label: 'Butiran Majlis', icon: <ClipboardList size={16} /> },
        { number: 3, label: 'Aturcara', icon: <ListOrdered size={16} /> },
        { number: 4, label: 'Tema & Muzik', icon: <Music size={16} /> },
        { number: 5, label: 'Hubungi', icon: <Users size={16} /> },
    ];

    // Add Gift step only for wedding and birthday
    if (eventType === 'wedding' || eventType === 'birthday') {
        baseSteps.push({ number: 6, label: 'Hadiah', icon: <Gift size={16} /> });
        baseSteps.push({ number: 7, label: 'Pratonton', icon: <Eye size={16} /> });
    } else {
        baseSteps.push({ number: 6, label: 'Pratonton', icon: <Eye size={16} /> });
    }

    return baseSteps;
};

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, eventType }) => {
    const steps = getSteps(eventType);
    const searchParams = useSearchParams();
    const slug = searchParams.get('slug');
    const pkg = searchParams.get('package') || 'free';

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '2rem',
        overflowX: 'auto',
        padding: '0.5rem 0',
    };

    const stepWrapperStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.25rem',
        position: 'relative',
        zIndex: 10
    };

    const getStepCircleStyle = (stepNumber: number): React.CSSProperties => {
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return {
            width: '36px',
            height: '36px',
            minWidth: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.75rem',
            transition: 'all 0.3s ease',
            border: isCurrent
                ? '2px solid var(--brand-gold)'
                : isCompleted
                    ? '2px solid #22c55e'
                    : '2px solid rgba(255,255,255,0.15)',
            backgroundColor: isCurrent
                ? 'rgba(212, 175, 55, 0.2)'
                : isCompleted
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(255,255,255,0.05)',
            color: isCurrent
                ? 'var(--brand-gold)'
                : isCompleted
                    ? '#22c55e'
                    : '#64748b',
            boxShadow: isCurrent
                ? '0 0 15px rgba(212, 175, 55, 0.4)'
                : 'none',
        };
    };

    const getLabelStyle = (stepNumber: number): React.CSSProperties => {
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return {
            fontSize: '0.625rem',
            fontWeight: isCurrent ? 600 : 400,
            color: isCurrent ? 'white' : isCompleted ? '#94a3b8' : '#64748b',
            marginTop: '0.375rem',
            textAlign: 'center',
            maxWidth: '60px',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
        };
    };

    const getConnectorStyle = (stepNumber: number): React.CSSProperties => {
        const isCompleted = stepNumber < currentStep;

        return {
            width: '24px',
            height: '2px',
            marginTop: '17px', // Center vertically with circle
            backgroundColor: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.1)',
            transition: 'background-color 0.3s ease',
        };
    };

    const getLinkHref = (stepNumber: number) => {
        if (!slug || stepNumber === 1 || !eventType) return null;

        const query = `?slug=${slug}&package=${pkg}`;

        switch (stepNumber) {
            case 2: return `/create/form/${eventType}${query}`;
            case 3: return `/create/agenda/${eventType}${query}`;
            case 4: return `/create/theme/${eventType}${query}`;
            case 5: return `/create/contact/${eventType}${query}`;
            case 6: return (eventType === 'wedding' || eventType === 'birthday')
                ? `/create/gift/${eventType}${query}`
                : `/create/preview/${eventType}${query}`;
            case 7: return `/create/preview/${eventType}${query}`;
            default: return null;
        }
    };

    return (
        <div style={containerStyle}>
            {steps.map((step, index) => {
                const href = getLinkHref(step.number);

                // Content wrapper simply renders the circle and label
                const StepContent = (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: href ? 'pointer' : 'default' }}>
                        <div style={getStepCircleStyle(step.number)}>
                            {step.number < currentStep ? (
                                <Check size={14} />
                            ) : (
                                step.icon
                            )}
                        </div>
                        <span style={getLabelStyle(step.number)}>{step.label}</span>
                    </div>
                );

                return (
                    <div key={step.number} style={stepWrapperStyle}>
                        {href ? (
                            <Link href={href} style={{ textDecoration: 'none' }}>
                                {StepContent}
                            </Link>
                        ) : (
                            StepContent
                        )}

                        {index < steps.length - 1 && (
                            <div style={getConnectorStyle(step.number)} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;

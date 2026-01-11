'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import {
    useFloating,
    useClick,
    useDismiss,
    useInteractions,
    FloatingPortal,
    autoUpdate,
    offset,
    flip,
    shift
} from '@floating-ui/react';

interface GlassTimePickerProps {
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    name: string;
    placeholder?: string;
    required?: boolean;
}

const GlassTimePicker: React.FC<GlassTimePickerProps> = ({ value, onChange, name, placeholder = '--:--', required }) => {
    const [isOpen, setIsOpen] = useState(false);

    const [selectedHour, setSelectedHour] = useState('12');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'end' }),
            shift()
        ],
        whileElementsMounted: autoUpdate,
        placement: 'bottom-start'
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    useEffect(() => {
        if (value) {
            const [hours, minutes] = value.split(':');
            let h = parseInt(hours);
            const p = h >= 12 ? 'PM' : 'AM';
            if (h > 12) h -= 12;
            if (h === 0) h = 12;
            setSelectedHour(h.toString().padStart(2, '0'));
            setSelectedMinute(minutes);
            setPeriod(p);
        }
    }, [value]);

    const updateTime = (h: string, m: string, p: 'AM' | 'PM') => {
        let hourInt = parseInt(h);
        if (p === 'PM' && hourInt !== 12) hourInt += 12;
        if (p === 'AM' && hourInt === 12) hourInt = 0;
        const formattedHour = hourInt.toString().padStart(2, '0');
        onChange({ target: { name, value: `${formattedHour}:${m}` } });
    };

    const handleHourSelect = (h: string) => { setSelectedHour(h); updateTime(h, selectedMinute, period); };
    const handleMinuteSelect = (m: string) => { setSelectedMinute(m); updateTime(selectedHour, m, period); };
    const handlePeriodSelect = (p: 'AM' | 'PM') => { setPeriod(p); updateTime(selectedHour, selectedMinute, p); };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    return (
        <>
            {/* Trigger Input - Premium Glass Style (matching DatePicker) */}
            <div
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`
                    group relative flex items-center w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
                    bg-slate-950/40 backdrop-blur-sm border
                    ${isOpen
                        ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                        : 'border-white/10 hover:border-white/20'
                    }
                `}
            >
                <div className={`mr-3 transition-colors ${isOpen || value ? 'text-[#d4af37]' : 'text-slate-500'}`}>
                    <Clock size={18} />
                </div>
                <div className={`flex-1 text-base ${value ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {value ? `${selectedHour}:${selectedMinute} ${period}` : placeholder}
                </div>
            </div>

            <FloatingPortal>
                {isOpen && (
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        {...getFloatingProps()}
                        className="
                            z-[9999] w-[280px]
                            p-4 rounded-xl border border-white/10
                            bg-slate-950/70 backdrop-blur-xl
                            shadow-[0_20px_40px_-5px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)]
                            animate-in fade-in zoom-in-95 duration-200
                        "
                    >
                        <div className="flex gap-2 h-48">
                            {/* Hours Column */}
                            <div className="flex-1 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                <div className="text-xs text-slate-500 text-center mb-2 font-medium sticky top-0 bg-slate-950/90 py-1 z-10 backdrop-blur-md">Hour</div>
                                <div className="flex flex-col gap-1 px-1">
                                    {hours.map(h => (
                                        <button
                                            key={h}
                                            onClick={(e) => { e.preventDefault(); handleHourSelect(h); }}
                                            className={`
                                                w-full p-2 rounded-lg text-sm transition-all duration-200
                                                ${selectedHour === h
                                                    ? 'bg-[var(--brand-gold)] text-black font-bold'
                                                    : 'text-slate-300 hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px bg-white/10 my-2" />

                            {/* Minutes Column */}
                            <div className="flex-1 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                <div className="text-xs text-slate-500 text-center mb-2 font-medium sticky top-0 bg-slate-950/90 py-1 z-10 backdrop-blur-md">Min</div>
                                <div className="flex flex-col gap-1 px-1">
                                    {minutes.map(m => (
                                        <button
                                            key={m}
                                            onClick={(e) => { e.preventDefault(); handleMinuteSelect(m); }}
                                            className={`
                                                w-full p-2 rounded-lg text-sm transition-all duration-200
                                                ${selectedMinute === m
                                                    ? 'bg-[var(--brand-gold)] text-black font-bold'
                                                    : 'text-slate-300 hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px bg-white/10 my-2" />

                            {/* AM/PM Column */}
                            <div className="flex flex-col justify-center gap-2 px-1">
                                {(['AM', 'PM'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={(e) => { e.preventDefault(); handlePeriodSelect(p); }}
                                        className={`
                                            w-full px-3 py-2 rounded-lg text-sm font-medium transition-all
                                            ${period === p
                                                ? 'bg-slate-700 text-white'
                                                : 'bg-transparent text-slate-500 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </FloatingPortal>
            <input type="hidden" name={name} value={value} required={required} />
        </>
    );
};

export default GlassTimePicker;

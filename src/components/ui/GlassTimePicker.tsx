'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface GlassTimePickerProps {
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    name: string;
    placeholder?: string;
    required?: boolean;
}

const GlassTimePicker: React.FC<GlassTimePickerProps> = ({ value, onChange, name, placeholder = '--:--', required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [selectedHour, setSelectedHour] = useState('12');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <div className="relative w-full" ref={containerRef}>
            <div className="input-group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <Clock className="input-icon" size={18} />
                <div
                    className={`
                        glass-picker-input min-w-[180px]
                        ${isOpen ? 'is-open' : ''}
                        ${!value ? 'placeholder' : ''}
                    `}
                >
                    {value ? `${selectedHour}:${selectedMinute} ${period}` : placeholder}
                </div>
            </div>

            {isOpen && (
                <div className="glass-picker-dropdown">
                    <div className="flex gap-2 h-48">
                        {/* Hours Column */}
                        <div className="flex-1 overflow-y-auto max-h-48">
                            <div className="text-xs text-slate-500 text-center mb-2 font-medium sticky top-0 bg-surface py-1">Hour</div>
                            <div className="flex flex-col gap-1">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        onClick={(e) => { e.preventDefault(); handleHourSelect(h); }}
                                        className={`glass-picker-option ${selectedHour === h ? 'selected' : ''}`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px bg-white/10 my-2" />

                        {/* Minutes Column */}
                        <div className="flex-1 overflow-y-auto max-h-48">
                            <div className="text-xs text-slate-500 text-center mb-2 font-medium sticky top-0 bg-surface py-1">Min</div>
                            <div className="flex flex-col gap-1">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        onClick={(e) => { e.preventDefault(); handleMinuteSelect(m); }}
                                        className={`glass-picker-option ${selectedMinute === m ? 'selected' : ''}`}
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
            <input type="hidden" name={name} value={value} required={required} />
        </div>
    );
};

export default GlassTimePicker;

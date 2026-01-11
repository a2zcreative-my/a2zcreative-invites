'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface GlassDatePickerProps {
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    name: string;
    placeholder?: string;
    required?: boolean;
}

const GlassDatePicker: React.FC<GlassDatePickerProps> = ({ value, onChange, name, placeholder = 'Pilih Tarikh', required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                setCurrentMonth(date);
            }
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const onDateClick = (day: Date) => {
        const formattedDate = format(day, 'yyyy-MM-dd');
        setSelectedDate(day);
        onChange({ target: { name, value: formattedDate } });
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange({ target: { name, value: '' } });
        setSelectedDate(null);
        setIsOpen(false);
    };

    const handleToday = () => {
        onDateClick(new Date());
    };

    // --- Renders ---

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevMonth(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
                <ChevronLeft size={18} />
            </button>
            <div className="text-sm font-bold text-white tracking-wide">
                {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextMonth(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );

    const renderDays = () => {
        const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return (
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayLabels.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows: React.ReactNode[] = [];
        let days: React.ReactNode[] = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, 'd');
                const cloneDay = day;
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isDayToday = isToday(day);

                days.push(
                    <div
                        key={day.toString()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrentMonth) onDateClick(cloneDay);
                        }}
                        className={`
                            relative h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                            ${!isCurrentMonth
                                ? 'text-slate-700 cursor-default opacity-30'
                                : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                            }
                            ${isSelected
                                ? 'bg-gradient-to-br from-[#d4af37] to-[#b8972e] text-black font-bold shadow-lg shadow-amber-500/30'
                                : ''
                            }
                            ${isDayToday && !isSelected
                                ? 'ring-1 ring-[#d4af37] text-[#d4af37] font-semibold'
                                : ''
                            }
                        `}
                    >
                        {formattedDate}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="flex flex-col gap-1">{rows}</div>;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Input - Premium Glass Style */}
            <div
                className={`
                    group relative flex items-center w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
                    bg-slate-950/40 backdrop-blur-sm border
                    ${isOpen
                        ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                        : 'border-white/10 hover:border-white/20'
                    }
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`mr-3 transition-colors ${isOpen || value ? 'text-[#d4af37]' : 'text-slate-500'}`}>
                    <CalendarIcon size={18} />
                </div>
                <div className={`flex-1 text-base ${value ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {value ? format(new Date(value), 'dd/MM/yyyy') : placeholder}
                </div>
            </div>

            {/* Dropdown Calendar - SOLID DARK BACKGROUND & HIGH Z-INDEX */}
            {isOpen && (
                <div
                    className="
                        absolute top-full left-0 mt-2 w-full max-w-[320px] z-popover
                        p-4 rounded-xl bg-base border border-white/10
                        shadow-[0_20px_40px_-5px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)]
                        animate-in fade-in zoom-in-95 duration-200
                    "
                >
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleClear(); }}
                            className="text-slate-400 hover:text-white text-xs font-medium transition-colors uppercase tracking-wider"
                        >
                            Clear
                        </button>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setIsOpen(false); }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleToday(); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-gradient-to-br from-brand-gold to-[#b8972e] text-black"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input type="hidden" name={name} value={value} required={required} />
        </div>
    );
};

export default GlassDatePicker;

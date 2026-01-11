'use client';

import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
  parseISO
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Clock,
  MapPin,
  CheckCircle2,
  CircleDashed,
  Send
} from 'lucide-react';

// --- Types ---

export type CalendarEventStatus = 'scheduled' | 'posted' | 'draft';
export type CalendarEventCategory = 'edu' | 'promo' | 'event' | 'live' | 'reminder';

export interface CalendarEvent {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  title: string;
  category: CalendarEventCategory;
  status: CalendarEventStatus;
  time?: string;
}

interface GlassCalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

// --- Constants & Helpers ---

const CATEGORY_COLORS: Record<CalendarEventCategory, { bg: string; text: string; dot: string }> = {
  edu: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', dot: '#3b82f6' },      // Blue
  promo: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', dot: '#a855f7' },    // Purple
  event: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', dot: '#ec4899' },    // Pink
  live: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', dot: '#ef4444' },      // Red
  reminder: { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', dot: '#eab308' },  // Yellow/Gold
};

const STATUS_ICONS: Record<CalendarEventStatus, React.ReactNode> = {
  scheduled: <Clock size={12} className="text-blue-400" />,
  posted: <CheckCircle2 size={12} className="text-green-400" />,
  draft: <CircleDashed size={12} className="text-slate-400" />,
};

// --- Component ---

const GlassCalendar: React.FC<GlassCalendarProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    onDateSelect?.(today);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const getEventsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateString);
  };

  const renderHeader = () => {
    return (
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent w-full md:w-32 ml-4 hidden md:block" />
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Manage your content schedule
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-slate-900/40 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <button
            onClick={prevMonth}
            className="p-2.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gradient-to-r from-[var(--brand-gold)] to-[var(--brand-gold-dark)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>
    );
  };

  const renderDays = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="hidden md:grid grid-cols-7 mb-4 px-2">
        {days.map((day, i) => (
          <div key={day} className="text-slate-500 uppercase text-xs font-bold tracking-wider pl-2">
            <span className="hidden lg:inline">{day}</span>
            <span className="lg:hidden">{shortDays[i]}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const rows: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isDayToday = isToday(day);
        const dayEvents = getEventsForDate(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => {
              if (isCurrentMonth) {
                setSelectedDate(cloneDay);
                onDateSelect?.(cloneDay);
              }
            }}
            className={`
              relative min-h-[120px] md:min-h-[160px] p-2 md:p-3 transition-all duration-300 group
              border-b border-r border-white/[0.03]
              ${!isCurrentMonth ? 'bg-slate-900/30 opacity-40 hover:opacity-60 cursor-default' : 'cursor-pointer hover:bg-white/[0.02]'}
              ${isSelected ? 'bg-white/[0.04] backdrop-blur-sm' : ''}
              ${i === 0 ? 'border-l border-white/[0.03]' : ''} /* Left border for first col */
              ${day <= endDate && day >= addDays(endDate, -6) ? 'border-b-0' : ''} /* Remove bottom border for last row (approx) */
              first:rounded-tl-2xl last:rounded-br-2xl
            `}
          >
            {/* Day Number and Indicators */}
            <div className="flex justify-between items-start mb-2">
              <span className={`
                text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all
                ${isDayToday
                  ? 'bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-blue)] text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                  : isSelected ? 'bg-white/10 text-white' : 'text-slate-400 group-hover:text-slate-200'}
              `}>
                {formattedDate}
              </span>

              {/* Mobile View Dot Indicator if events exist */}
              {dayEvents.length > 0 && (
                <div className="md:hidden w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)]" />
              )}
            </div>

            {/* Events List (Desktop) */}
            <div className="hidden md:flex flex-col gap-1.5 overflow-hidden">
              {dayEvents.map((event) => {
                const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.event;
                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className="
                      relative px-2 py-1.5 rounded-lg border border-white/5 
                      bg-slate-900/40 hover:bg-slate-800/60
                      transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                      group/card overflow-hidden
                    "
                    style={{
                      borderLeft: `2px solid ${colors.dot}`
                    }}
                  >
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover/card:animate-[shimmer_1.5s_infinite]" />

                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <span className="truncate text-xs font-medium text-slate-200 leading-tight">
                        {event.title}
                      </span>
                      {STATUS_ICONS[event.status]}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 relative z-10">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/5"
                        style={{ color: colors.text }}
                      >
                        {event.category}
                      </span>
                      {event.time && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {event.time}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Events Indicator (Number) */}
            <div className="md:hidden mt-1 flex flex-wrap gap-1">
              {dayEvents.slice(0, 3).map((event, idx) => (
                <div key={idx} className="h-1 flex-1 rounded-full bg-slate-700"
                  style={{ backgroundColor: CATEGORY_COLORS[event.category].dot }}
                />
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return (
      <div className="
          bg-slate-950/20 backdrop-blur-xl rounded-3xl overflow-hidden 
          border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          relative
        ">
        {/* Calendar Grid Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--glass-bg)] to-transparent pointer-events-none" />
        <div className="relative z-10">
          {rows}
        </div>
      </div>
    );
  };

  const renderMobileList = () => {
    // Mobile View: Selected Day's Events List below calendar
    // In a real app, you might might hide the grid rows partially, but here we keep standard grid
    // and show a detail view below.
    const todaysEvents = getEventsForDate(selectedDate);
    const dayLabel = format(selectedDate, 'EEEE, MMMM do');

    return (
      <div className="md:hidden mt-6 pb-20">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-[var(--brand-gold)] rounded-full" />
          {dayLabel}
        </h3>

        {todaysEvents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-slate-500 italic">
            No events scheduled for this day
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {todaysEvents.map(event => {
              const colors = CATEGORY_COLORS[event.category];
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 flex flex-col gap-3 shadow-lg active:scale-95 transition-transform"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shadow-[0_0_8px]`} style={{ backgroundColor: colors.dot, boxShadow: `0 0 8px ${colors.dot}` }} />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{event.category}</span>
                    </div>
                    <div className="bg-slate-950/50 p-1 rounded-md border border-white/5">
                      {STATUS_ICONS[event.status]}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-lg leading-snug">{event.title}</h4>
                    {event.time && (
                      <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                        <Clock size={14} />
                        {event.time}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-1 border-t border-white/5 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[8px] text-white">
                          U{i}
                        </div>
                      ))}
                    </div>
                    <button className="text-xs text-[var(--neon-cyan)] flex items-center gap-1 font-medium">
                      View Details <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-7xl mx-auto p-2 md:p-6 ${className}`}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderMobileList()}
    </div>
  );
};

export default GlassCalendar;

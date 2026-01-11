'use client';

import React from 'react';
import GlassCalendar, { CalendarEvent } from '@/components/ui/GlassCalendar';
import GlassDatePicker from '@/components/ui/GlassDatePicker';
import { Sparkles } from 'lucide-react';

const SAMPLE_EVENTS: CalendarEvent[] = [
    {
        id: '1',
        date: new Date().toISOString().split('T')[0], // Today
        title: 'Product Launch Webinar',
        category: 'live',
        status: 'scheduled',
        time: '10:00 AM'
    },
    {
        id: '2',
        date: new Date().toISOString().split('T')[0], // Today
        title: 'Website Maintenance',
        category: 'edu',
        status: 'posted',
        time: '2:00 PM'
    },
    {
        id: '3',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        title: 'Instagram Promo Campaign',
        category: 'promo',
        status: 'draft',
        time: '9:00 AM'
    },
    {
        id: '5',
        date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // +5 days
        title: 'Client Meeting: A2Z Creative',
        category: 'event',
        status: 'scheduled',
        time: '11:30 AM'
    },
    {
        id: '4',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // +2 days
        title: 'Subscription Renewal',
        category: 'reminder',
        status: 'scheduled',
    },
];

export default function CalendarDemoPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-base)] text-white p-4 md:p-8 relative overflow-x-hidden">
            {/* Background Blobs - Borrowed from global style inspiration */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-cyan-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
                        <Sparkles className="text-[var(--brand-gold)]" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Calendar Component Demo</h1>
                        <p className="text-slate-400 text-sm">Validating responsive layout and glassmorphism styling</p>
                    </div>
                </div>


                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="md:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Monthly Schedule</h2>
                            <div className="w-64">
                                <GlassDatePicker
                                    name="demo-date"
                                    value={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => console.log('Date changed:', e.target.value)}
                                    placeholder="Fast Jump to Date"
                                />
                            </div>
                        </div>
                        <GlassCalendar
                            events={SAMPLE_EVENTS}
                            onEventClick={(e) => alert(`Clicked event: ${e.title}`)}
                            onDateSelect={(d) => console.log('Selected date:', d)}
                        />
                    </div>

                    <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 h-fit sticky top-6">
                        <h3 className="text-lg font-bold text-white mb-4">Date Picker Preview</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Redesigned date picker with premium glass effect, shadows, and smooth animations.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Default View</label>
                                <GlassDatePicker
                                    name="test-picker-1"
                                    value=""
                                    onChange={() => { }}
                                    placeholder="Select a date..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pre-selected</label>
                                <GlassDatePicker
                                    name="test-picker-2"
                                    value="2026-01-15"
                                    onChange={() => { }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}

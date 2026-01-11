'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface AgendaItem {
    id?: string;
    title: string;
    time: string;
    description?: string;
}

interface ItinerarySectionProps {
    agenda: AgendaItem[];
    primaryColor: string;
    eventType?: string;
}

/**
 * ItinerarySection - "ATUR CARA MAJLIS" schedule display
 * Shows event timeline with themed glassmorphism card
 */
export default function ItinerarySection({ agenda, primaryColor, eventType }: ItinerarySectionProps) {
    if (!agenda || agenda.length === 0) return null;

    // Get section title based on event type
    const getSectionTitle = () => {
        switch (eventType?.toLowerCase()) {
            case 'wedding':
                return 'Atur Cara Majlis';
            case 'birthday':
                return 'Aturcara';
            case 'corporate':
                return 'Event Schedule';
            case 'raya':
                return 'Atur Cara';
            default:
                return 'Atur Cara Majlis';
        }
    };

    return (
        <section id="itinerary" className="px-4 py-8">
            <div className="max-w-md mx-auto">

                {/* Section Header */}
                <h3
                    className="text-xl font-serif font-bold text-center mb-6 tracking-wide uppercase"
                    style={{ color: primaryColor }}
                >
                    {getSectionTitle()}
                </h3>

                {/* Itinerary Card */}
                <div
                    className="rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: `0 20px 40px -10px ${primaryColor}10`
                    }}
                >
                    <div className="space-y-6">
                        {agenda.map((item, index) => (
                            <div key={item.id || index} className="text-center">
                                {/* Title */}
                                <h4
                                    className="font-semibold text-sm tracking-wide mb-1"
                                    style={{ color: primaryColor }}
                                >
                                    {item.title}:
                                </h4>

                                {/* Time */}
                                <p className="text-white/90 font-serif text-lg italic">
                                    {item.time}
                                </p>

                                {/* Description (optional) */}
                                {item.description && (
                                    <p className="text-white/50 text-xs mt-1">
                                        {item.description}
                                    </p>
                                )}

                                {/* Divider between items (except last) */}
                                {index < agenda.length - 1 && (
                                    <div
                                        className="w-12 h-px mx-auto mt-6"
                                        style={{
                                            background: `linear-gradient(90deg, transparent, ${primaryColor}40, transparent)`
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

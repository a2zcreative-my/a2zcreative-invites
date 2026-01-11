'use client';

import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

interface Wish {
    id: string;
    name: string;
    message: string;
    createdAt?: string;
}

interface WishesSectionProps {
    wishes: Wish[];
    primaryColor: string;
    eventSlug: string;
    onWishSubmitted?: () => void;
}

/**
 * WishesSection - "UCAPAN" guest wishes display with form
 */
export default function WishesSection({ wishes, primaryColor, eventSlug, onWishSubmitted }: WishesSectionProps) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !message.trim()) {
            setError('Sila isi nama dan ucapan anda');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`/api/events/${eventSlug}/wishes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), message: message.trim() })
            });

            if (!response.ok) throw new Error('Failed to submit');

            setName('');
            setMessage('');
            setShowForm(false);
            onWishSubmitted?.();
        } catch (err) {
            setError('Gagal menghantar ucapan. Sila cuba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="wishes" className="px-4 py-8">
            <div className="max-w-md mx-auto">

                {/* Section Header */}
                <h3
                    className="text-xl font-serif font-bold text-center mb-6 tracking-wide uppercase"
                    style={{ color: primaryColor }}
                >
                    Ucapan
                </h3>

                {/* Wishes List */}
                {wishes.length > 0 && (
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {wishes.map((wish) => (
                            <div
                                key={wish.id}
                                className="p-4 rounded-xl backdrop-blur-sm transition-all hover:bg-white/5 group"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {/* Message */}
                                <p className="text-white/80 italic text-sm leading-relaxed mb-3 font-serif">
                                    "{wish.message}"
                                </p>
                                {/* Name */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-[1px] bg-white/10" />
                                    <p
                                        className="font-semibold text-xs uppercase tracking-wider"
                                        style={{ color: primaryColor }}
                                    >
                                        {wish.name}
                                    </p>
                                    <div className="w-4 h-[1px] bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {wishes.length === 0 && !showForm && (
                    <div className="text-center py-8">
                        <MessageCircle
                            size={32}
                            className="mx-auto mb-3 opacity-30"
                            style={{ color: primaryColor }}
                        />
                        <p className="text-white/40 text-sm">
                            Jadilah yang pertama memberikan ucapan!
                        </p>
                    </div>
                )}

                {/* Write Wish Button */}
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        style={{
                            background: `${primaryColor}20`,
                            border: `1px solid ${primaryColor}50`,
                            color: primaryColor
                        }}
                    >
                        <MessageCircle size={16} />
                        Tulis Ucapan
                    </button>
                )}

                {/* Wish Form */}
                {showForm && (
                    <div
                        className="rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {/* Glossy Sheen Overlay */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-white text-sm">Tulis Ucapan</h4>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-white/40 hover:text-white/70 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Input */}
                            <input
                                type="text"
                                placeholder="Nama anda"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                            />

                            {/* Message Input */}
                            <textarea
                                placeholder="Tulis ucapan anda..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                            />

                            {/* Error */}
                            {error && (
                                <p className="text-red-400 text-xs">{error}</p>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: primaryColor,
                                    color: '#000'
                                }}
                            >
                                {isSubmitting ? (
                                    'Menghantar...'
                                ) : (
                                    <>
                                        <Send size={14} />
                                        Hantar Ucapan
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </section >
    );
}

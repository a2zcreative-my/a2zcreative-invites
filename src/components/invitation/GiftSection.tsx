'use client';

import React, { useState } from 'react';
import { Gift, Copy, Check, CreditCard } from 'lucide-react';

interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

interface GiftSectionProps {
    bankAccounts: BankAccount[];
    primaryColor: string;
    eventType?: string;
}

/**
 * GiftSection - "HADIAH" bank account display for monetary gifts
 */
export default function GiftSection({ bankAccounts, primaryColor, eventType }: GiftSectionProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!bankAccounts || bankAccounts.length === 0) return null;

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Get section title based on event type
    const getSectionTitle = () => {
        switch (eventType?.toLowerCase()) {
            case 'wedding':
                return 'Salam Kaut';
            case 'birthday':
                return 'Hadiah';
            case 'corporate':
                return 'Contribution';
            default:
                return 'Hadiah';
        }
    };

    return (
        <section id="gift" className="px-4 py-8">
            <div className="max-w-md mx-auto">

                {/* Section Header */}
                <div className="text-center mb-6">
                    <Gift
                        size={28}
                        className="mx-auto mb-3"
                        style={{ color: primaryColor }}
                    />
                    <h3
                        className="text-xl font-serif font-bold tracking-wide uppercase"
                        style={{ color: primaryColor }}
                    >
                        {getSectionTitle()}
                    </h3>
                    <p className="text-white/50 text-xs mt-2">
                        Anda boleh menyalurkan sumbangan ke akaun di bawah
                    </p>
                </div>

                {/* Bank Accounts */}
                <div className="space-y-4">
                    {bankAccounts.map((account, index) => (
                        <div
                            key={index}
                            className="rounded-3xl p-6 backdrop-blur-xl text-center relative overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: `0 10px 30px -5px ${primaryColor}15`
                            }}
                        >
                            {/* Bank Name */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <CreditCard size={16} style={{ color: primaryColor }} />
                                <span className="text-white/70 text-sm font-medium">
                                    {account.bankName}
                                </span>
                            </div>

                            {/* Account Number */}
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <span className="text-white text-lg font-mono tracking-wider">
                                    {account.accountNumber}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(account.accountNumber, index)}
                                    className="p-1.5 rounded-lg transition-all hover:bg-white/10 active:scale-95"
                                    title="Salin nombor akaun"
                                >
                                    {copiedIndex === index ? (
                                        <Check size={16} className="text-green-400" />
                                    ) : (
                                        <Copy size={16} style={{ color: primaryColor }} />
                                    )}
                                </button>
                            </div>

                            {/* Account Holder */}
                            <p className="text-white/50 text-xs">
                                {account.accountHolder}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Thank You Note */}
                <p className="text-center text-white/30 text-xs mt-6 italic">
                    Terima kasih atas kemurahan hati anda 💝
                </p>
            </div >
        </section >
    );
}

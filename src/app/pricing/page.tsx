'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Sparkles, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Navbar from '../../components/Navbar';

const packages = [
    {
        name: 'Percuma',
        desc: 'Cuba dulu sebelum beli',
        price: 'RM0',
        period: '14 hari percubaan',
        popular: false,
        features: [
            { text: '10 tetamu maksimum', included: true },
            { text: '50 paparan', included: true },
            { text: 'Jemputan dengan watermark', included: true },
            { text: 'Kod QR check-in', included: false },
        ],
        ctaText: 'Cuba Percuma',
        ctaLink: '/create?package=free',
        ctaStyle: 'secondary',
    },
    {
        name: 'Asas',
        desc: 'Untuk majlis kecil',
        price: 'RM49',
        period: 'sekali bayar',
        popular: false,
        features: [
            { text: '100 tetamu maksimum', included: true },
            { text: '500 paparan', included: true },
            { text: 'Tiada watermark', included: true },
            { text: 'Kod QR untuk tetamu', included: true },
        ],
        ctaText: 'Pilih Asas',
        ctaLink: '/create?package=basic',
        ctaStyle: 'secondary',
    },
    {
        name: 'Popular',
        desc: 'Paling popular untuk majlis perkahwinan',
        price: 'RM99',
        period: 'sekali bayar',
        popular: true,
        features: [
            { text: '300 tetamu maksimum', included: true },
            { text: '2,000 paparan', included: true },
            { text: 'Tiada watermark', included: true },
            { text: 'Check-in QR scanner', included: true },
            { text: 'Eksport CSV', included: true },
        ],
        ctaText: 'Pilih Popular',
        ctaLink: '/create?package=popular',
        ctaStyle: 'primary',
    },
    {
        name: 'Bisnes',
        desc: 'Untuk event besar & korporat',
        price: 'RM199',
        period: 'sekali bayar',
        popular: false,
        features: [
            { text: '1,000 tetamu maksimum', included: true },
            { text: '10,000 paparan', included: true },
            { text: 'Semua ciri Premium', included: true },
            { text: 'Multiple events', included: true },
            { text: 'Sokongan prioriti', included: true },
        ],
        ctaText: 'Pilih Bisnes',
        ctaLink: '/create?package=business',
        ctaStyle: 'secondary',
    },
];

export default function PricingPage() {

    return (
        <div className="landing-page">
            {/* Navigation */}
            <Navbar />

            {/* Pricing Section */}
            <section className="pricing" style={{ paddingTop: '120px', minHeight: '100vh' }}>
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">
                            <Sparkles size={14} style={{ marginRight: '6px' }} />
                            Pakej
                        </span>
                    </div>

                    <div className="pricing-grid-landing">
                        {packages.map((pkg, index) => (
                            <GlassCard
                                key={index}
                                variant={pkg.popular ? 'featured' : 'default'}
                            >
                                {pkg.popular && <span className="popular-badge">Popular</span>}

                                <h3 className="package-name glass-text-title">{pkg.name}</h3>
                                <p className="package-desc glass-text-subtitle">{pkg.desc}</p>

                                <div className="package-price">
                                    <div className={`price-amount glass-text-price ${pkg.popular ? 'price-premium' : ''}`}>
                                        {pkg.price}
                                    </div>
                                    <div className="price-period glass-text-subtitle">{pkg.period}</div>
                                </div>

                                <ul className="package-features">
                                    {pkg.features.map((f, i) => (
                                        <li key={i} className={`glass-list-item ${!f.included ? 'disabled' : ''}`}>
                                            {f.included ?
                                                <Check size={16} className="glass-icon" /> :
                                                <X size={16} className="glass-icon" />
                                            }
                                            {f.text}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={pkg.ctaLink}
                                    className={`glass-btn ${pkg.ctaStyle === 'primary' ? 'glass-btn-premium' : 'glass-btn-default'}`}
                                >
                                    {pkg.ctaText}
                                </Link>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-bottom">
                        <p>© 2025 A2Z Creative. Hak cipta terpelihara.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

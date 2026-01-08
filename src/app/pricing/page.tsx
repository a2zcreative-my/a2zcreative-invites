'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Sparkles, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import GlassCard from '../../components/GlassCard';

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
    const [user, setUser] = useState<any>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedUser = localStorage.getItem('a2z_user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                } else {
                    try {
                        const response = await fetch('/api/auth/session');
                        if (response.ok) {
                            const data: any = await response.json();
                            if (data.user) setUser(data.user);
                        }
                    } catch (e) {
                        console.log('Session check failed');
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkAuth();
    }, []);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            localStorage.removeItem('a2z_user');
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            window.location.reload();
        } catch (e) {
            console.error('Logout error:', e);
        }
    };

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="nav scrolled" style={{ background: 'rgba(2, 6, 23, 0.95)' }}>
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <img src="/logo.png" alt="A2Z Creative" height="36" />
                        <span className="logo-text-gradient" style={{ fontSize: '1.25rem' }}>A2ZCreative</span>
                    </Link>
                    <div className="nav-links">
                        {!user ? (
                            <>
                                <Link href="/#features" className="nav-link">Ciri-ciri</Link>
                                <Link href="/#events" className="nav-link">Jenis Majlis</Link>
                                <Link href="/#pricing" className="nav-link">Harga</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/" className="nav-link">Utama</Link>
                                <Link href="/dashboard" className="nav-link">Dashboard</Link>
                            </>
                        )}

                        {!user ? (
                            <Link href="/auth/login" className="nav-link">Log Masuk</Link>
                        ) : (
                            <div
                                className="nav-user-menu"
                                style={{ display: 'flex', position: 'relative', cursor: 'pointer', alignItems: 'center', gap: '0.5rem' }}
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                ref={userMenuRef}
                            >
                                <span className="nav-user-name" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Hi, {user.name || user.email?.split('@')[0]}
                                </span>
                                <div className="nav-user-avatar" style={{ width: '36px', height: '36px', background: 'var(--brand-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--bg-base)', fontSize: '0.875rem' }}>
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                </div>

                                {isUserMenuOpen && (
                                    <div className="nav-user-dropdown" style={{ display: 'block', position: 'absolute', right: 0, top: '45px', background: 'var(--bg-elevated)', borderRadius: '12px', boxShadow: 'var(--shadow-glass)', minWidth: '180px', zIndex: 9999, border: '1px solid var(--border-glass)' }}>
                                        {(user.role === 'admin' || user.role === 'super_admin') && (
                                            <Link href="/dashboard/" style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                                                <LayoutDashboard size={18} style={{ marginRight: '10px' }} /> Dashboard
                                            </Link>
                                        )}
                                        <Link href="/create/" style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                                            <PlusCircle size={18} style={{ marginRight: '10px' }} /> Cipta Jemputan
                                        </Link>
                                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: '#ff6b6b', textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem' }}>
                                            <LogOut size={18} style={{ marginRight: '10px' }} /> Log Keluar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <Link href={user ? "/create/" : "/auth/register"} className="btn btn-primary nav-cta">
                            {user ? 'Cipta Jemputan' : 'Mula Sekarang'}
                        </Link>
                    </div>
                </div>
            </nav>

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

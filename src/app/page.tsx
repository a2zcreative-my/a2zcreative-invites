'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, LayoutDashboard, PlusCircle, LogOut, Eye, ChevronDown, Check, X, Rocket, Cpu, BarChart2, QrCode, Palette, MapPin, Heart, Building2, Users, Cake, TreePine } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Navbar from '../components/Navbar';
import LandingBackground from '../components/landing/LandingBackground';

export default function LandingPage() {
    const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
    const demoMenuRef = useRef<HTMLDivElement>(null);

    // Click Outside Handler for Demo Menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (demoMenuRef.current && !demoMenuRef.current.contains(event.target as Node)) {
                setIsDemoMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <LandingBackground>
            <div className="landing-page">
                {/* Navigation */}
                <Navbar />

                {/* Hero Section */}
                <section className="hero">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>

                    <div className="hero-content">
                        <div className="hero-badge">
                            <Sparkles size={16} />
                            <span>Baru dilancarkan — Tema Eksklusif 2025</span>
                        </div>

                        <h1 className="hero-title">
                            Jemputan Digital <span className="highlight">Profesional</span>
                            <br className="hidden sm:block" />
                            untuk Setiap Majlis
                        </h1>

                        <p className="hero-subtitle">
                            Cipta jemputan digital yang memukau dengan sistem RSVP pintar, daftar masuk QR,
                            dan analitik masa nyata. Sesuai untuk perkahwinan, korporat, dan majlis keluarga.
                        </p>

                        <div className="hero-cta" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '800px', margin: '0 auto', alignItems: 'stretch' }}>
                            <Link href="/pricing/" className="btn btn-primary btn-lg" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PlusCircle size={20} />
                                Cipta Jemputan
                            </Link>
                            <div className="relative" ref={demoMenuRef} style={{ width: '100%', display: 'flex' }}>
                                <button
                                    className="btn btn-secondary btn-lg"
                                    onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
                                    style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Eye size={20} />
                                    Lihat Demo
                                    <ChevronDown
                                        size={16}
                                        style={{ transition: 'transform 0.2s', marginLeft: '8px', transform: isDemoMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                    />
                                </button>

                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: '50%',
                                        transform: isDemoMenuOpen ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.95)',
                                        minWidth: '200px',
                                        background: 'rgba(10, 25, 47, 0.98)', // Keeping distinct dark bg for dropdown
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid var(--border-glow-gold)',
                                        borderRadius: '12px',
                                        padding: '8px',
                                        opacity: isDemoMenuOpen ? 1 : 0,
                                        visibility: isDemoMenuOpen ? 'visible' : 'hidden',
                                        transition: 'all 0.2s',
                                        zIndex: 1000,
                                        boxShadow: 'var(--shadow-glass-lg)'
                                    }}
                                >
                                    {[
                                        { icon: '💒', label: 'Perkahwinan', href: '/inv/demo-perkahwinan' },
                                        { icon: '🏢', label: 'Korporat', href: '/inv/demo-korporat' },
                                        { icon: '👨‍👩‍👧‍👦', label: 'Keluarga', href: '/inv/demo-keluarga' },
                                        { icon: '🎂', label: 'Hari Jadi', href: '/inv/demo-hari-jadi' },
                                        { icon: '🌿', label: 'Komuniti', href: '/inv/demo-komuniti' }
                                    ].map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 14px',
                                                color: '#ccd6f6',
                                                textDecoration: 'none',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-number">5,000+</div>
                                <div className="stat-label">Jemputan Dicipta</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">50,000+</div>
                                <div className="stat-label">Tetamu RSVP</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">99.9%</div>
                                <div className="stat-label">Uptime</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features" id="features">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-label">Ciri-ciri</span>
                            <h2 className="section-title">Semua yang Anda Perlukan</h2>
                            <p className="section-description">
                                Platform lengkap untuk menguruskan jemputan dan kehadiran tetamu dari mula hingga akhir.
                            </p>
                        </div>

                        <div className="features-grid">
                            <FeatureCard icon={<Cpu />} title="Mesra Mobile" description="Rekaan responsif yang sempurna di semua peranti — telefon, tablet, dan desktop." />
                            <FeatureCard icon={<Check />} title="RSVP Pintar" description="Sistem pengesahan kehadiran dengan notifikasi masa nyata dan pengiraan tetamu automatik." />
                            <FeatureCard icon={<BarChart2 />} title="Papan Pemuka" description="Pantau RSVP, daftar masuk, dan statistik kehadiran dalam satu tempat." />
                            <FeatureCard icon={<QrCode />} title="Imbas QR" description="Daftar masuk tetamu dengan pantas menggunakan kod QR unik. Tiada barisan panjang." />
                            <FeatureCard icon={<Palette />} title="Tema Eksklusif" description="Pilih dari koleksi tema profesional atau sesuaikan mengikut warna majlis anda." />
                            <FeatureCard icon={<MapPin />} title="Integrasi Peta" description="Google Maps dan Waze terus dari jemputan. Tetamu tak sesat ke lokasi majlis." />
                        </div>
                    </div>
                </section>

                {/* Event Types Section */}
                <section className="event-types" id="events">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-label">Jenis Majlis</span>
                            <h2 className="section-title">Satu Platform, Pelbagai Majlis</h2>
                            <p className="section-description">
                                Dari perkahwinan intim hingga konferens korporat besar — kami ada penyelesaiannya.
                            </p>
                        </div>

                        <div className="event-grid">
                            <EventCard icon={Heart} title="Perkahwinan" desc="Tema romantik dengan RSVP, ucapan tetamu, dan galeri foto." />
                            <EventCard icon={Building2} title="Korporat" desc="Seminar, AGM, majlis makan malam syarikat dengan daftar masuk QR." />
                            <EventCard icon={Users} title="Keluarga" desc="Kenduri, aqiqah, reunion — kumpul keluarga dengan mudah." />
                            <EventCard icon={Cake} title="Hari Jadi" desc="Tema ceria untuk sambutan ulang tahun yang meriah." />
                            <EventCard icon={TreePine} title="Komuniti" desc="Gotong-royong, hari sukan, atau aktiviti kemasyarakatan." />
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="how-it-works" id="how-it-works">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-label">Cara Penggunaan</span>
                            <h2 className="section-title">Mudah Seperti 1-2-3</h2>
                            <p className="section-description">
                                Cipta jemputan dalam beberapa minit sahaja. Tiada kemahiran teknikal diperlukan.
                            </p>
                        </div>

                        <div className="steps">
                            <Step number="1" title="Pilih Jenis Majlis" description="Pilih dari Perkahwinan, Korporat, Keluarga, atau lain-lain. Sistem akan memberikan tema yang sesuai." />
                            <Step number="2" title="Isi Maklumat & Sesuaikan" description="Masukkan butiran majlis, pilih warna tema, dan tambah mesej peribadi. Pratonton dalam masa nyata." />
                            <Step number="3" title="Kongsi & Urus" description="Dapatkan pautan unik dan kod QR. Kongsi melalui WhatsApp. Pantau RSVP dari papan pemuka." />
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="pricing" id="pricing">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-label">Harga</span>
                            <h2 className="section-title">Pakej Berpatutan</h2>
                            <p className="section-description">
                                Pilih pakej yang sesuai untuk majlis anda. Sekali bayar, tiada yuran tersembunyi.
                            </p>
                        </div>

                        <div className="pricing-grid-landing">
                            <PricingCard
                                name="Percuma"
                                desc="Cuba dulu sebelum beli"
                                price="RM0"
                                period="14 hari percubaan"
                                features={[
                                    { text: "10 tetamu maksimum", included: true },
                                    { text: "50 paparan", included: true },
                                    { text: "Jemputan dengan watermark", included: true },
                                    { text: "Kod QR check-in", included: false }
                                ]}
                                ctaText="Cuba Percuma"
                                ctaLink="/create/?package=free"
                                ctaStyle="secondary"
                            />
                            <PricingCard
                                name="Asas"
                                desc="Untuk majlis kecil"
                                price="RM49"
                                period="sekali bayar"
                                features={[
                                    { text: "100 tetamu maksimum", included: true },
                                    { text: "500 paparan", included: true },
                                    { text: "Tiada watermark", included: true },
                                    { text: "Kod QR untuk tetamu", included: true }
                                ]}
                                ctaText="Pilih Asas"
                                ctaLink="/create/?package=basic"
                                ctaStyle="secondary"
                            />
                            <PricingCard
                                name="Popular"
                                desc="Paling popular untuk majlis perkahwinan"
                                price="RM99"
                                period="sekali bayar"
                                popular
                                features={[
                                    { text: "300 tetamu maksimum", included: true },
                                    { text: "2,000 paparan", included: true },
                                    { text: "Tiada watermark", included: true },
                                    { text: "Check-in QR scanner", included: true },
                                    { text: "Eksport CSV", included: true }
                                ]}
                                ctaText="Pilih Popular"
                                ctaLink="/create/?package=popular"
                                ctaStyle="primary"
                                icon={<i data-lucide="crown"></i>} // Handled by CSS/Icon component
                            />
                            <PricingCard
                                name="Bisnes"
                                desc="Untuk event besar & korporat"
                                price="RM199"
                                period="sekali bayar"
                                features={[
                                    { text: "1,000 tetamu maksimum", included: true },
                                    { text: "10,000 paparan", included: true },
                                    { text: "Semua ciri Premium", included: true },
                                    { text: "Multiple events", included: true },
                                    { text: "Sokongan prioriti", included: true }
                                ]}
                                ctaText="Pilih Bisnes"
                                ctaLink="/create/?package=business"
                                ctaStyle="secondary"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="cta">
                    <div className="container">
                        <h2 className="cta-title">Sedia untuk Mula?</h2>
                        <p className="cta-description">
                            Cipta jemputan digital pertama anda secara percuma. Tiada kad kredit diperlukan.
                        </p>
                        <Link href="/pricing/" className="btn btn-primary btn-lg">
                            <Rocket size={20} />
                            Mula Sekarang — Percuma
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer">
                    {/* Footer content remains same but might need transparent bg adjustment in CSS */}
                    <div className="container">
                        <div className="footer-content">
                            <div className="footer-brand">
                                <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src="/logo.png" alt="A2Z Creative" height="40" style={{ height: '40px', width: 'auto' }} />
                                    <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                                </div>
                                <p className="footer-description">
                                    Platform jemputan digital dan pengurusan kehadiran untuk majlis anda.
                                    Dipercayai oleh ribuan pengguna di Malaysia.
                                </p>
                            </div>

                            <div className="footer-links">
                                <h5>Pautan</h5>
                                <ul>
                                    <li><Link href="#features">Ciri-ciri</Link></li>
                                    <li><Link href="#events">Jenis Majlis</Link></li>
                                    <li><Link href="#how-it-works">Cara Penggunaan</Link></li>
                                    <li><Link href="#pricing">Harga</Link></li>
                                </ul>
                            </div>

                            <div className="footer-links">
                                <h5>Sokongan</h5>
                                <ul>
                                    <li><Link href="/help">Pusat Bantuan</Link></li>
                                    <li><Link href="/contact">Hubungi Kami</Link></li>
                                    <li><a href="https://wa.me/60123834821" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                                </ul>
                            </div>

                            <div className="footer-links">
                                <h5>Undang-undang</h5>
                                <ul>
                                    <li><Link href="/privacy">Privasi</Link></li>
                                    <li><Link href="/terms">Terma & Syarat</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="footer-bottom">
                            <p>&copy; 2025 A2Z Creative Enterprise (CA0391903-U). Semua hak terpelihara.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </LandingBackground>
    );
}

// Helper Components
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="feature-card">
            <div className="feature-icon">{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
        </div>
    );
}

function EventCard({ icon: Icon, title, desc }: { icon: React.ComponentType<any>, title: string, desc: string }) {
    return (
        <div className="event-card">
            <div className="event-icon-wrap">
                <Icon className="event-icon" />
            </div>
            <h3 className="event-name">{title}</h3>
            <p className="event-desc">{desc}</p>
        </div>
    );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
    return (
        <div className="step">
            <div className="step-number">{number}</div>
            <div className="step-content">
                <h4>{title}</h4>
                <p>{description}</p>
            </div>
        </div>
    );
}

function PricingCard({ name, desc, price, period, features, ctaText, ctaLink, ctaStyle, popular, icon }: any) {
    return (
        <GlassCard
            variant={popular ? 'featured' : 'default'}
            className={popular ? 'transform scale-105' : ''}
        >
            {popular && <span className="popular-badge">Popular</span>}
            <h3 className="package-name glass-text-title">{name}</h3>
            <p className="package-desc glass-text-subtitle">{desc}</p>

            <div className="package-price">
                <div className="price-amount glass-text-price">{price}</div>
                <div className="price-period glass-text-subtitle">{period}</div>
            </div>

            <ul className="package-features">
                {features.map((f: any, i: number) => (
                    <li key={i} className={`glass-list-item ${!f.included ? 'disabled' : ''}`}>
                        {f.included ?
                            <Check size={16} className="glass-icon" /> :
                            <X size={16} className="glass-icon" style={{ opacity: 0.5 }} />
                        }
                        {f.text}
                    </li>
                ))}
            </ul>

            <Link
                href={ctaLink}
                className={`glass-btn ${ctaStyle === 'primary' ? 'glass-btn-premium' : 'glass-btn-default'}`}
            >
                {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
                {ctaText}
            </Link>
        </GlassCard>
    );
}

'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, Clock } from 'lucide-react';

// Demo invitation data
const demoInvitations: Record<string, any> = {
    'demo-perkahwinan': {
        type: 'Perkahwinan',
        icon: '💒',
        title: 'Majlis Perkahwinan',
        couple: 'Ahmad & Siti',
        date: '15 Mac 2025',
        time: '11:00 pagi - 4:00 petang',
        venue: 'Dewan Seri Kenanga',
        address: 'Jalan Bunga Raya, Shah Alam',
        message: 'Dengan segala hormatnya, kami menjemput Tuan/Puan ke majlis perkahwinan anak kami.',
    },
    'demo-korporat': {
        type: 'Korporat',
        icon: '🏢',
        title: 'Annual Gala Dinner 2025',
        couple: 'Syarikat ABC Sdn Bhd',
        date: '20 April 2025',
        time: '7:00 malam - 11:00 malam',
        venue: 'Grand Ballroom, Hotel Marriott',
        address: 'Kuala Lumpur City Centre',
        message: 'You are cordially invited to our Annual Gala Dinner.',
    },
    'demo-keluarga': {
        type: 'Keluarga',
        icon: '👨‍👩‍👧‍👦',
        title: 'Kenduri Kesyukuran',
        couple: 'Keluarga Encik Razak',
        date: '5 Mei 2025',
        time: '12:00 tengahari - 5:00 petang',
        venue: 'Rumah Keluarga',
        address: 'Kampung Seri Menanti, Negeri Sembilan',
        message: 'Kami menjemput saudara-mara dan sahabat handai ke majlis kenduri kesyukuran kami.',
    },
    'demo-hari-jadi': {
        type: 'Hari Jadi',
        icon: '🎂',
        title: 'Sambutan Ulangtahun ke-7',
        couple: 'Adik Aisyah',
        date: '10 Jun 2025',
        time: '3:00 petang - 6:00 petang',
        venue: 'Funland Kids Party',
        address: 'IOI City Mall, Putrajaya',
        message: 'Jom raikan hari istimewa Adik Aisyah bersama-sama!',
    },
    'demo-komuniti': {
        type: 'Komuniti',
        icon: '🌿',
        title: 'Gotong-Royong Perdana',
        couple: 'Persatuan Penduduk Taman Maju',
        date: '25 Jun 2025',
        time: '7:00 pagi - 12:00 tengahari',
        venue: 'Taman Permainan Taman Maju',
        address: 'Taman Maju, Petaling Jaya',
        message: 'Mari bersama-sama menjayakan aktiviti gotong-royong kawasan kita.',
    },
};

export default function InvitationDemoClient({ slug }: { slug: string }) {
    const demo = demoInvitations[slug];

    if (!demo) {
        return (
            <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="auth-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <h2>Demo Tidak Dijumpai</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Maaf, demo jemputan ini tidak wujud.
                    </p>
                    <Link href="/" className="btn btn-primary">
                        <ArrowLeft size={18} />
                        Kembali ke Laman Utama
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page" style={{ minHeight: '100vh', padding: '2rem' }}>
            {/* Back Button */}
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <ArrowLeft size={18} />
                    Kembali ke Laman Utama
                </Link>
            </div>

            {/* Invitation Card */}
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{demo.icon}</div>
                <span className="section-label">{demo.type}</span>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{demo.title}</h1>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--brand-gold)', marginBottom: '2rem' }}>{demo.couple}</h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.8' }}>
                    {demo.message}
                </p>

                <div style={{ display: 'grid', gap: '1rem', textAlign: 'left', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <CalendarDays size={20} style={{ color: 'var(--brand-gold)' }} />
                        <span>{demo.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <Clock size={20} style={{ color: 'var(--brand-gold)' }} />
                        <span>{demo.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <MapPin size={20} style={{ color: 'var(--brand-gold)' }} />
                        <div>
                            <div>{demo.venue}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{demo.address}</div>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Ini adalah contoh jemputan demo. Cipta jemputan anda sendiri!
                    </p>
                    <Link href="/pricing" className="btn btn-primary btn-lg">
                        Cipta Jemputan Sekarang
                    </Link>
                </div>
            </div>
        </div>
    );
}

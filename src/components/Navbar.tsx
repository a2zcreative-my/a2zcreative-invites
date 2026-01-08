'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
    customLinks?: { label: string; href: string; onClick?: () => void }[];
}

export default function Navbar({ customLinks }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();

    const userMenuRef = useRef<HTMLDivElement>(null);

    // Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click Outside Handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const displayName = user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
    const avatarChar = displayName ? displayName.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('').slice(0, 2) : (user?.email?.charAt(0).toUpperCase() || 'U');
    const showCta = !pathname?.startsWith('/create') && !pathname?.startsWith('/pricing');

    return (
        <nav className={`nav ${isScrolled ? 'scrolled' : ''}`} id="nav">
            <div className="nav-container">
                <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="A2Z Creative" height="36" />
                    <span className="logo-text-gradient" style={{ fontSize: '1.25rem' }}>A2ZCreative</span>
                </Link>
                <div className={`nav-links ${isMobileNavOpen ? 'active' : ''}`}>
                    {customLinks ? (
                        customLinks.map((link, index) => (
                            <Link key={index} href={link.href} className="nav-link" onClick={link.onClick}>
                                {link.label}
                            </Link>
                        ))
                    ) : (
                        <>
                            <Link href="/#features" className="nav-link">Ciri-ciri</Link>
                            <Link href="/#events" className="nav-link">Jenis Majlis</Link>
                            <Link href="/pricing" className="nav-link">Harga</Link>
                            <Link href="/#how-it-works" className="nav-link">Cara Guna</Link>
                        </>
                    )}

                    {!user ? (
                        <a href="/auth/login" className="nav-link">Log Masuk</a>
                    ) : (
                        <div
                            className="nav-user-menu"
                            style={{ display: 'flex', position: 'relative', cursor: 'pointer', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            ref={userMenuRef}
                        >
                            <div className="nav-user-avatar" style={{ width: '36px', height: '36px', background: 'var(--brand-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--bg-base)', fontSize: '0.875rem' }}>
                                {avatarChar}
                            </div>

                            {isUserMenuOpen && (
                                <div className="nav-user-dropdown" style={{ display: 'block', position: 'absolute', right: 0, top: '45px', background: 'var(--bg-elevated)', borderRadius: '12px', boxShadow: 'var(--shadow-glass)', minWidth: '180px', zIndex: 9999, border: '1px solid var(--border-glass)' }}>
                                    {(user.role === 'admin' || user.role === 'super_admin') && (
                                        <Link href="/dashboard/" style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                                            <LayoutDashboard size={18} style={{ marginRight: '10px' }} /> Dashboard
                                        </Link>
                                    )}
                                    <Link href="/pricing/" style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                                        <PlusCircle size={18} style={{ marginRight: '10px' }} /> Cipta Jemputan
                                    </Link>
                                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 18px', background: 'none', border: 'none', color: '#ff6b6b', textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem' }}>
                                        <LogOut size={18} style={{ marginRight: '10px' }} /> Log Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showCta && (
                        <Link href="/pricing/" className="btn btn-primary nav-cta">
                            {user ? 'Cipta Jemputan' : 'Mula Sekarang'}
                        </Link>
                    )}
                </div>
                <button
                    className="nav-toggle"
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                    aria-label="Toggle navigation"
                >
                    <Menu size={24} />
                </button>
            </div>

            <style jsx>{`
                .nav-toggle {
                    display: none;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                }
                
                @media (max-width: 900px) {
                    .nav-toggle {
                        display: block;
                    }
                    
                    .nav-links {
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: var(--bg-surface);
                        flex-direction: column;
                        padding: 1.5rem;
                        gap: 1rem;
                        border-bottom: 1px solid var(--border-glass);
                        backdrop-filter: blur(20px);
                    }
                    
                    .nav-links.active {
                        display: flex;
                    }
                    
                    .nav-cta {
                        width: 100%;
                        text-align: center;
                        margin-top: 0.5rem;
                    }
                }
            `}</style>
        </nav>
    );
}

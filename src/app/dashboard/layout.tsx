'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, LayoutDashboard, QrCode, LogOut, Menu, X, Shield } from 'lucide-react';

interface UserSession {
    role: string;
    email: string;
    name: string;
    userId: number;
}

// Navigation items per role
const NAV_ITEMS = {
    super_admin: [
        { path: '/dashboard/godeyes', label: "God's Eye", icon: Eye },
        { path: '/dashboard/admin', label: 'Admin', icon: LayoutDashboard },
        { path: '/dashboard/agent', label: 'Agent', icon: QrCode },
    ],
    admin: [
        { path: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
    event_admin: [
        { path: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
    agent: [
        { path: '/dashboard/agent', label: 'Check-in', icon: QrCode },
    ],
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [session, setSession] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch session on mount
    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch('/api/auth/validate-session');
                if (res.ok) {
                    const data = await res.json();
                    if (data.valid) {
                        setSession({
                            role: data.role,
                            email: data.email,
                            name: data.name,
                            userId: data.userId,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch session:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSession();
    }, []);

    // Determine if super_admin is in monitor mode (viewing other dashboard)
    const isMonitorMode = session?.role === 'super_admin' &&
        (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/agent'));

    // Get nav items for current role
    const navItems = session?.role ? (NAV_ITEMS[session.role as keyof typeof NAV_ITEMS] || []) : [];

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            {/* Monitor Mode Banner */}
            {isMonitorMode && (
                <div className="monitor-banner">
                    <Shield size={16} />
                    <span>Viewing as SUPER_ADMIN (Monitor Mode)</span>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link href="/" className="sidebar-logo">
                        <img src="/logo.png" alt="A2Z Creative" height="32" style={{ height: '32px', width: 'auto' }} />
                        <span className="logo-text-gradient">A2ZCreative</span>
                    </Link>
                    <button
                        className="mobile-menu-close"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {(session?.name || session?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{session?.name || 'User'}</span>
                            <span className="user-role">{session?.role}</span>
                        </div>
                    </div>
                    <Link href="/api/auth/logout" className="logout-btn">
                        <LogOut size={18} />
                        <span>Log Keluar</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="dashboard-mobile-header">
                <button
                    className="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <Menu size={24} />
                </button>
                <Link href="/" className="mobile-logo">
                    <img src="/logo.png" alt="A2Z Creative" height="28" style={{ height: '28px', width: 'auto' }} />
                </Link>
            </header>

            {/* Main Content */}
            <main className="dashboard-content">
                {children}
            </main>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <style jsx>{`
                .dashboard-layout {
                    display: flex;
                    min-height: 100vh;
                    background: var(--bg-base);
                }

                .monitor-banner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    background: linear-gradient(90deg, #f59e0b, #d97706);
                    color: #000;
                    padding: 0.5rem 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .dashboard-sidebar {
                    width: 260px;
                    background: var(--bg-surface);
                    border-right: 1px solid var(--border-glass);
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    z-index: 100;
                }

                .sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border-glass);
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-decoration: none;
                }

                .mobile-menu-close {
                    display: none;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }

                .sidebar-nav {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-lg);
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .nav-item:hover {
                    background: var(--glass-bg-light);
                    color: var(--text-primary);
                }

                .nav-item.active {
                    background: var(--glass-bg-medium);
                    color: var(--brand-gold);
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-glass);
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--brand-gold);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: var(--bg-base);
                }

                .user-details {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    color: var(--text-primary);
                    font-weight: 500;
                }

                .user-role {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    text-transform: capitalize;
                }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-lg);
                    color: var(--text-muted);
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .dashboard-mobile-header {
                    display: none;
                }

                .dashboard-content {
                    flex: 1;
                    margin-left: 260px;
                    padding: 2rem;
                    min-height: 100vh;
                }

                .dashboard-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    color: var(--text-secondary);
                }

                .mobile-overlay {
                    display: none;
                }

                @media (max-width: 768px) {
                    .dashboard-sidebar {
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                    }

                    .dashboard-sidebar.open {
                        transform: translateX(0);
                    }

                    .mobile-menu-close {
                        display: block;
                    }

                    .dashboard-mobile-header {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: var(--bg-surface);
                        border-bottom: 1px solid var(--border-glass);
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 50;
                    }

                    .mobile-menu-toggle {
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        cursor: pointer;
                    }

                    .dashboard-content {
                        margin-left: 0;
                        margin-top: 60px;
                        padding: 1rem;
                    }

                    .mobile-overlay {
                        display: block;
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 99;
                    }
                }
            `}</style>
        </div>
    );
}

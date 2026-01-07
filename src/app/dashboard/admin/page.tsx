'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Users, Eye, Plus, Settings, ExternalLink } from 'lucide-react';

interface Event {
    id: number;
    event_name: string;
    event_date: string;
    status: string;
    public_slug: string;
    guest_count: number;
    confirmed_count: number;
    view_count: number;
}

/**
 * Admin Dashboard - Event Management
 * For admin and event_admin roles
 */
export default function AdminDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events');
                if (!res.ok) throw new Error('Failed to fetch events');
                const data = await res.json();
                setEvents(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchEvents();
    }, []);

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="loading">Loading your events...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1>Dashboard Admin</h1>
                        <p>Urus semua jemputan anda</p>
                    </div>
                </div>
                <Link href="/pricing" className="btn-create">
                    <Plus size={20} />
                    Cipta Jemputan Baru
                </Link>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {events.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} />
                    <h2>Tiada jemputan lagi</h2>
                    <p>Mula dengan mencipta jemputan digital pertama anda.</p>
                    <Link href="/pricing" className="btn-primary">
                        <Plus size={20} />
                        Cipta Jemputan
                    </Link>
                </div>
            ) : (
                <div className="events-grid">
                    {events.map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-header">
                                <h3>{event.event_name}</h3>
                                <span className={`status ${event.status}`}>{event.status}</span>
                            </div>
                            <div className="event-date">
                                <Calendar size={16} />
                                <span>{new Date(event.event_date).toLocaleDateString('ms-MY')}</span>
                            </div>
                            <div className="event-stats">
                                <div className="stat">
                                    <Users size={16} />
                                    <span>{event.confirmed_count}/{event.guest_count} tetamu</span>
                                </div>
                                <div className="stat">
                                    <Eye size={16} />
                                    <span>{event.view_count} paparan</span>
                                </div>
                            </div>
                            <div className="event-actions">
                                <Link href={`/inv/${event.public_slug}`} className="btn-view" target="_blank">
                                    <ExternalLink size={16} />
                                    Lihat
                                </Link>
                                <Link href={`/dashboard/admin/events/${event.id}`} className="btn-manage">
                                    <Settings size={16} />
                                    Urus
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .dashboard-page {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-icon {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--brand-gold), #f59e0b);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--bg-base);
                }

                .page-header h1 {
                    font-size: 1.75rem;
                    color: var(--text-primary);
                    margin: 0;
                }

                .page-header p {
                    color: var(--text-muted);
                    margin: 0;
                }

                .btn-create {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--brand-gold);
                    color: var(--bg-base);
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-create:hover {
                    background: var(--brand-gold-light);
                }

                .error-banner {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                }

                .empty-state svg {
                    color: var(--text-muted);
                    margin-bottom: 1rem;
                }

                .empty-state h2 {
                    color: var(--text-primary);
                    margin: 0 0 0.5rem 0;
                }

                .empty-state p {
                    color: var(--text-muted);
                    margin: 0 0 1.5rem 0;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--brand-gold);
                    color: var(--bg-base);
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                }

                .events-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .event-card {
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .event-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .event-header h3 {
                    color: var(--text-primary);
                    font-size: 1.125rem;
                    margin: 0;
                }

                .status {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                .status.active {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }

                .status.draft {
                    background: rgba(156, 163, 175, 0.2);
                    color: #9ca3af;
                }

                .event-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }

                .event-stats {
                    display: flex;
                    gap: 1.5rem;
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .event-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-glass);
                }

                .btn-view, .btn-manage {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .btn-view {
                    background: var(--glass-bg);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-glass);
                }

                .btn-view:hover {
                    background: var(--glass-bg-medium);
                }

                .btn-manage {
                    background: var(--brand-gold);
                    color: var(--bg-base);
                }

                .btn-manage:hover {
                    background: var(--brand-gold-light);
                }

                .loading {
                    text-align: center;
                    padding: 4rem;
                    color: var(--text-muted);
                }
            `}</style>
        </div>
    );
}

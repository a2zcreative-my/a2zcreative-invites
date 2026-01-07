'use client';

import { useEffect, useState } from 'react';
import { Eye, Users, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlatformStats {
    totalUsers: number;
    totalEvents: number;
    activeEvents: number;
    totalGuests: number;
    totalRSVPs: number;
    recentActivity: ActivityItem[];
}

interface ActivityItem {
    type: string;
    message: string;
    time: string;
}

/**
 * God's Eye Dashboard - Super Admin Only
 * Platform-wide monitoring and analytics
 */
export default function GodEyesDashboard() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/platform-stats');
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="loading">Loading platform stats...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div className="header-icon">
                    <Eye size={32} />
                </div>
                <div>
                    <h1>God&apos;s Eye</h1>
                    <p>Platform-wide monitoring dashboard</p>
                </div>
            </header>

            {error && (
                <div className="error-banner">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon users">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.totalUsers || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon events">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.totalEvents || 0}</span>
                        <span className="stat-label">Total Events</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon active">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.activeEvents || 0}</span>
                        <span className="stat-label">Active Events</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon growth">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.totalRSVPs || 0}</span>
                        <span className="stat-label">Total RSVPs</span>
                    </div>
                </div>
            </div>

            <section className="activity-section">
                <h2>Recent Platform Activity</h2>
                <div className="activity-list">
                    {stats?.recentActivity?.length ? (
                        stats.recentActivity.map((item, i) => (
                            <div key={i} className="activity-item">
                                <span className="activity-type">{item.type}</span>
                                <span className="activity-message">{item.message}</span>
                                <span className="activity-time">{item.time}</span>
                            </div>
                        ))
                    ) : (
                        <p className="no-activity">No recent activity</p>
                    )}
                </div>
            </section>

            <style jsx>{`
                .dashboard-page {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .header-icon {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
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

                .error-banner {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 1rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon.users { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
                .stat-icon.events { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
                .stat-icon.active { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .stat-icon.growth { background: rgba(249, 115, 22, 0.2); color: #f97316; }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-label {
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }

                .activity-section {
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .activity-section h2 {
                    font-size: 1.25rem;
                    color: var(--text-primary);
                    margin: 0 0 1rem 0;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: var(--glass-bg);
                    border-radius: 8px;
                }

                .activity-type {
                    background: var(--brand-gold);
                    color: var(--bg-base);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .activity-message {
                    flex: 1;
                    color: var(--text-secondary);
                }

                .activity-time {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                }

                .no-activity {
                    color: var(--text-muted);
                    text-align: center;
                    padding: 2rem;
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

'use client';

import { useEffect, useState } from 'react';
import { QrCode, Users, CheckCircle, Clock, Scan } from 'lucide-react';

interface AssignedEvent {
    id: number;
    event_name: string;
    event_date: string;
    venue_name: string;
    total_guests: number;
    checked_in: number;
}

/**
 * Agent Dashboard - Check-in Operations
 * For agent role (and super_admin in monitor mode)
 */
export default function AgentDashboard() {
    const [events, setEvents] = useState<AssignedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scannerActive, setScannerActive] = useState(false);

    useEffect(() => {
        async function fetchAssignedEvents() {
            try {
                // Agent gets their assigned events
                const res = await fetch('/api/agent/events');
                if (!res.ok) {
                    // If API doesn't exist yet, show empty state
                    if (res.status === 404) {
                        setEvents([]);
                        return;
                    }
                    throw new Error('Failed to fetch events');
                }
                const data = await res.json();
                setEvents(data);
            } catch (err: any) {
                // Don't show error for missing API
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAssignedEvents();
    }, []);

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="loading">Loading check-in dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div className="header-icon">
                    <QrCode size={32} />
                </div>
                <div>
                    <h1>Check-in Agent</h1>
                    <p>Scan dan urus kehadiran tetamu</p>
                </div>
            </header>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button
                    className={`action-btn scanner ${scannerActive ? 'active' : ''}`}
                    onClick={() => setScannerActive(!scannerActive)}
                >
                    <Scan size={24} />
                    <span>{scannerActive ? 'Tutup Scanner' : 'Buka QR Scanner'}</span>
                </button>
            </div>

            {/* Scanner Modal */}
            {scannerActive && (
                <div className="scanner-container">
                    <div className="scanner-box">
                        <div className="scanner-frame">
                            <div className="corner tl"></div>
                            <div className="corner tr"></div>
                            <div className="corner bl"></div>
                            <div className="corner br"></div>
                            <div className="scan-line"></div>
                        </div>
                        <p>Arahkan kamera ke kod QR tetamu</p>
                    </div>
                </div>
            )}

            {/* Assigned Events */}
            <section className="events-section">
                <h2>Event Aktif Hari Ini</h2>
                {events.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} />
                        <h3>Tiada event aktif</h3>
                        <p>Anda akan melihat event yang ditugaskan di sini.</p>
                    </div>
                ) : (
                    <div className="events-list">
                        {events.map((event) => (
                            <div key={event.id} className="event-card">
                                <div className="event-info">
                                    <h3>{event.event_name}</h3>
                                    <p>{event.venue_name}</p>
                                    <span className="event-date">
                                        {new Date(event.event_date).toLocaleDateString('ms-MY')}
                                    </span>
                                </div>
                                <div className="checkin-stats">
                                    <div className="stat">
                                        <Users size={20} />
                                        <span className="value">{event.total_guests}</span>
                                        <span className="label">Dijemput</span>
                                    </div>
                                    <div className="stat checked">
                                        <CheckCircle size={20} />
                                        <span className="value">{event.checked_in}</span>
                                        <span className="label">Hadir</span>
                                    </div>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress"
                                        style={{ width: `${(event.checked_in / event.total_guests) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style jsx>{`
                .dashboard-page {
                    max-width: 800px;
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
                    background: linear-gradient(135deg, #22c55e, #16a34a);
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

                .quick-actions {
                    margin-bottom: 2rem;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 1.25rem;
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.125rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
                }

                .action-btn.active {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                }

                .scanner-container {
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .scanner-box {
                    text-align: center;
                }

                .scanner-frame {
                    width: 250px;
                    height: 250px;
                    position: relative;
                    margin: 0 auto 1rem;
                    background: var(--bg-dark);
                    border-radius: 8px;
                }

                .corner {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    border: 3px solid #22c55e;
                }

                .tl { top: 0; left: 0; border-right: none; border-bottom: none; }
                .tr { top: 0; right: 0; border-left: none; border-bottom: none; }
                .bl { bottom: 0; left: 0; border-right: none; border-top: none; }
                .br { bottom: 0; right: 0; border-left: none; border-top: none; }

                .scan-line {
                    position: absolute;
                    top: 50%;
                    left: 10%;
                    right: 10%;
                    height: 2px;
                    background: #22c55e;
                    box-shadow: 0 0 10px #22c55e;
                    animation: scan 2s linear infinite;
                }

                @keyframes scan {
                    0%, 100% { top: 10%; }
                    50% { top: 90%; }
                }

                .scanner-box p {
                    color: var(--text-muted);
                }

                .events-section h2 {
                    color: var(--text-primary);
                    font-size: 1.25rem;
                    margin-bottom: 1rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                }

                .empty-state svg {
                    color: var(--text-muted);
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    color: var(--text-primary);
                    margin: 0 0 0.5rem 0;
                }

                .empty-state p {
                    color: var(--text-muted);
                    margin: 0;
                }

                .events-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .event-card {
                    background: var(--glass-bg-light);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .event-info h3 {
                    color: var(--text-primary);
                    margin: 0 0 0.25rem 0;
                }

                .event-info p {
                    color: var(--text-secondary);
                    margin: 0;
                    font-size: 0.875rem;
                }

                .event-date {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                }

                .checkin-stats {
                    display: flex;
                    gap: 2rem;
                    margin: 1rem 0;
                }

                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }

                .stat svg {
                    color: var(--text-muted);
                }

                .stat.checked svg {
                    color: #22c55e;
                }

                .stat .value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat .label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .progress-bar {
                    height: 8px;
                    background: var(--glass-bg);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress {
                    height: 100%;
                    background: linear-gradient(90deg, #22c55e, #16a34a);
                    border-radius: 4px;
                    transition: width 0.3s ease;
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

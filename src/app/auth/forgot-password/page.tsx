'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json() as any;

            if (!response.ok) {
                setError(data?.error || 'Ralat berlaku');
                setLoading(false);
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('Ralat rangkaian. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-logo">
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img src="/logo.png" alt="A2Z Creative" height="48" style={{ height: '48px', width: 'auto' }} />
                        <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                    </Link>
                    <p>Jemputan Digital Profesional</p>
                </div>

                <div className="auth-card">
                    <h2>Lupa Kata Laluan?</h2>

                    {success ? (
                        <div>
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid #22c55e',
                                color: '#22c55e',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem'
                            }}>
                                Jika emel wujud dalam sistem kami, arahan untuk set semula kata laluan telah dihantar.
                            </div>
                            <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Sila semak peti masuk dan juga folder spam anda.
                            </p>
                            <Link href="/auth/login" className="btn btn-gold btn-full">
                                Kembali ke Log Masuk
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Masukkan emel anda dan kami akan menghantar pautan untuk set semula kata laluan.
                            </p>

                            {error && <div className="auth-error">{error}</div>}

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="email">Alamat Emel</label>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="nama@contoh.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button type="submit" className="auth-submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            <span>Menghantar...</span>
                                        </>
                                    ) : (
                                        <span>Hantar Pautan Reset</span>
                                    )}
                                </button>
                            </form>

                            <div className="auth-footer">
                                Ingat kata laluan?{' '}
                                <Link href="/auth/login">Log masuk</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

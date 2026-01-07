'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);
    const [loadingText, setLoadingText] = useState('Menyegerakkan akaun...');

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json() as any;
                if (data.authenticated && data.redirect) {
                    window.location.href = data.redirect;
                }
            }
        } catch (error) {
            console.log('Session check failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setIsLoadingOverlay(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json() as any;

            if (!response.ok) {
                setError(data?.error || 'Login gagal');
                setIsLoadingOverlay(false);
                setLoading(false);
                return;
            }

            if (data?.redirect) {
                setLoadingText(data?.message || 'Penjawaban log masuk berjaya...');
                setTimeout(() => {
                    window.location.href = data?.redirect;
                }, 1000);
            }
        } catch (error) {
            setError('Ralat bersambung. Sila cuba lagi.');
            setIsLoadingOverlay(false);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setIsLoadingOverlay(true);
        setLoadingText('Penyambungan dengan Google...');

        try {
            // Initialize Supabase if available
            const w = window as any;
            if (w.supabase) {
                const { data, error } = await w.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback`
                    }
                });

                if (error) throw error;
            } else {
                setError('Google OAuth tidak tersedia.');
                setIsLoadingOverlay(false);
                setLoading(false);
            }
        } catch (error) {
            setError('Ralat Google OAuth.');
            setIsLoadingOverlay(false);
            setLoading(false);
        }
    };

return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Logo */}
                <div className="auth-logo">
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img src="/logo.png" alt="A2Z Creative" height="48" />
                        <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                    </Link>
                    <p>Jemputan Digital Profesional</p>
                </div>

                {/* Card */}
                <div className="auth-card">
                    <h2>Log Masuk</h2>

                    {/* Error Message */}
                    {error && <div className="auth-error" style={{ display: 'block' }}>{error}</div>}

                    {/* Social Login */}
                    <div className="social-buttons">
                        <button
                            type="button"
                            className="social-btn google"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#DB4437" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Log masuk dengan Google
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="auth-divider">
                        <span>atau</span>
                    </div>

                    {/* Login Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Emel</label>
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

                        <div className="form-group">
                            <label htmlFor="password">Kata Laluan</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="forgot-link">
                            <Link href="/auth/forgot-password">Lupa kata laluan?</Link>
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {!loading ? (
                                <span className="btn-text">Log Masuk</span>
                            ) : (
                                <>
                                    <span className="spinner"></span>
                                    <span>Memproses...</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        Belum ada akaun? <Link href="/auth/register">Daftar sekarang</Link>
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {isLoadingOverlay && (
                <div className="loading-overlay" style={{ display: 'flex' }}>
                    <div className="auth-logo" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <img src="/logo.png" alt="A2Z Creative" height="48" />
                        <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                    </div>
                    <div className="loading-card">
                        <div className="spinner-large"></div>
                        <h2 className="loading-title">Memproses Log Masuk</h2>
                        <p className="loading-text">{loadingText}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

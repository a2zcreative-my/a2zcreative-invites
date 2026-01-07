'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setValidating(false);
            setError('Token reset tidak dijumpai. Sila minta pautan reset baru.');
        }
    }, [token]);

    const validateToken = async () => {
        try {
            const response = await fetch(`/api/auth/reset-password?token=${token}`);
            const data = await response.json() as any;

            if (data.valid) {
                setTokenValid(true);
                setUserEmail(data.email || '');
            } else {
                setError(data.error || 'Token tidak sah atau telah tamat tempoh.');
            }
        } catch (err) {
            setError('Ralat rangkaian. Sila cuba lagi.');
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Kata laluan tidak sepadan');
            return;
        }

        if (password.length < 6) {
            setError('Kata laluan mestilah sekurang-kurangnya 6 aksara');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
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

    if (validating) {
        return (
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div className="spinner-large"></div>
                <p style={{ color: '#a0aec0' }}>Mengesahkan pautan...</p>
            </div>
        );
    }

    return (
        <div className="auth-card">
            <h2>Set Semula Kata Laluan</h2>

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
                        Kata laluan berjaya dikemaskini!
                    </div>
                    <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Sila log masuk dengan kata laluan baru anda.
                    </p>
                    <Link href="/auth/login" className="btn btn-gold btn-full">
                        Log Masuk
                    </Link>
                </div>
            ) : !tokenValid ? (
                <div>
                    <div className="auth-error">{error}</div>
                    <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Token reset mungkin telah tamat tempoh atau tidak sah.
                    </p>
                    <Link href="/auth/forgot-password" className="btn btn-gold btn-full">
                        Minta Pautan Reset Baru
                    </Link>
                </div>
            ) : (
                <>
                    {userEmail && (
                        <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Menetapkan kata laluan baru untuk <strong style={{ color: '#d4af37' }}>{userEmail}</strong>
                        </p>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="password">Kata Laluan Baru</label>
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

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Sahkan Kata Laluan</label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Set Semula Kata Laluan</span>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <Link href="/auth/login">Kembali ke log masuk</Link>
                    </div>
                </>
            )}
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="spinner-large"></div>
            <p style={{ color: '#a0aec0' }}>Memuatkan...</p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-logo">
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img src="/logo.png" alt="A2Z Creative" height="48" />
                        <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                    </Link>
                    <p>Jemputan Digital Profesional</p>
                </div>

                <Suspense fallback={<LoadingFallback />}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}

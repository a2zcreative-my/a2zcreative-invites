'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch('/api/auth/session', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json() as any;
                if (data?.authenticated) window.location.href = '/dashboard';
            }
        } catch (error) {
            console.log('Session check failed');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Kata laluan tidak sepadan');
            return;
        }

        setLoading(true);
        setShowLoadingOverlay(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                }),
                credentials: 'include'
            });

            const data = await response.json() as any;

            if (!response.ok) {
                setError(data?.error || 'Pendaftaran gagal');
                setShowLoadingOverlay(false);
                setLoading(false);
                return;
            }

            if (data?.user) {
                localStorage.setItem('a2z_user', JSON.stringify(data.user));
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.href = data?.redirect || '/dashboard';
        } catch (err: any) {
            setError(err?.message || 'Ralat rangkaian');
            setShowLoadingOverlay(false);
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {showLoadingOverlay && (
                <div className="loading-overlay">
                    <div className="loading-card">
                        <div className="spinner-large"></div>
                        <h2 className="loading-title">Memproses Pendaftaran</h2>
                        <p className="loading-text">Mencipta akaun anda...</p>
                    </div>
                </div>
            )}

            <div className="auth-container">
                <div className="auth-logo">
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img src="/logo.png" alt="A2Z Creative" height="48" style={{ height: '48px', width: 'auto' }} />
                        <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                    </Link>
                    <p>Jemputan Digital Profesional</p>
                </div>

                <div className="auth-card">
                    <h2>Daftar Akaun Baru</h2>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Nama Penuh</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama anda"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Emel</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="nama@contoh.com"
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
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
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
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
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
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Daftar</span>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Sudah ada akaun?{' '}
                        <Link href="/auth/login">Log masuk</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

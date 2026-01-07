'use client';

import { useEffect, useState } from 'react';

export default function OAuthCallbackPage() {
    const [status, setStatus] = useState('Memproses log masuk...');
    const [error, setError] = useState('');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            // Get the hash fragment from URL (Supabase puts tokens there)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');

            if (!accessToken) {
                // Try to get from query params
                const queryParams = new URLSearchParams(window.location.search);
                const errorMsg = queryParams.get('error_description') || queryParams.get('error');
                if (errorMsg) {
                    setError(errorMsg);
                    setStatus('Log masuk gagal');
                    return;
                }
                setError('Token akses tidak ditemui');
                setStatus('Log masuk gagal');
                return;
            }

            setStatus('Menyegerakkan akaun...');

            // Send token to our API to sync with D1 and create session
            const response = await fetch('/api/auth/oauth-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ access_token: accessToken })
            });

            const data = await response.json() as any;

            if (response.ok && data.success) {
                // Store user info for UI display
                if (data.user) {
                    localStorage.setItem('a2z_user', JSON.stringify({
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role,
                        avatar_url: data.user.avatar_url
                    }));
                }

                setStatus('Log masuk berjaya! Mengalihkan...');

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = data.redirect || '/pricing/';
                }, 1000);
            } else {
                setError(data.error || 'Gagal menyegerakkan akaun');
                setStatus('Log masuk gagal');
            }
        } catch (err) {
            console.error('OAuth callback error:', err);
            setError('Ralat berlaku semasa log masuk');
            setStatus('Log masuk gagal');
        }
    };

    return (
        <div className="auth-page">
            <div className="loading-overlay" style={{ display: 'flex' }}>
                <div className="auth-logo" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <img src="/logo.png" alt="A2Z Creative" height="48" />
                    <span className="logo-text-gradient" style={{ fontSize: '1.5rem' }}>A2ZCreative</span>
                </div>
                <div className="loading-card">
                    {!error ? (
                        <>
                            <div className="spinner-large"></div>
                            <h2 className="loading-title">Memproses Log Masuk</h2>
                            <p className="loading-text">{status}</p>
                        </>
                    ) : (
                        <>
                            <h2 className="loading-title" style={{ color: '#ff6b6b' }}>Log Masuk Gagal</h2>
                            <p className="loading-text" style={{ color: '#ff6b6b' }}>{error}</p>
                            <a 
                                href="/auth/login" 
                                className="btn btn-primary" 
                                style={{ marginTop: '1.5rem' }}
                            >
                                Cuba Lagi
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

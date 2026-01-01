// =============================================
// IIFE to prevent global scope pollution
// =============================================
(function () {
    'use strict';

    // =============================================
    // Supabase Configuration (Loaded from server - no hard-coded credentials)
    // =============================================
    let supabaseClient;
    let supabaseReady = false;

    // Fetch Supabase config from server (credentials stored securely in env vars)
    async function initSupabase() {
        try {
            const response = await fetch('/api/auth/config');
            if (response.ok) {
                const config = await response.json();
                if (config.url && config.anonKey && window.supabase) {
                    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
                    supabaseReady = true;
                }
            }
        } catch (e) {
            console.warn('Supabase config not available. Google OAuth will be unavailable.');
        }
    }

    // Initialize Supabase asynchronously
    initSupabase();

    // =============================================
    // DOM Elements
    // =============================================
    let DOM = {};

    // =============================================
    // Initialization
    // =============================================
    function initAuth() {
        DOM = {
            loginForm: document.getElementById('loginForm'),
            registerForm: document.getElementById('registerForm'),
            googleLogin: document.getElementById('googleLogin'),
            togglePassword: document.getElementById('togglePassword'),
            authError: document.getElementById('authError'),
            submitBtn: document.getElementById('submitBtn'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            // New Loading Overlay Elements
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText')
        };

        initPasswordToggle();
        initLoginForm();
        initRegisterForm();
        initGoogleLogin();
        checkSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    // Helper: Show/Hide Full Screen Loading
    function showLoadingOverlay(message = 'Memproses...') {
        console.log('[A2Z Auth] showLoadingOverlay called with:', message);
        console.log('[A2Z Auth] DOM.loadingOverlay:', DOM.loadingOverlay);

        if (DOM.loadingOverlay) {
            if (DOM.loadingText) DOM.loadingText.textContent = message;
            // Use inline style directly (overrides any previous inline display: none)
            DOM.loadingOverlay.style.display = 'flex';
            console.log('[A2Z Auth] Overlay should now be VISIBLE');
        } else {
            console.log('[A2Z Auth] Overlay element NOT FOUND, using fallback spinner');
            // Fallback to button spinner if overlay is missing
            setLoading(true);
        }
    }

    function hideLoadingOverlay() {
        if (DOM.loadingOverlay) {
            DOM.loadingOverlay.style.display = 'none';
        }
        setLoading(false);
    }

    // =============================================
    // Session Check
    // =============================================
    async function checkSession() {
        try {
            // Only redirect from auth pages (login/register)
            // Don't redirect from other pages like /create/ or /pricing/
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.startsWith('/auth/');

            if (!isAuthPage) return; // Skip redirect logic on non-auth pages

            // Check server session via API
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.redirect) {
                    window.location.href = data.redirect;
                }
            }
        } catch (error) {
            // Silently fail
        }
    }

    // =============================================
    // Password Toggle
    // =============================================
    function togglePasswordVisibility(buttonElement) {
        if (!buttonElement) return;

        const wrapper = buttonElement.closest('.password-wrapper');
        const input = wrapper?.querySelector('input');

        if (!input) return;

        const isCurrentlyPassword = input.type === 'password';
        input.type = isCurrentlyPassword ? 'text' : 'password';

        const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

        const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

        buttonElement.innerHTML = isCurrentlyPassword ? eyeOffIcon : eyeIcon;
    }

    // Export globally for inline onclick
    window.togglePasswordVisibility = togglePasswordVisibility;

    function initPasswordToggle() {
        // Handled by inline onclick
    }

    // =============================================
    // Google Login - Redirect Flow (more reliable than popup)
    // =============================================
    function initGoogleLogin() {
        if (!DOM.googleLogin) return;

        DOM.googleLogin.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!supabaseClient) {
                showError('Google Login memerlukan konfigurasi Supabase.');
                return;
            }

            try {
                // Use redirect flow instead of popup (more reliable, no COOP issues)
                const { data, error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/auth/callback.html'
                    }
                });

                if (error) throw error;
                // Browser will redirect to Google, then back to /auth/callback.html

            } catch (error) {
                console.error('Google login error:', error);
                showError('Gagal menyambung ke Google. Sila cuba sebentar lagi.');
            }
        });
    }

    // =============================================
    // Handle OAuth Callback (called from callback page)
    // =============================================
    async function handleOAuthCallback() {
        if (!supabaseClient) return null;

        try {
            // Get session from URL hash (Supabase puts tokens there after OAuth)
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error) throw error;

            if (session?.access_token) {
                // Sync to D1 and create session cookie
                const syncResponse = await fetch('/api/auth/oauth-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ access_token: session.access_token })
                });

                const syncData = await syncResponse.json();

                if (syncResponse.ok && syncData.success) {
                    // Store user info for UI display
                    localStorage.setItem('a2z_user', JSON.stringify({
                        name: syncData.user.name,
                        email: syncData.user.email,
                        role: syncData.user.role,
                        avatar_url: syncData.user.avatar_url
                    }));

                    return syncData.redirect || '/pricing/';
                } else {
                    console.error('D1 sync failed:', syncData.error);
                    return null;
                }
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
        }

        return null;
    }

    // Export callback handler
    window.handleOAuthCallback = handleOAuthCallback;

    // =============================================
    // Login Form - Server-Driven Redirect
    // =============================================
    function initLoginForm() {
        DOM.loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showError('Sila masukkan emel dan kata laluan.');
                return;
            }

            // Show full screen overlay
            showLoadingOverlay('Memproses Log Masuk...');
            hideError();

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // Important for cookies
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Update text to show success state
                    if (DOM.loadingText) DOM.loadingText.textContent = 'Log masuk berjaya! Mengalihkan...';

                    // Store minimal user info for UI display only
                    if (data.user) {
                        localStorage.setItem('a2z_user', JSON.stringify({
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role
                        }));
                    }

                    // Delay slightly to let user see success message, then redirect
                    setTimeout(() => {
                        window.location.href = data.redirect || '/dashboard/';
                    }, 800);
                } else {
                    hideLoadingOverlay();
                    showError(data.error || 'Log masuk gagal. Sila cuba lagi.');
                }
            } catch (error) {
                console.error('Login error:', error);
                hideLoadingOverlay();
                showError('Ralat rangkaian. Sila semak sambungan internet anda.');
            }
        });
    }

    // =============================================
    // Register Form
    // =============================================
    function initRegisterForm() {
        DOM.registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms')?.checked;

            setLoading(true);
            hideError();

            if (password !== confirmPassword) {
                showError('Kata laluan tidak sepadan.');
                setLoading(false);
                return;
            }

            if (!terms) {
                showError('Sila bersetuju dengan Terma Perkhidmatan.');
                setLoading(false);
                return;
            }

            try {
                // Register via D1 API
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Store user data in localStorage for getCurrentUser
                    if (data.user) {
                        localStorage.setItem('a2z_user', JSON.stringify(data.user));
                    }
                    showError('Akaun berjaya didaftar! Mengalihkan...');
                    setTimeout(() => {
                        window.location.href = data.redirect || '/pricing/';
                    }, 1500);
                } else {
                    showError(data.error || 'Pendaftaran gagal. Sila cuba lagi.');
                }
            } catch (error) {
                console.error('Register error:', error);
                showError('Ralat rangkaian. Sila semak sambungan internet anda.');
            } finally {
                setLoading(false);
            }
        });
    }

    // =============================================
    // Logout Function
    // =============================================
    async function logout() {
        try {
            // Clear server session
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            // Clear Supabase session if exists
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }

            // Clear local storage
            localStorage.removeItem('a2z_user');
            localStorage.removeItem('demo_user'); // Legacy cleanup

            window.location.href = '/auth/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even on error
            localStorage.removeItem('a2z_user');
            localStorage.removeItem('demo_user');
            window.location.href = '/auth/login.html';
        }
    }

    // =============================================
    // Get Current User
    // =============================================
    async function getCurrentUser() {
        // Check local storage first (for UI display)
        const localUser = localStorage.getItem('a2z_user');
        if (localUser) {
            try {
                return JSON.parse(localUser);
            } catch (e) {
                localStorage.removeItem('a2z_user');
            }
        }

        // Check D1 session via API (for D1-registered users)
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    // Cache for future calls
                    localStorage.setItem('a2z_user', JSON.stringify(data.user));
                    return data.user;
                }
            }
        } catch (e) {
            // Silently continue to Supabase fallback
        }

        // Check Supabase session (legacy/OAuth users)
        if (supabaseClient) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                return user;
            } catch (error) {
                console.error('Get user error:', error);
            }
        }

        return null;
    }

    // =============================================
    // Helper Functions
    // =============================================
    function showError(message) {
        if (DOM.authError) {
            DOM.authError.textContent = message;
            DOM.authError.classList.add('visible');
        }
    }

    function hideError() {
        if (DOM.authError) {
            DOM.authError.classList.remove('visible');
        }
    }

    function setLoading(loading) {
        if (DOM.submitBtn) {
            DOM.submitBtn.disabled = loading;

            const btnText = DOM.submitBtn.querySelector('.btn-text');
            const spinner = DOM.submitBtn.querySelector('.auth-loading');

            if (btnText) btnText.style.display = loading ? 'none' : 'inline';
            if (spinner) spinner.classList.toggle('visible', loading);
        }
    }

    // =============================================
    // Export for use in other scripts
    // =============================================
    window.A2ZAuth = {
        logout,
        getCurrentUser,
        supabase: supabaseClient
    };

})(); // End IIFE

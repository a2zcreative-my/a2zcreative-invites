/**
 * A2Z Creative - Authentication
 * Secure authentication with session cookies and server-driven redirects
 */

// =============================================
// Supabase Configuration (Optional - for Google OAuth)
// =============================================
const SUPABASE_URL = 'https://bzxjsdtkoakscmeuthlu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ksSZeGQ4toGfqLttrL7Vsw_8Vq2AVxi';

let supabase;

try {
    supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.warn('Supabase not configured. Google OAuth will be unavailable.');
}

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
        loadingSpinner: document.getElementById('loadingSpinner')
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

// =============================================
// Session Check
// =============================================
async function checkSession() {
    try {
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
        console.log('Session check:', error.message);
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

window.togglePasswordVisibility = togglePasswordVisibility;

function initPasswordToggle() {
    // Handled by inline onclick
}

// =============================================
// Google Login
// =============================================
function initGoogleLogin() {
    if (!DOM.googleLogin) return;

    DOM.googleLogin.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!supabase) {
            showError('Google Login memerlukan konfigurasi Supabase.');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard/',
                    skipBrowserRedirect: true
                }
            });

            if (error) throw error;

            if (data?.url) {
                const width = 500;
                const height = 600;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                const popup = window.open(
                    data.url,
                    'google-login',
                    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
                );

                supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        if (popup && !popup.closed) popup.close();
                        window.location.href = '/dashboard/';
                    }
                });
            }
        } catch (error) {
            console.error('Google login error:', error);
            showError('Gagal menyambung ke Google. Sila cuba sebentar lagi.');
        }
    });
}

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

        setLoading(true);
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
                // Store minimal user info for UI display only
                // Session cookie handles actual auth
                if (data.user) {
                    localStorage.setItem('a2z_user', JSON.stringify({
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role
                    }));
                }

                // Use server-provided redirect
                window.location.href = data.redirect || '/dashboard/';
            } else {
                showError(data.error || 'Log masuk gagal. Sila cuba lagi.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Ralat rangkaian. Sila semak sambungan internet anda.');
        } finally {
            setLoading(false);
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
                showError('Akaun berjaya didaftar! Mengalihkan...');
                setTimeout(() => {
                    window.location.href = data.redirect || '/auth/login.html';
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
        if (supabase) {
            await supabase.auth.signOut();
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

    // Legacy support
    const legacyUser = localStorage.getItem('demo_user');
    if (legacyUser) {
        try {
            return JSON.parse(legacyUser);
        } catch (e) {
            localStorage.removeItem('demo_user');
        }
    }

    // Check Supabase session
    if (supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
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
    supabase
};

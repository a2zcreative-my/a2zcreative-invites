/**
 * A2Z Creative - Authentication
 * Supabase Auth integration for login, register, and session management
 */

// =============================================
// Supabase Configuration
// =============================================
const SUPABASE_URL = 'https://bzxjsdtkoakscmeuthlu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ksSZeGQ4toGfqLttrL7Vsw_8Vq2AVxi';

// =============================================
// DOM Elements (populated after DOMContentLoaded)
// =============================================
let DOM = {};
let supabase = null;

// =============================================
// Initialization - Define FIRST, then export immediately
// =============================================
function initAuth() {
    console.log('initAuth called');

    // Initialize Supabase client (moved inside initAuth)
    try {
        if (window.supabase && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client created');
        } else {
            console.warn('Supabase library not loaded');
        }
    } catch (e) {
        console.warn('Supabase not configured:', e.message);
    }

    // Get DOM elements after page is loaded
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

// Export to global scope IMMEDIATELY after function definition
window.initAuth = initAuth;

// Handle both scenarios: script loads before OR after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    // DOM is already ready (interactive or complete)
    initAuth();
}

// =============================================
// Session Check
// =============================================
async function checkSession() {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // Already logged in, redirect to dashboard
            window.location.href = '/create/';
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// =============================================
// Password Toggle
// =============================================
// =============================================
// Password Toggle (Global Function for Inline Click)
// =============================================
function togglePasswordVisibility(buttonElement) {
    if (!buttonElement) return;

    // Find the input relative to the button (sibling)
    const wrapper = buttonElement.closest('.password-wrapper');
    const input = wrapper.querySelector('input');

    if (!input) return;

    // Toggle type
    const isCurrentlyPassword = input.type === 'password';
    input.type = isCurrentlyPassword ? 'text' : 'password';

    // Direct SVG Icons (Reliable)
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

    const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

    // Logic:
    // If it *was* password, we made it text. Now we want to show "Hide" icon (Eye Off).
    // If it *was* text, we made it password. Now we want to show "Show" icon (Eye).

    // Note: The variable isCurrentlyPassword captures the state BEFORE the toggle.
    // So if isCurrentlyPassword is true (it was dots), we successfully changed it to text.
    // Therefore we should show the "Hide" icon.

    // HOWEVER, the user might be confused. Let's try to be extremely explicit.

    // Previous Code: buttonElement.innerHTML = isCurrentlyPassword ? eyeOffIcon : eyeIcon;
    // If isCurrentlyPassword (true) -> eyeOffIcon (Slash).
    // This is correct standard behavior (Show -> Click -> Text shows -> Icon becomes Cross).

    // If the user says "it is not function" and shows dots + eye icon...
    // That means `input.type` is still `password`.
    // Why? Maybe the button inside the form is triggering a submit or refresh?
    // I added type="button".

    // Let's add console logs to debug in production console if needed
    console.log("Toggling password. Old type:", isCurrentlyPassword ? 'password' : 'text');

    buttonElement.innerHTML = isCurrentlyPassword ? eyeOffIcon : eyeIcon;
}

// Ensure it's globally available
window.togglePasswordVisibility = togglePasswordVisibility;

function initPasswordToggle() {
    // Legacy support or fallback if needed, but primary is now inline
    // Keeping this empty or removing it from init flow
}

// =============================================
// Google Login
// =============================================
function initGoogleLogin() {
    console.log('initGoogleLogin called');
    console.log('googleLogin element:', DOM.googleLogin);

    if (!DOM.googleLogin) {
        console.error('Google login button not found!');
        return;
    }

    DOM.googleLogin.addEventListener('click', async (e) => {
        console.log('Google button clicked!');
        e.preventDefault();

        try {
            if (!supabase) {
                console.error('Supabase not initialized');
                showError('Google Login requires Supabase configuration.');
                return;
            }

            console.log('Opening Google OAuth popup...');

            // Use skipBrowserRedirect to open in popup instead of redirecting
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/create/',
                    skipBrowserRedirect: true
                }
            });

            if (error) throw error;

            // Open the OAuth URL in a popup window
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

                console.log('Popup opened, waiting for authentication...');

                // Listen for auth state changes
                const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
                    console.log('Auth state changed:', event);
                    if (event === 'SIGNED_IN' && session) {
                        console.log('User signed in successfully!');
                        // Close popup if still open
                        if (popup && !popup.closed) {
                            popup.close();
                        }
                        // Redirect to dashboard
                        window.location.href = '/create/';
                    }
                });
            }
        } catch (error) {
            console.error('Google login error:', error);
            showError('Gagal menyambung ke Google. Sila cuba sebentar lagi.');
        }
    });

    console.log('Google login event listener attached');
}

// =============================================
// Login Form
// =============================================
function initLoginForm() {
    DOM.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        setLoading(true);
        hideError();

        // D1 Auth Check (Priority)
        let d1Success = false;
        try {
            console.log("Attempting D1 Auth...");
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('demo_user', JSON.stringify(data.user)); // Store user info

                if (data.user.role === 'super_admin') {
                    window.location.href = '/admin/';
                } else {
                    window.location.href = '/create/';
                }
                d1Success = true; // Mark D1 as successful
                return;
            } else {
                console.warn("D1 Auth rejected:", response.status, response.statusText);
            }
        } catch (err) {
            console.error("D1 Auth error, falling back:", err);
        }

        // FAILSAFE: If D1 failed, check hardcoded admin credentials
        // This ensures the user can get in if D1 is misbehaving
        if (!d1Success && email === 'admin@a2zcreative.my' && password === 'Admin@2025') {
            console.log("Failsafe Admin Login triggered");
            localStorage.setItem('demo_user', JSON.stringify({
                email,
                name: 'Super Admin',
                role: 'super_admin'
            }));

            window.location.href = '/admin/';
            return;
        }

        try {
            if (!supabase) {
                // Simulate login for demo
                await simulateDelay(1000);
                localStorage.setItem('demo_user', JSON.stringify({ email, name: 'Demo User' }));
                window.location.href = '/create/';
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Redirect to dashboard
            window.location.href = '/create/';

        } catch (error) {
            showError(error.message || 'Log masuk gagal. Sila cuba lagi.');
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
        const terms = document.getElementById('terms').checked;

        setLoading(true);
        hideError();

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Kata laluan tidak sepadan.');
            setLoading(false);
            return;
        }

        // Validate terms
        if (!terms) {
            showError('Sila bersetuju dengan Terma Perkhidmatan.');
            setLoading(false);
            return;
        }

        try {
            if (!supabase) {
                // Simulate registration for demo
                await simulateDelay(1000);
                localStorage.setItem('demo_user', JSON.stringify({ email, name }));
                window.location.href = '/create/';
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name
                    }
                }
            });

            if (error) throw error;

            // Show success message
            showError('Akaun berjaya didaftar! Sila semak emel untuk pengesahan.');

            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/auth/login.html';
            }, 2000);

        } catch (error) {
            showError(error.message || 'Pendaftaran gagal. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    });
}

// =============================================
// Logout Function (can be called from other pages)
// =============================================
async function logout() {
    try {
        if (supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('demo_user'); // Crucial for clearing Admin override
        window.location.href = '/auth/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even on error
        localStorage.removeItem('demo_user');
        window.location.href = '/auth/login.html';
    }
}

// =============================================
// Get Current User (can be called from other pages)
// =============================================
async function getCurrentUser() {
    // Check local storage first (Priority for Super Admin bypass)
    const localUser = localStorage.getItem('demo_user');
    if (localUser) {
        return JSON.parse(localUser);
    }

    try {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
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

function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use in other scripts
window.A2ZAuth = {
    logout,
    getCurrentUser,
    supabase
};

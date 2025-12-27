/**
 * A2Z Creative - Authentication
 * Supabase Auth integration for login, register, and session management
 */

// =============================================
// Supabase Configuration
// =============================================
// These will be replaced with actual values from env vars
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.warn('Supabase not configured. Auth will be simulated.');
}

// =============================================
// DOM Elements
// =============================================
const DOM = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    googleLogin: document.getElementById('googleLogin'),
    togglePassword: document.getElementById('togglePassword'),
    authError: document.getElementById('authError'),
    submitBtn: document.getElementById('submitBtn'),
    loadingSpinner: document.getElementById('loadingSpinner')
};

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initLoginForm();
    initRegisterForm();
    initGoogleLogin();
    checkSession();
});

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
function initPasswordToggle() {
    DOM.togglePassword?.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const icon = DOM.togglePassword.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            passwordInput.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }

        lucide.createIcons();
    });
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

        // Validation
        if (password !== confirmPassword) {
            showError('Kata laluan tidak sepadan.');
            return;
        }

        if (!terms) {
            showError('Sila bersetuju dengan terma perkhidmatan.');
            return;
        }

        setLoading(true);
        hideError();

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
                        full_name: name
                    }
                }
            });

            if (error) throw error;

            // Check if email confirmation is required
            if (data.user && !data.session) {
                alert('Sila semak emel anda untuk pengesahan.');
                window.location.href = '/auth/login.html';
            } else {
                window.location.href = '/create/';
            }

        } catch (error) {
            showError(error.message || 'Pendaftaran gagal. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    });
}

// =============================================
// Google Login
// =============================================
function initGoogleLogin() {
    DOM.googleLogin?.addEventListener('click', async () => {
        try {
            if (!supabase) {
                // Simulate OAuth for demo
                localStorage.setItem('demo_user', JSON.stringify({
                    email: 'demo@google.com',
                    name: 'Google User'
                }));
                window.location.href = '/create/';
                return;
            }

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback.html`
                }
            });

            if (error) throw error;

        } catch (error) {
            showError(error.message || 'Log masuk Google gagal.');
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
        localStorage.removeItem('demo_user');
        window.location.href = '/auth/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// =============================================
// Get Current User (can be called from other pages)
// =============================================
async function getCurrentUser() {
    try {
        if (!supabase) {
            const demoUser = localStorage.getItem('demo_user');
            return demoUser ? JSON.parse(demoUser) : null;
        }

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

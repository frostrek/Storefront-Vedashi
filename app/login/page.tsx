'use client';
import { authFetch } from '@/lib/api';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ShieldCheck, User, Wine, Smartphone, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import SocialLoginButtons from '@/components/SocialLoginButtons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecommerce-backend-h23p.onrender.com';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? 'YOUR_SITE_KEY';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:4000';

type LoginMode = 'customer' | 'admin';
type AuthMethod = 'email' | 'phone';

function LoginContent() {
    const router = useRouter();
    const { login, register, isAuthenticated, user, logout, loginFromVerification } = useAuth();
    const searchParams = useSearchParams();

    // Handle ?logout=true from Admin signout — clear Storefront auth state
    useEffect(() => {
        if (searchParams.get('logout') === 'true') {
            logout();
            // Clean up URL so the param doesn't persist on refresh
            router.replace('/login');
        }
    }, [searchParams, logout, router]);

    const [loginMode, setLoginMode] = useState<LoginMode>('customer');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Phone OTP state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [isNewPhoneUser, setIsNewPhoneUser] = useState(false);
    const [phoneName, setPhoneName] = useState('');

    // Prevents the isAuthenticated useEffect from redirecting to /account
    // when an admin login is in progress (avoids brief flash of Storefront UI)
    const isAdminRedirecting = useRef(false);

    // ── Turnstile state ──────────────────────────────────────────────
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    /** Render (or re-render) the Turnstile widget */
    const renderTurnstile = useCallback(() => {
        // Remove previous widget if it exists
        if (widgetIdRef.current !== null) {
            try { window.turnstile?.remove(widgetIdRef.current); } catch { /* noop */ }
            widgetIdRef.current = null;
        }

        if (!turnstileRef.current || !window.turnstile) return;

        const id = window.turnstile.render(turnstileRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => setTurnstileToken(token),
            'expired-callback': () => setTurnstileToken(null),
            'error-callback': () => setTurnstileToken(null),
            theme: 'light',
        });

        widgetIdRef.current = id;
    }, []);

    // Render widget once the Turnstile script has loaded
    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.turnstile) {
                clearInterval(interval);
                renderTurnstile();
            }
            if (attempts > 50) clearInterval(interval);
        }, 100);

        return () => {
            clearInterval(interval);
            if (widgetIdRef.current !== null) {
                try { window.turnstile?.remove(widgetIdRef.current); } catch { /* noop */ }
                widgetIdRef.current = null;
            }
        };
    }, [renderTurnstile]);

    // Re-render widget when toggling between login / register
    useEffect(() => {
        setTurnstileToken(null);
        renderTurnstile();
    }, [isRegister, renderTurnstile]);

    // ── Cooldown timer ────────────────────────────────────────────────
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // ── Auth redirect ────────────────────────────────────────────────
    const redirectTo = searchParams.get('redirect') || '/account';

    useEffect(() => {
        // Skip redirect if admin login is in progress (prevents UI flash)
        if (isAdminRedirecting.current) return;
        if (isAuthenticated && user) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, user, router, redirectTo]);

    if (isAuthenticated && !isAdminRedirecting.current || isRedirecting) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream/90 backdrop-blur-md animate-in fade-in duration-500">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    {/* Outer spinning ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-burgundy border-r-burgundy/50 animate-spin" />
                    {/* Inner pulsing circle */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 animate-pulse">
                        <Wine className="h-8 w-8 text-burgundy" />
                    </div>
                </div>
                <div className="mt-8 flex flex-col items-center space-y-2">
                    <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight animate-in slide-in-from-bottom-2 fade-in duration-700">
                        Securing your session
                    </h2>
                    <p className="text-sm font-medium text-warm-gray animate-pulse">
                        Please wait while we prepare your account...
                    </p>
                </div>
            </div>
        );
    }

    // ── Mode tabs config ─────────────────────────────────────────────
    const modes: { key: LoginMode; label: string; icon: React.ReactNode; desc: string }[] = [
        { key: 'customer', label: 'Customer', icon: <User className="w-4 h-4" />, desc: 'Shop & manage orders' },
        { key: 'admin', label: 'Admin', icon: <ShieldCheck className="w-4 h-4" />, desc: 'Manage your store' },
    ];

    // ── Phone OTP handlers ───────────────────────────────────────────

    const handleSendPhoneOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/auth/phone-login/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumber }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setOtpSent(true);
                setCooldown(60);
                setIsNewPhoneUser(!!json.data?.is_new_user);
                toast.success('OTP sent to your phone via SMS!');
            } else {
                toast.error(json.message || 'Failed to send OTP');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode || otpCode.length < 4) {
            toast.error('Please enter the OTP');
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/auth/phone-login/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone: phoneNumber, otp_code: otpCode, full_name: phoneName || undefined }),
            });
            const json = await res.json();
            if (res.ok && json.success && json.data?.customer) {
                toast.success('Welcome back!');
                loginFromVerification(json.data.customer, json.data.access_token);
                setIsRedirecting(true);
                router.push(redirectTo);
            } else {
                toast.error(json.message || 'Invalid OTP. Please try again.');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Email/Password Submit handler ────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Gate on Turnstile token
        if (!turnstileToken) {
            toast.error('Please complete the CAPTCHA verification.');
            return;
        }

        setLoading(true);

        try {
            if (isRegister) {
                // Initiate registration (deferred — no account created yet, just pending)
                const result = await register(form.name, form.email, form.password);

                if (result?.success) {
                    toast.success('Please verify your email to complete registration.');
                    setIsRedirecting(true);
                    // Add artificial delay to extend loader screen viewing as requested
                    setTimeout(() => {
                        router.push(`/verify-email?registered=true&email=${encodeURIComponent(form.email)}`);
                    }, 1500);
                } else {
                    toast.error(result?.error || 'Something went wrong');
                }
            } else {
                // 🔹 Login user
                const result = await login(form.email, form.password);

                if (result?.success) {
                    if (result.role === 'admin') {
                        // Set flag BEFORE AuthContext re-renders to prevent flash
                        isAdminRedirecting.current = true;
                        toast.success('Welcome, Admin! Redirecting to dashboard...');
                        // Build auto-login URL with user info for admin panel
                        // Read from the AuthContext localStorage key
                        let userName = form.email.split('@')[0];
                        let userId = '';
                        try {
                            const stored = localStorage.getItem('ksp_wines_user');
                            if (stored) {
                                const userData = JSON.parse(stored);
                                userName = userData.name || userName;
                                userId = userData.id || '';
                            }
                        } catch { /* noop */ }
                        const params = new URLSearchParams({
                            token: result.access_token || '',
                            email: form.email,
                            name: userName,
                            id: userId,
                        });
                        window.location.href = `${ADMIN_URL}/auto-login?${params.toString()}`;
                        return;
                    }
                    toast.success('Welcome back!');
                    setIsRedirecting(true);
                    router.push(redirectTo);
                } else {
                    // If the user selected admin mode but has customer role
                    if (loginMode === 'admin' && result?.error) {
                        toast.error(result.error);
                    } else {
                        toast.error(result?.error || 'Something went wrong');
                    }
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Server error. Please try again.');
        } finally {
            setLoading(false);
            setTurnstileToken(null);
            renderTurnstile();
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="text-4xl block mb-3">🍷</span>
                    <h1 className="font-serif text-3xl font-bold text-charcoal">
                        {isRegister
                            ? 'Create Account'
                            : loginMode === 'admin'
                                ? 'Admin Login'
                                : 'Welcome Back'}
                    </h1>
                    <p className="mt-2 text-sm text-warm-gray">
                        {isRegister
                            ? 'Join the KSP Wines family'
                            : loginMode === 'admin'
                                ? 'Sign in to manage your store'
                                : 'Sign in to your account'}
                    </p>
                </div>

                {/* ── Role Selector Tabs ── */}
                <div className="flex gap-2 mb-6">
                    {modes.map(mode => (
                        <button
                            key={mode.key}
                            type="button"
                            onClick={() => {
                                setLoginMode(mode.key);
                                setIsRegister(false);
                                setAuthMethod('email');
                                setForm({ name: '', email: '', password: '' });
                                setOtpSent(false);
                                setOtpCode('');
                                setPhoneNumber('');
                            }}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all duration-300 ${loginMode === mode.key
                                ? mode.key === 'admin'
                                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 text-amber-800 shadow-sm shadow-amber-100'
                                    : 'bg-gradient-to-br from-rose-50 to-red-50 border-burgundy/40 text-burgundy shadow-sm shadow-rose-100'
                                : 'bg-white/60 border-light-border text-warm-gray hover:bg-white hover:border-gray-300'
                                }`}
                        >
                            <span className={`transition-transform duration-300 ${loginMode === mode.key ? 'scale-110' : ''}`}>
                                {mode.icon}
                            </span>
                            <span>{mode.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Phone OTP Login Form ── */}
                {authMethod === 'phone' && loginMode === 'customer' && !isRegister ? (
                    <div className="rounded-2xl border border-light-border bg-white p-8 shadow-sm">
                        {/* Back to email login */}
                        <button
                            type="button"
                            onClick={() => { setAuthMethod('email'); setOtpSent(false); setOtpCode(''); }}
                            className="flex items-center gap-1 text-xs font-medium text-warm-gray hover:text-charcoal transition-colors mb-5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to email login
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                <Smartphone className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-serif text-base font-bold text-charcoal">Sign in with Phone</h3>
                                <p className="text-xs text-warm-gray">We&apos;ll send a verification code via SMS</p>
                            </div>
                        </div>

                        {!otpSent ? (
                            /* Step 1: Enter phone number */
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 rounded-lg border border-light-border bg-gray-50 text-sm text-warm-gray font-medium">
                                        +91
                                    </div>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="flex-1 rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                        placeholder="Enter 10-digit mobile number"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendPhoneOTP}
                                    disabled={loading || phoneNumber.length < 10}
                                    className="w-full mt-4 rounded-lg py-3 text-sm font-semibold text-white bg-burgundy hover:bg-burgundy-dark transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </div>
                        ) : (
                            /* Step 2: Enter OTP */
                            <form onSubmit={handleVerifyPhoneOTP}>
                                <p className="text-sm text-warm-gray mb-4">
                                    We sent a 6-digit code to <span className="font-semibold text-charcoal">+91 {phoneNumber}</span>
                                </p>

                                {/* Name field for new users */}
                                {isNewPhoneUser && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-charcoal mb-1">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={phoneName}
                                            onChange={e => setPhoneName(e.target.value)}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                            placeholder="Enter your name"
                                        />
                                        <p className="text-xs text-warm-gray mt-1">We&apos;ll create an account for you</p>
                                    </div>
                                )}

                                <label className="block text-sm font-medium text-charcoal mb-1">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full rounded-lg border border-light-border px-4 py-3 text-center text-lg tracking-[0.5em] font-mono focus:border-burgundy focus:outline-none"
                                    placeholder="● ● ● ● ● ●"
                                    maxLength={6}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={loading || otpCode.length < 4}
                                    className="w-full mt-4 rounded-lg py-3 text-sm font-semibold text-white bg-burgundy hover:bg-burgundy-dark transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                                </button>

                                {/* Resend */}
                                <div className="mt-3 text-center">
                                    {cooldown > 0 ? (
                                        <p className="text-xs text-warm-gray">
                                            Resend OTP in <span className="font-semibold text-charcoal">{cooldown}s</span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendPhoneOTP}
                                            disabled={loading}
                                            className="text-xs font-semibold text-burgundy hover:text-burgundy-dark hover:underline"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>

                                {/* Change number */}
                                <div className="mt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                                        className="text-xs text-warm-gray hover:text-charcoal hover:underline"
                                    >
                                        Change phone number
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Footer links */}
                        <div className="mt-5 pt-4 border-t border-light-border text-center space-y-2">
                            <p className="text-sm text-warm-gray">
                                Don&apos;t have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setIsRegister(true); setAuthMethod('email'); }}
                                    className="font-semibold text-burgundy hover:text-burgundy-dark hover:underline cursor-pointer"
                                >
                                    Create Account
                                </button>
                            </p>
                            <p className="text-sm text-warm-gray">
                                <Link
                                    href="/"
                                    className="font-semibold text-burgundy hover:text-burgundy-dark hover:underline cursor-pointer"
                                >
                                    Continue as Guest
                                </Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    /* ── Email/Password Login / Register Form ── */
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-light-border bg-white p-8 shadow-sm"
                    >
                        {loginMode === 'admin' && (
                            <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                                <ShieldCheck className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-medium text-amber-700">
                                    Admin credentials required
                                </span>
                            </div>
                        )}

                        {/* ── Social Login Buttons + Phone Login (customer login only) ── */}
                        {loginMode === 'customer' && !isRegister && (
                            <>
                                <SocialLoginButtons disabled={loading} />

                                {/* Continue with Phone Number */}
                                <button
                                    type="button"
                                    onClick={() => setAuthMethod('phone')}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-light-border bg-white px-4 py-3 text-sm font-medium text-charcoal shadow-sm transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-300 mt-3"
                                >
                                    <Smartphone className="w-4.5 h-4.5 text-blue-600" />
                                    Continue with Phone Number
                                </button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-light-border" />
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-white px-4 text-warm-gray font-medium">or sign in with email</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {isRegister && loginMode === 'customer' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-charcoal mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                        )}

                        {isRegister && loginMode === 'customer' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-charcoal mb-1">
                                    Phone Number <span className="text-warm-gray text-xs font-normal">(optional)</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 rounded-lg border border-light-border bg-gray-50 text-sm text-warm-gray font-medium">
                                        +91
                                    </div>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="flex-1 rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-charcoal mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                placeholder={loginMode === 'admin' ? 'admin@example.com' : 'you@example.com'}
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-charcoal">
                                    Password
                                </label>
                                {!isRegister && loginMode === 'customer' && (
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-semibold text-burgundy hover:text-burgundy-dark transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 pr-10 text-sm focus:border-burgundy focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={3}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* ── Cloudflare Turnstile CAPTCHA ── */}
                        <div ref={turnstileRef} className="mb-4" />

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 ${loginMode === 'admin'
                                ? 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 shadow-sm'
                                : 'bg-burgundy hover:bg-burgundy-dark'
                                }`}
                        >
                            {loading
                                ? 'Please wait...'
                                : isRegister
                                    ? 'Create Account'
                                    : loginMode === 'admin'
                                        ? '🔐 Sign In as Admin'
                                        : 'Sign In'}
                        </button>

                        {/* Toggle login/register + Continue as Guest (only for customer mode) */}
                        {loginMode === 'customer' && (
                            <div className="mt-4 text-center space-y-2">
                                <p className="text-sm text-warm-gray">
                                    {isRegister
                                        ? 'Already have an account?'
                                        : "Don't have an account?"}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsRegister(!isRegister)}
                                        className="font-semibold text-burgundy hover:text-burgundy-dark hover:underline cursor-pointer"
                                    >
                                        {isRegister ? 'Sign In' : 'Create Account'}
                                    </button>
                                </p>
                                <p className="text-sm text-warm-gray">
                                    <Link
                                        href="/"
                                        className="font-semibold text-burgundy hover:text-burgundy-dark hover:underline cursor-pointer"
                                    >
                                        Continue as Guest
                                    </Link>
                                </p>
                            </div>
                        )}
                    </form>
                )}

                <p className="mt-6 text-center text-xs text-warm-gray">
                    By continuing, you agree to KSP Wines&apos; Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center px-4">
                <div className="w-8 h-8 border-2 border-burgundy/30 border-t-burgundy rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

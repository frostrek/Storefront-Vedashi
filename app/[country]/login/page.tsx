'use client';
import { authFetch, getLegalDocument, API_URL } from '@/lib/api';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    ShieldCheck, User, Smartphone, ArrowLeft,
    Eye, EyeOff, Mail, Lock, Check, Leaf
} from 'lucide-react';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import LegalModal from '@/components/ui/LegalModal';
import LegalContentRenderer from '@/components/ui/LegalContentRenderer';
import Select from 'react-select';
import { COUNTRY_CODES } from '@/lib/country-codes';
import { getDefaultCountry } from '@/lib/addressConfig';

// API_URL imported from @/lib/api
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? 'YOUR_SITE_KEY';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:4000';

type AuthMethod = 'email' | 'phone';

function LoginContent() {
    const router = useRouter();
    const { login, register, isAuthenticated, user, logout, loginFromVerification, isLoading } = useAuth();
    const { signOut: clerkSignOut } = useClerk();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('logout') === 'true') {
            logout(); // local Vedashi logout
            // Sign out of Clerk as well to prevent "already signed in" errors
            clerkSignOut().catch(() => { }).finally(() => {
                router.replace('/login');
            });
        }
    }, [searchParams, logout, router, clerkSignOut]);

    const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
    const [isRegister, setIsRegister] = useState(false);

    useEffect(() => {
        if (searchParams.get('mode') === 'register') {
            setIsRegister(true);
        } else if (searchParams.get('mode') === 'login') {
            setIsRegister(false);
        }
    }, [searchParams]);
    const [loading, setLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockOn, setCapsLockOn] = useState(false);

    const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.getModifierState) {
            setCapsLockOn(e.getModifierState('CapsLock'));
        }
    };

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [legalContent, setLegalContent] = useState<{ [key: string]: { title: string, content: string } }>({});

    useEffect(() => {
        const fetchLegal = async () => {
            const [terms, privacy] = await Promise.all([
                getLegalDocument('terms-of-service'),
                getLegalDocument('privacy-policy')
            ]);
            setLegalContent({
                'terms-of-service': terms ? { title: terms.title, content: terms.content } : { title: 'Terms of Service', content: '' },
                'privacy-policy': privacy ? { title: privacy.title, content: privacy.content } : { title: 'Privacy Policy', content: '' }
            });
        };
        fetchLegal();
    }, []);

    const defaultDialCode = (() => {
        const match = COUNTRY_CODES.find(c => c.code === getDefaultCountry());
        return match ? match.dial_code : '+91';
    })();
    const [phoneDialCode, setPhoneDialCode] = useState(defaultDialCode);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [isNewPhoneUser, setIsNewPhoneUser] = useState(false);
    const [phoneName, setPhoneName] = useState('');

    const isAdminRedirecting = useRef(false);

    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [captchaRequired, setCaptchaRequired] = useState(false);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderTurnstile = useCallback(() => {
        if (widgetIdRef.current !== null) {
            try { window.turnstile?.remove(widgetIdRef.current); } catch { /* noop */ }
            widgetIdRef.current = null;
        }
        if (!turnstileRef.current || !window.turnstile) return;
        const id = window.turnstile.render(turnstileRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => setTurnstileToken(token),
            'expired-callback': () => setTurnstileToken(null),
            'error-callback': () => {
                console.warn('[Turnstile] Widget error — CAPTCHA failed to load');
                setTurnstileToken(null);
            },
            theme: 'light',
        });
        widgetIdRef.current = id;
    }, []);

    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.turnstile) { clearInterval(interval); renderTurnstile(); }
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

    useEffect(() => {
        setTurnstileToken(null);
        // Defer to next tick — React needs to commit the conditional div to the DOM first
        const timer = setTimeout(() => renderTurnstile(), 0);
        return () => clearTimeout(timer);
    }, [isRegister, captchaRequired, renderTurnstile]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const redirectTo = searchParams.get('redirect') || '/account';

    useEffect(() => {
        if (isAdminRedirecting.current) return;
        if (isAuthenticated && user) {
            // If the user is an admin, don't redirect to customer page — wait for admin redirect
            const isAdmin = user.role === 'admin' || user.role === 'Super Admin';
            if (isAdmin) return;
            router.push(redirectTo);
        }
    }, [isAuthenticated, user, router, redirectTo]);

    const isAdminUser = user?.role === 'admin' || user?.role === 'Super Admin';

    if (isLoading || (isAuthenticated && !isAdminRedirecting.current && !isAdminUser) || isRedirecting) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d1f0d]/90 backdrop-blur-md">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#91C934] border-r-[#91C934]/50 animate-spin" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#91C934]/20 animate-pulse">
                        <Leaf className="h-8 w-8 text-[#91C934]" />
                    </div>
                </div>
                <div className="mt-8 flex flex-col items-center space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Securing your session
                    </h2>
                    <p className="text-sm font-medium text-[#91C934] animate-pulse">
                        Please wait while we prepare your account...
                    </p>
                </div>
            </div>
        );
    }

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
                body: JSON.stringify({ phone: `${phoneDialCode}${phoneNumber}` }),
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
                body: JSON.stringify({ phone: `${phoneDialCode}${phoneNumber}`, otp_code: otpCode, full_name: phoneName || undefined }),
            });
            const json = await res.json();
            if (res.ok && json.success && json.data?.customer) {
                toast.success('Welcome back!');
                loginFromVerification(json.data.customer);
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

    // ── Email/Password Submit ────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRegister && !agreeTerms) {
            toast.error('You must agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }
        setLoading(true);
        try {
            // Only block submission if CAPTCHA was explicitly required (registration or backend demanded it)
            if ((isRegister || captchaRequired) && !turnstileToken) {
                toast.error('Please complete the CAPTCHA verification.');
                setLoading(false);
                return;
            }
            if (isRegister) {
                if (form.password !== form.confirmPassword) {
                    toast.error('Passwords do not match');
                    setLoading(false);
                    return;
                }
                const result = await register(form.name, form.email, form.password, turnstileToken || undefined);
                if (result?.success) {
                    toast.success('Please verify your email to complete registration.');
                    setIsRedirecting(true);
                    setTimeout(() => {
                        router.push(`/verify-email?registered=true&email=${encodeURIComponent(form.email)}`);
                    }, 1500);
                } else {
                    if (result?.requireCaptcha) {
                        setCaptchaRequired(true);
                    }
                    toast.error(result?.error || 'Something went wrong');
                }
            } else {
                // Login: pass rememberMe and turnstile token (may be null if widget hasn't been solved yet)
                const result = await login(form.email, form.password, rememberMe, turnstileToken || undefined);
                if (result?.success) {
                    const isAdmin = ['admin', 'Super Admin', 'owner'].includes(result.role || '');
                    if (isAdmin) {
                        isAdminRedirecting.current = true;
                        toast.success('Welcome, Admin! Redirecting to dashboard...');
                        let userName = form.email.split('@')[0];
                        let userId = '';
                        try {
                            const stored = localStorage.getItem('vedashi_user');
                            if (stored) {
                                try {
                                    const userData = JSON.parse(stored);
                                    userName = userData.name || userName;
                                    userId = userData.id || '';
                                } catch (e) {
                                    console.error('Failed to parse vedashi_user in login:', e);
                                    localStorage.removeItem('vedashi_user');
                                }
                            }
                        } catch { /* noop */ }
                        // SECURITY: Do not pass raw JWT in URL params — use cookie-only auth
                        const params = new URLSearchParams({
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
                    // Handle security-related responses
                    if (result?.requireCaptcha) {
                        setCaptchaRequired(true);
                    }

                    if (result?.blocked) {
                        const minutes = result.retryAfter ? Math.ceil(result.retryAfter / 60) : 15;
                        toast.error(`Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
                    } else if (result?.requireCaptcha && !turnstileToken) {
                        toast.error('Please complete the CAPTCHA verification to continue.');
                        // Re-render Turnstile to ensure widget is visible
                        renderTurnstile();
                    } else {
                        toast.error(result?.error || 'Login failed. Please check your credentials.');
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

    const features = [
        'Personalized Ayurvedic Routines',
        'Sustainable Organic Ingredients',
        'Vedic Wellness Community Access',
    ];

    const avatarColors = ['#5a8c5a', '#3d6b3d', '#7aad7a', '#2d4d2d'];

    // ── Phone OTP View ───────────────────────────────────────────────
    const PhoneOTPCard = () => (
        <div className="bg-white/95 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none p-6 lg:p-0 w-full">
            <div className="flex flex-col items-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#91C934] flex items-center justify-center mb-4 shadow-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                    {otpSent ? 'Enter Your Code' : 'Sign in with Phone'}
                </h2>
                <p className="text-sm text-[#6b7b6b] mt-1">
                    {otpSent
                        ? `Code sent to ${phoneDialCode} ${phoneNumber}`
                        : "We'll send a verification code via SMS"}
                </p>
            </div>

            {!otpSent ? (
                <div>
                    <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider mb-2">
                        Phone Number
                    </label>
                    <div className="flex gap-2 mb-5">
                        <Select
                            options={COUNTRY_CODES.map(c => ({ value: c.dial_code, label: `${c.flag} ${c.dial_code}`, name: c.name }))}
                            value={{ value: phoneDialCode, label: `${COUNTRY_CODES.find(c => c.dial_code === phoneDialCode)?.flag || ''} ${phoneDialCode}` }}
                            onChange={(opt: any) => setPhoneDialCode(opt.value)}
                            className="w-[130px]"
                            styles={{
                                control: (provided: any, state: any) => ({
                                    ...provided,
                                    borderRadius: '12px',
                                    border: state.isFocused ? '1px solid #91C934' : '1px solid #d4e4d4',
                                    backgroundColor: '#f4f9f4',
                                    minHeight: '44px',
                                    boxShadow: 'none',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: '#91C934',
                                    },
                                }),
                                menu: (provided: any) => ({
                                    ...provided,
                                    zIndex: 50,
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                    border: '1px solid #d4e4d4',
                                    overflow: 'hidden',
                                }),
                                menuList: (provided: any) => ({
                                    ...provided,
                                    padding: '4px',
                                    maxHeight: '200px',
                                }),
                                option: (provided: any, state: any) => ({
                                    ...provided,
                                    backgroundColor: state.isSelected ? '#1e3d1e' : state.isFocused ? '#f4f9f4' : 'white',
                                    color: state.isSelected ? 'white' : '#1a1a1a',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    padding: '8px 10px',
                                    margin: '1px 0',
                                }),
                            }}
                            isSearchable
                            filterOption={(option: any, input: string) => {
                                if (!input) return true;
                                const q = input.toLowerCase();
                                return option.data.name?.toLowerCase().includes(q) || option.value.includes(q);
                            }}
                            components={{ IndicatorSeparator: () => null }}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                        />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="flex-1 rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] px-4 py-3 text-sm text-[#1a2a1a] placeholder-[#9ab09a] focus:border-[#91C934] focus:ring-2 focus:ring-[#91C934]/10 focus:outline-none transition-all"
                            placeholder="Enter 10-digit mobile number"
                            maxLength={10}
                            autoFocus
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSendPhoneOTP}
                        disabled={loading || phoneNumber.length < 10}
                        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white bg-[#91C934] hover:bg-[#82B52F] transition-all disabled:opacity-50 shadow-lg shadow-[#91C934]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                        ) : 'Send OTP'}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleVerifyPhoneOTP}>
                    {isNewPhoneUser && (
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider mb-2">Your Name</label>
                            <input
                                type="text"
                                value={phoneName}
                                onChange={e => setPhoneName(e.target.value)}
                                className="w-full rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] px-4 py-3 text-sm text-[#1a2a1a] placeholder-[#9ab09a] focus:border-[#91C934] focus:outline-none transition-all"
                                placeholder="Enter your name"
                            />
                            <p className="text-xs text-[#6b7b6b] mt-1">We&apos;ll create an account for you</p>
                        </div>
                    )}
                    <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider mb-2">Enter OTP</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] px-4 py-3 text-center text-xl tracking-[0.6em] font-mono text-[#1a2a1a] focus:border-[#91C934] focus:ring-2 focus:ring-[#91C934]/10 focus:outline-none transition-all mb-5"
                        placeholder="● ● ● ● ● ●"
                        maxLength={6}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading || otpCode.length < 4}
                        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white bg-[#91C934] hover:bg-[#82B52F] transition-all disabled:opacity-50 shadow-lg shadow-[#91C934]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                        ) : 'Verify & Sign In →'}
                    </button>
                    <div className="mt-4 text-center space-y-2">
                        {cooldown > 0 ? (
                            <p className="text-xs text-[#6b7b6b]">Resend OTP in <span className="font-semibold text-[#91C934]">{cooldown}s</span></p>
                        ) : (
                            <button type="button" onClick={handleSendPhoneOTP} disabled={loading} className="text-xs font-semibold text-[#91C934] hover:underline cursor-pointer disabled:cursor-not-allowed">
                                Resend OTP
                            </button>
                        )}
                        <div>
                            <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); }} className="text-xs text-[#6b7b6b] hover:text-[#91C934] hover:underline cursor-pointer">
                                Change phone number
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="mt-6 pt-5 border-t border-[#e8f0e8] flex flex-col items-center gap-3">
                <button
                    type="button"
                    onClick={() => { setAuthMethod('email'); setOtpSent(false); setOtpCode(''); setCaptchaRequired(false); setTurnstileToken(null); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#91C934] hover:text-[#82B52F] transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to email login
                </button>
                <p className="text-sm text-[#6b7b6b]">
                    Don&apos;t have an account?{' '}
                    <button type="button" onClick={() => { setIsRegister(true); setAuthMethod('email'); setCaptchaRequired(false); setTurnstileToken(null); }}
                        className="font-semibold text-[#91C934] hover:underline cursor-pointer">Create Account</button>
                </p>
                <Link href="/" className="text-sm font-semibold text-[#91C934] hover:underline cursor-pointer">Continue as Guest</Link>
            </div>
        </div>
    );

    const cardTitle = isRegister
        ? 'CREATE ACCOUNT'
        : 'WELCOME BACK!';

    const cardSubtitle = isRegister
        ? 'Join the Vedashi family'
        : 'Sign in to your account';

    return (
        <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-white">
            {/* ── Left Section: Brand Showcase ── */}
            <div className="relative hidden lg:flex lg:w-1/2 h-full flex-col overflow-hidden">
                {/* Background Image with Overlay */}
                {/* Solid Brand Background */}
                <div className="absolute inset-0 z-0 bg-[#91C934]" />

                {/* Content over background */}
                <div className="relative z-20 h-full flex flex-col p-5 lg:p-5">
                    <nav>
                        <a href="/">
                            <img src="/vedashi-logo.png" alt="Vedashi" className="h-14 lg:h-16 w-auto object-contain brightness-0 invert" />
                        </a>
                    </nav>
                </div>
            </div>

            {/* ── Right Section: Auth Forms ── */}
            <div className="w-full lg:w-1/2 h-full flex flex-col bg-white overflow-y-auto">
                {/* Mobile Header (Visible only on mobile) */}
                <div className="lg:hidden relative h-32 flex flex-col overflow-hidden">
                    <div className="absolute inset-0 z-0 bg-[#91C934]" />
                    <div className="relative z-20 p-8">
                        <a href="/">
                            <img src="/vedashi-logo.png" alt="Vedashi" className="h-10 w-auto object-contain brightness-0 invert" />
                        </a>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 xl:px-32 relative">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-6 right-6 lg:top-10 lg:right-10 flex items-center gap-2 text-[13px] font-bold text-[#91C934] hover:text-[#82B52F] transition-all cursor-pointer group"
                    >
                        Back
                    </button>

                    <div className="w-full max-w-md mx-auto">

                        {/* Phone OTP View */}
                        {authMethod === 'phone' && !isRegister ? (
                            <PhoneOTPCard />
                        ) : (
                            /* Main Login / Register Form */
                            <div className="bg-white/95 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none p-6 lg:p-0">

                                {/* Card header */}
                                <div className="flex flex-col items-center mb-4">
                                    <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">{cardTitle}</h2>
                                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#2d5a2d]/40 to-transparent mt-2" />
                                    <p className="text-sm text-[#6b7b6b] mt-2">{cardSubtitle}</p>
                                </div>

                                {/* Session expired banner */}
                                {searchParams.get('session_expired') === '1' && (
                                    <div id="session-expired-banner" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-800">Session expired</p>
                                            <p className="text-xs text-amber-700 mt-0.5">Your session expired due to inactivity. Please log in again.</p>
                                        </div>
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-0 mt-6">

                                    {/* Name field (register) */}
                                    {isRegister && (
                                        <div className="mb-4">
                                            <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                className="w-full rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] px-4 py-3 text-sm text-[#1a2a1a] placeholder-[#9ab09a] focus:border-[#91C934] focus:ring-2 focus:ring-[#91C934]/10 focus:outline-none transition-all"
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>
                                    )}



                                    {/* Email */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ab09a]" />
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="w-full rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] pl-10 pr-4 py-2.5 text-sm text-[#1a2a1a] placeholder-[#9ab09a] focus:border-[#91C934] focus:ring-2 focus:ring-[#91C934]/10 focus:outline-none transition-all"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="mb-3">
                                        <div className="mb-2">
                                            <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider">
                                                Password
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ab09a]" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                onKeyDown={handleKeyEvent}
                                                onKeyUp={handleKeyEvent}
                                                className="w-full rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] pl-10 pr-11 py-2.5 text-sm text-[#1a2a1a] placeholder-[#9ab09a] focus:border-[#91C934] focus:ring-2 focus:ring-[#91C934]/10 focus:outline-none transition-all"
                                                placeholder="••••••••"
                                                required
                                                minLength={3}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9ab09a] hover:text-[#4a6b4a] transition-colors cursor-pointer"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {capsLockOn && <p className="text-xs text-[#d45547] mt-1.5 font-medium animate-pulse">Caps Lock is ON</p>}
                                        {!isRegister && (
                                            <div className="flex justify-between items-center mt-3 mb-1">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${rememberMe ? 'bg-[#91C934] border-[#91C934]' : 'border-[#9ab09a] group-hover:border-[#91C934]'}`}>
                                                        {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                    </div>
                                                    <span className="text-sm font-medium text-[#91C934] group-hover:text-[#82B52F] transition-colors select-none">Remember Me</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={rememberMe}
                                                        onChange={e => setRememberMe(e.target.checked)}
                                                        className="hidden"
                                                    />
                                                </label>
                                                <Link href="/forgot-password" className="text-xs font-semibold text-[#91C934] hover:underline transition-colors cursor-pointer">
                                                    Forgot Password?
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    {isRegister && (
                                        <div className="mb-3">
                                            <div className="mb-2">
                                                <label className="block text-xs font-semibold text-[#3d3d3d] uppercase tracking-wider">
                                                    Confirm Password
                                                </label>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ab09a]" />
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={form.confirmPassword}
                                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                                    onKeyDown={handleKeyEvent}
                                                    onKeyUp={handleKeyEvent}
                                                    className="w-full rounded-xl border border-[#d4e4d4] bg-[#f8fdf8] pl-10 pr-11 py-2.5 text-sm text-[#1a2a1a] placeholder-[#9ab09a] focus:border-[#91C934] focus:ring-2 focus:ring-[#91C934]/10 focus:outline-none transition-all"
                                                    placeholder="••••••••"
                                                    required
                                                    minLength={3}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9ab09a] hover:text-[#4a6b4a] transition-colors cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Terms checkbox */}
                                    {isRegister && (
                                        <div className="flex items-start gap-2.5 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setAgreeTerms(!agreeTerms)}
                                                className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border transition-all cursor-pointer ${agreeTerms
                                                    ? 'bg-[#91C934] border-[#91C934]'
                                                    : 'bg-white border-[#d4e4d4] hover:border-[#91C934]'
                                                    }`}
                                            >
                                                {agreeTerms && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                            </button>
                                            <p className="text-xs text-[#6b7b6b] leading-relaxed">
                                                I agree to the{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTermsModal(true)}
                                                    className="text-[#91C934] font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                                                >
                                                    Terms of Service
                                                </button>
                                                {' '}and{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPrivacyModal(true)}
                                                    className="text-[#91C934] font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                                                >
                                                    Privacy Policy
                                                </button>.
                                            </p>
                                        </div>
                                    )}

                                    <LegalModal
                                        isOpen={showTermsModal}
                                        onClose={() => setShowTermsModal(false)}
                                        title={legalContent['terms-of-service']?.title || "Terms of Service"}
                                    >
                                        <LegalContentRenderer content={legalContent['terms-of-service']?.content || ''} />
                                    </LegalModal>

                                    <LegalModal
                                        isOpen={showPrivacyModal}
                                        onClose={() => setShowPrivacyModal(false)}
                                        title={legalContent['privacy-policy']?.title || "Privacy Policy"}
                                    >
                                        <LegalContentRenderer content={legalContent['privacy-policy']?.content || ''} />
                                    </LegalModal>

                                    {/* Cloudflare Turnstile */}
                                    {/* Always render Turnstile so token is ready before first submit */}
                                    {(
                                        <div className="mb-4 flex flex-col items-center min-h-[65px]">
                                            <div
                                                key={`turnstile-${isRegister ? 'reg' : 'login'}-${captchaRequired}`}
                                                ref={turnstileRef}
                                                className="flex justify-center"
                                            />
                                            {!turnstileToken && (
                                                <p className="text-xs text-[#9ab09a] mt-1 animate-pulse">
                                                    Loading security verification...
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* CTA Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:cursor-not-allowed bg-[#91C934] hover:bg-[#82B52F] shadow-[#91C934]/25"
                                    >
                                        {loading ? (
                                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait...</>
                                        ) : isRegister ? (
                                            'Create Account →'
                                        ) : (
                                            'Login →'
                                        )}
                                    </button>

                                    {/* Footer links + Social icon circles */}
                                    <div className="mt-1 pt-5 border-t border-[#e8f0e8]">
                                        {!isRegister && (
                                            <div className="text-center mb-4">
                                                <span className="text-xs font-semibold text-[#6b7b6b] uppercase tracking-wider">Or Continue With</span>
                                            </div>
                                        )}

                                        {/* Circle social buttons */}
                                        {!isRegister && (
                                            <div className="flex items-center justify-center gap-3 mb-5">
                                                {/* Google */}
                                                <button
                                                    type="button"
                                                    onClick={() => (document.querySelector('[data-social="google"]') as HTMLElement)?.click()}
                                                    disabled={loading}
                                                    title="Continue with Google"
                                                    className="w-10 h-10 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                </button>

                                                {/* Facebook */}
                                                <button
                                                    type="button"
                                                    onClick={() => (document.querySelector('[data-social="facebook"]') as HTMLElement)?.click()}
                                                    disabled={loading}
                                                    title="Continue with Facebook"
                                                    className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                </button>

                                                {/* Apple */}
                                                <button
                                                    type="button"
                                                    onClick={() => (document.querySelector('[data-social="apple"]') as HTMLElement)?.click()}
                                                    disabled={loading}
                                                    title="Continue with Apple"
                                                    className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                                                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
                                                    </svg>
                                                </button>

                                                {/* Phone */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAuthMethod('phone')}
                                                    disabled={loading}
                                                    title="Continue with Phone"
                                                    className="w-10 h-10 rounded-full bg-[#91C934] flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <Smartphone className="w-4.5 h-4.5 text-white" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="hidden">
                                            <SocialLoginButtons disabled={loading} />
                                        </div>

                                        <div className="text-center space-y-1">
                                            <p className="text-sm text-[#6b7b6b]">
                                                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                                                <button type="button" onClick={() => { setIsRegister(!isRegister); setCaptchaRequired(false); setTurnstileToken(null); }}
                                                    className="font-semibold text-[#91C934] hover:underline cursor-pointer">
                                                    {isRegister ? 'Sign In' : 'Create Account'}
                                                </button>
                                            </p>
                                            <p className="text-sm text-[#6b7b6b]">
                                                <Link href="/" className="font-semibold text-[#91C934] hover:underline cursor-pointer">
                                                    Continue as Guest
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#4a7c4a]/30 border-t-[#4a7c4a] rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
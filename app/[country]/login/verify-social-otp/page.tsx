'use client';
import { authFetch } from '@/lib/api';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'vedashi_token';
const USER_KEY = 'vedashi_user';

interface SocialOTPData {
    customer_id: string;
    email: string;
    full_name: string;
}

export default function VerifySocialOTPPage() {
    const [otpData, setOtpData] = useState<SocialOTPData | null>(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const params = useParams();
    const country = params.country as string || 'in';

    // Load data from sessionStorage
    useEffect(() => {
        const raw = sessionStorage.getItem('social_otp_data');
        if (raw) {
            try {
                setOtpData(JSON.parse(raw));
            } catch {
                window.location.href = `/${country}/login`;
            }
        } else {
            window.location.href = `/${country}/login`;
        }
    }, [country]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // Auto-focus first input
    useEffect(() => {
        if (otpData) inputRefs.current[0]?.focus();
    }, [otpData]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < text.length; i++) {
            newOtp[i] = text[i];
        }
        setOtp(newOtp);
        const focusIndex = Math.min(text.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const verifyOTP = useCallback(async () => {
        if (!otpData) return;
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code.');
            return;
        }

        setIsVerifying(true);
        try {
            const res = await authFetch(`${API_URL}/api/auth/social/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    customer_id: otpData.customer_id,
                    otp_code: otpCode,
                }),
            });

            const json = await res.json();

            console.log('[OTP Debug] Response status:', res.status, 'ok:', res.ok);
            console.log('[OTP Debug] Response JSON:', JSON.stringify(json, null, 2));
            console.log('[OTP Debug] json.success:', json.success);
            console.log('[OTP Debug] json.data?.customer:', json.data?.customer);

            if (res.ok && json.success && json.data?.customer) {
                // OTP verified → JWT issued → store EXACTLY how AuthContext expects
                const customer = json.data.customer;

                console.log('[OTP Debug] ✅ Verification successful! Customer:', customer);
                console.log('[OTP Debug] access_token present:', !!json.data.access_token);

                // Store access token
                if (json.data.access_token) {
                    localStorage.setItem(TOKEN_KEY, json.data.access_token);
                    console.log('[OTP Debug] ✅ Token stored in localStorage');
                } else {
                    console.error('[OTP Debug] ❌ NO access_token in response!');
                }

                // Store user info in the EXACT format AuthContext reads
                const userInfo = {
                    id: customer.customer_id,
                    name: customer.full_name,
                    email: customer.email,
                    role: customer.role || 'customer',
                    avatar_url: customer.avatar_url || undefined,
                    auth_method: customer.auth_method || 'social',
                    is_age_verified: false,
                    is_email_verified: true,
                    is_mobile_verified: false,
                };
                localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
                console.log('[OTP Debug] ✅ User info stored:', userInfo);

                // Verify localStorage was written
                console.log('[OTP Debug] localStorage TOKEN_KEY:', localStorage.getItem(TOKEN_KEY)?.substring(0, 20) + '...');
                console.log('[OTP Debug] localStorage USER_KEY:', localStorage.getItem(USER_KEY));

                // Clean up sessionStorage
                sessionStorage.removeItem('social_otp_data');

                toast.success('Email verified! Welcome to Vedashi.');

                // Full page reload → AuthContext reads from localStorage → user is logged in
                console.log(`[OTP Debug] 🚀 Redirecting to /${country} NOW...`);
                window.location.href = `/${country}`;
            } else {
                console.error('[OTP Debug] ❌ Verification failed:', json.message);
                toast.error(json.message || 'Invalid OTP code.');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            console.error('[OTP] Verify error:', err);
            toast.error('Verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    }, [otpData, otp]);

    // Auto-submit when all 6 digits entered
    useEffect(() => {
        if (otp.every(d => d !== '') && !isVerifying) {
            verifyOTP();
        }
    }, [otp, isVerifying, verifyOTP]);

    const resendOTP = async () => {
        if (!otpData || cooldown > 0) return;
        setIsResending(true);
        try {
            const res = await authFetch(`${API_URL}/api/auth/social/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ customer_id: otpData.customer_id }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                toast.success('New OTP sent! Check your email.');
                setCooldown(60);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                toast.error(json.message || 'Failed to resend OTP.');
            }
        } catch {
            toast.error('Failed to resend OTP.');
        } finally {
            setIsResending(false);
        }
    };

    if (!otpData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="animate-spin h-8 w-8 border-4 border-burgundy border-t-transparent rounded-full" />
            </div>
        );
    }

    const maskedEmail = otpData.email.replace(
        /(.{2})(.*)(@.*)/,
        (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream/80 px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#3B5D3B] px-6 py-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur mb-4">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-white">
                            Verify Your Email
                        </h1>
                        <p className="mt-2 text-sm text-white/80">
                            One last step to secure your account
                        </p>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-8">
                        <div className="flex items-center gap-2 mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                We sent a 6-digit code to <strong>{maskedEmail}</strong>
                            </p>
                        </div>

                        {/* OTP Input */}
                        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    disabled={isVerifying}
                                    className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-200 focus:border-burgundy focus:ring-2 focus:ring-burgundy/20 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                                    aria-label={`OTP digit ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Verify Button */}
                        <button
                            onClick={verifyOTP}
                            disabled={otp.some(d => d === '') || isVerifying}
                            className="w-full py-3 rounded-lg bg-[#3B5D3B] text-white font-semibold text-sm hover:bg-[#2D4A2D] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-4 w-4" />
                                    Verify & Continue
                                </>
                            )}
                        </button>

                        {/* Resend */}
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500 mb-2">
                                Didn&apos;t receive the code?
                            </p>
                            <button
                                onClick={resendOTP}
                                disabled={isResending || cooldown > 0}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3B5D3B] hover:text-[#2D4A2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                {cooldown > 0
                                    ? `Resend in ${cooldown}s`
                                    : isResending
                                        ? 'Sending...'
                                        : 'Resend Code'}
                            </button>
                        </div>

                        {/* Back to login */}
                        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('social_otp_data');
                                    window.location.href = `/${country}/login`;
                                }}
                                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to login
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-4 text-center text-xs text-gray-400">
                    This verification helps us keep your account secure.
                    <br />
                    The code expires in 10 minutes.
                </p>
            </div>
        </div>
    );
}

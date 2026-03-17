'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sendVerificationEmail, verifyEmail, createCart } from '@/lib/api';
import { Mail, Loader2, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isLoading: authLoading, loginFromVerification } = useAuth();

    const isFromRegistration = searchParams.get('registered') === 'true';
    const emailFromUrl = searchParams.get('email');
    const emailToUse = user?.email || emailFromUrl;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    // If coming from registration, an OTP was just sent.
    const [cooldown, setCooldown] = useState(isFromRegistration ? 60 : 0);
    const [otpSent, setOtpSent] = useState(isFromRegistration);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Removed: Redirect if not authenticated because during registration flow, 
    // the user is purposefully NOT authenticated until they verify and log in.

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Auto-send OTP on mount
    const handleSendOtp = useCallback(async () => {
        if (sending || cooldown > 0) return;
        setSending(true);
        try {
            const res = await sendVerificationEmail(emailToUse || undefined);
            if (res.success) {
                setOtpSent(true);
                setCooldown(60);
                toast.success('Verification code sent to your email!');
            } else if (res.message?.includes('already verified')) {
                setStatus('success');
                toast.success('Email is already verified!');
            } else {
                toast.error(res.message || 'Failed to send verification code');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setSending(false);
        }
    }, [sending, cooldown]);

    useEffect(() => {
        // If they just landed here and haven't had an OTP sent yet, and are authenticated 
        // OR we have their email from the URL, try to send one.
        if (!otpSent && status !== 'success' && emailToUse) {
            handleSendOtp();
        }
    }, [emailToUse, otpSent, status, handleSendOtp]);

    // OTP input handlers
    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setErrorMessage('');
        setStatus('idle');

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
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    // Submit OTP
    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setErrorMessage('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        try {
            const res = await verifyEmail(code, emailToUse || undefined);
            if (res.success) {
                setStatus('success');

                // Check if this was a new account creation (deferred registration)
                if (res.data?.account_created && res.data?.customer) {
                    // Log in the user via AuthContext
                    loginFromVerification(res.data.customer, res.data.access_token);

                    // Create cart for the new user
                    try {
                        await createCart(res.data.customer.customer_id);
                        console.log('✅ Cart created for:', res.data.customer.customer_id);
                    } catch (cartErr) {
                        console.warn('⚠️ Cart creation failed:', cartErr);
                    }

                    toast.success('Account created & verified! Welcome!');
                    setTimeout(() => router.push('/account'), 2000);
                } else {
                    // Existing user just verifying email
                    toast.success('Email verified successfully!');
                    setTimeout(() => router.push('/account'), 2000);
                }
            } else {
                setStatus('error');
                setErrorMessage(res.message || 'Invalid verification code');
            }
        } catch {
            setStatus('error');
            setErrorMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Retry OTP — clear inputs and refocus
    const handleRetry = () => {
        setOtp(['', '', '', '', '', '']);
        setStatus('idle');
        setErrorMessage('');
        inputRefs.current[0]?.focus();
    };

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        if (otp.every(d => d !== '') && status === 'idle' && !loading) {
            handleVerify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Back button */}
                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Account
                </button>

                <div className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm">
                    {/* Header gradient */}
                    <div
                        className="py-8 px-6 text-center"
                        style={{ background: 'linear-gradient(135deg, #6B2737 0%, #8B3A4A 40%, #D4A847 100%)' }}
                    >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                            {status === 'success' ? (
                                <CheckCircle2 className="h-8 w-8 text-green-300" />
                            ) : status === 'error' ? (
                                <XCircle className="h-8 w-8 text-red-300" />
                            ) : (
                                <Mail className="h-8 w-8 text-white" />
                            )}
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-white">
                            {status === 'success' ? 'Email Verified!' : 'Verify Your Email'}
                        </h1>
                        <p className="mt-2 text-sm text-white/80">
                            {status === 'success'
                                ? 'Your email has been verified successfully'
                                : `We sent a 6-digit code to ${emailToUse || 'your email'}`}
                        </p>
                    </div>

                    <div className="p-6">
                        {status === 'success' ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-warm-gray mb-4">Redirecting to login...</p>
                                <Loader2 className="h-5 w-5 animate-spin text-burgundy mx-auto" />
                            </div>
                        ) : (
                            <>
                                {/* OTP Input */}
                                <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleChange(i, e.target.value)}
                                            onKeyDown={e => handleKeyDown(i, e)}
                                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none
                                                ${status === 'error'
                                                    ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-500'
                                                    : digit
                                                        ? 'border-burgundy/40 bg-burgundy/5 text-charcoal focus:border-burgundy'
                                                        : 'border-light-border bg-white text-charcoal focus:border-burgundy'
                                                }`}
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>

                                {/* Error message + Retry / Guest options */}
                                {errorMessage && (
                                    <div className="mb-4">
                                        <p className="text-center text-sm text-red-500 mb-4 flex items-center justify-center gap-1.5">
                                            <XCircle className="h-3.5 w-3.5" />
                                            {errorMessage}
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleRetry}
                                                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md"
                                                style={{ backgroundColor: '#6B2737' }}
                                            >
                                                <RefreshCw className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                                                Retry OTP
                                            </button>
                                            <button
                                                onClick={() => { router.push('/'); }}
                                                className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-light-border text-charcoal hover:bg-cream transition-colors"
                                            >
                                                <Eye className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                                                Continue as Guest
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Verify button — only show when no error */}
                                {status !== 'error' && (
                                    <button
                                        onClick={handleVerify}
                                        disabled={loading || otp.some(d => d === '')}
                                        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
                                        style={{ backgroundColor: '#6B2737' }}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                                            </span>
                                        ) : (
                                            'Verify Email'
                                        )}
                                    </button>
                                )}

                                {/* Resend */}
                                <div className="text-center mt-5">
                                    <p className="text-xs text-warm-gray mb-2">Didn&apos;t receive the code?</p>
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={sending || cooldown > 0}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-burgundy hover:text-burgundy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${sending ? 'animate-spin' : ''}`} />
                                        {cooldown > 0
                                            ? `Resend in ${cooldown}s`
                                            : sending
                                                ? 'Sending...'
                                                : 'Resend Code'}
                                    </button>
                                </div>

                                {/* Continue as Guest — always visible */}
                                <div className="mt-4 pt-4 border-t border-light-border text-center">
                                    <button
                                        onClick={() => router.push('/')}
                                        className="text-xs font-medium text-warm-gray hover:text-charcoal transition-colors"
                                    >
                                        Skip for now — Continue as Guest
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

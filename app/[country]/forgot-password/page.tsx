'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { forgotPassword } from '@/lib/api';
import { ArrowLeft, Mail } from 'lucide-react';

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Pre-fill email from ?email= query param (e.g. from security alert email)
    useEffect(() => {
        const prefill = searchParams.get('email');
        if (prefill) setEmail(decodeURIComponent(prefill));
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);

        try {
            const result = await forgotPassword(email);
            if (result?.success) {
                setSubmitted(true);
            } else {
                toast.error(result?.error || result?.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Password reset request error:', error);
            toast.error('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white flex flex-col items-center pt-10 md:pt-16 px-4 pb-25 min-h-screen">
            <div className="w-full max-w-md">

                <Link href="/login" className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-warm-gray hover:text-[#91cA34] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>

                <div className="rounded-2xl border border-light-border bg-white p-8 md:p-10 shadow-sm">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#91cA34]/10 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-[#91cA34]" />
                        </div>
                        <h1 className="text-3xl font-bold text-charcoal">
                            Forgot Password
                        </h1>
                        <p className="mt-2 text-sm text-warm-gray">
                            {submitted
                                ? "Check your email for the reset link"
                                : "Enter your email and we'll send you a link to reset your password."}
                        </p>
                    </div>

                    {submitted ? (
                        <div className="text-center">
                            <p className="text-sm text-charcoal mb-6">
                                We've sent an email to <strong className="font-semibold">{email}</strong> with a link to reset your password. It may take a few minutes to arrive.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full rounded-lg bg-[#91cA34] py-3 text-sm font-semibold text-charcoal transition-all hover:opacity-90"
                            >
                                Return to Login
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                        >
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-charcoal mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#91cA34] focus:outline-none focus:ring-1 focus:ring-[#91cA34]"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full rounded-lg bg-[#91cA34] py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="w-8 h-8 border-2 border-[#91cA34]/30 border-t-[#91cA34] rounded-full animate-spin" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}

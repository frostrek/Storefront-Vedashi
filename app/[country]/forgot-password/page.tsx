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
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                <Link href="/login" className="inline-flex items-center gap-2 mb-8 text-sm font-medium text-warm-gray hover:text-burgundy transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-burgundy/10 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-burgundy" />
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
                    <div className="rounded-2xl border border-light-border bg-white p-8 shadow-sm text-center">
                        <p className="text-sm text-charcoal mb-6">
                            We've sent an email to <strong className="font-semibold">{email}</strong> with a link to reset your password. It may take a few minutes to arrive.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full rounded-lg bg-charcoal py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-light-border bg-white p-8 shadow-sm"
                    >
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-charcoal mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full rounded-lg bg-burgundy py-3 text-sm font-semibold text-white transition-all hover:bg-burgundy-dark disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center px-4">
                <div className="w-8 h-8 border-2 border-burgundy/30 border-t-burgundy rounded-full animate-spin" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { resetPassword } from '@/lib/api';
import { KeyRound, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        new_password: '',
        confirm_password: '',
    });
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Invalid or missing reset token');
            return;
        }

        if (passwords.new_password !== passwords.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwords.new_password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            const result = await resetPassword(token, passwords.new_password);
            if (result?.success) {
                setSuccess(true);
                toast.success('Password reset successfully');
            } else {
                toast.error(result?.error || result?.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            toast.error('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !success) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                        <KeyRound className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-charcoal mb-4">
                        Invalid Link
                    </h1>
                    <p className="text-sm text-warm-gray mb-8">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="inline-flex items-center justify-center w-full rounded-lg bg-burgundy py-3 text-sm font-semibold text-white transition-all hover:bg-burgundy-dark"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-burgundy/10 flex items-center justify-center">
                        <KeyRound className="w-8 h-8 text-burgundy" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-charcoal">
                        Set New Password
                    </h1>
                    <p className="mt-2 text-sm text-warm-gray">
                        {success
                            ? "Your password has been successfully reset."
                            : "Please enter your new password below."}
                    </p>
                </div>

                {success ? (
                    <div className="rounded-2xl border border-light-border bg-white p-8 shadow-sm text-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full rounded-lg bg-burgundy py-3 text-sm font-semibold text-white transition-all hover:bg-burgundy-dark"
                        >
                            Sign In to Your Account
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-light-border bg-white p-8 shadow-sm"
                    >
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-charcoal mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwords.new_password}
                                onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-charcoal mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwords.confirm_password}
                                onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !passwords.new_password || !passwords.confirm_password}
                            className="w-full rounded-lg bg-burgundy py-3 text-sm font-semibold text-white transition-all hover:bg-burgundy-dark disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="mt-6 text-center">
                            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-warm-gray hover:text-burgundy transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center px-4">
                <div className="w-8 h-8 border-2 border-burgundy/30 border-t-burgundy rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}

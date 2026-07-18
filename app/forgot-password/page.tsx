'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPassword, API_URL } from '@/lib/api';
import { RU_DICTIONARY } from '@/content/ru';
import { ROUTES } from '@/lib/routes';

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
            toast.error(RU_DICTIONARY.toast.enterEmailAddress);
            return;
        }

        setLoading(true);

        try {
            const result = await forgotPassword(email);
            if (result?.success) {
                setSubmitted(true);
            } else {
                toast.error(result?.error || result?.message || RU_DICTIONARY.toast.somethingWentWrong);
            }
        } catch (error) {
            console.error('Password reset request error:', error);
            toast.error(RU_DICTIONARY.toast.serverError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white flex flex-col items-center pt-10 md:pt-16 px-4 pb-25 min-h-screen">
            <div className="w-full max-w-md">

                <Link href={ROUTES.login} className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-warm-gray hover:text-[#91C934] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {RU_DICTIONARY.auth.back}
                </Link>

                <div className="rounded-2xl border border-light-border bg-white p-8 md:p-10 shadow-sm">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#91C934]/10 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-[#91C934]" />
                        </div>
                        <h1 className="text-3xl font-bold text-charcoal">
                            {RU_DICTIONARY.auth.forgotPasswordTitle}
                        </h1>
                        <p className="mt-2 text-sm text-warm-gray">
                            {submitted
                                ? RU_DICTIONARY.auth.checkEmailResetLink
                                : RU_DICTIONARY.auth.enterEmailResetLink}
                        </p>
                    </div>

                    {submitted ? (
                        <div className="text-center">
                            <p className="text-sm text-charcoal mb-6">
                                {RU_DICTIONARY.auth.weSentEmailTo} <strong className="font-semibold">{email}</strong> {RU_DICTIONARY.auth.withResetLink}
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full rounded-lg bg-[#91cA34] py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                            >
                                {RU_DICTIONARY.auth.returnToLogin}
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                        >
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-charcoal mb-1">
                                    {RU_DICTIONARY.auth.emailAddress}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#91C934] focus:outline-none focus:ring-1 focus:ring-[#91C934]"
                                    placeholder={RU_DICTIONARY.auth.emailPlaceholder}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full rounded-lg bg-[#91cA34] py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed"
                            >
                                {loading ? RU_DICTIONARY.auth.sending : RU_DICTIONARY.auth.sendResetLink}
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
                <div className="w-8 h-8 border-2 border-[#91C934]/30 border-t-[#91C934] rounded-full animate-spin" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}

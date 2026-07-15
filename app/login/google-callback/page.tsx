'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authFetch, API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { Leaf } from 'lucide-react';

/**
 * Google OAuth Callback Page
 *
 * Handles the redirect from Google's OAuth consent screen.
 * Reads the `code` query parameter and exchanges it with our backend's
 * POST /api/auth/social/google/callback endpoint.
 *
 * Response handling mirrors sso-complete/page.tsx:
 *   - pending_verification → redirect to verify-social-otp
 *   - success + customer   → store user, redirect to account
 *   - error               → redirect to login with toast
 *
 * Does NOT import or depend on @clerk/* in any way.
 */

function GoogleCallbackContent() {
    const searchParams = useSearchParams();
    const params = useParams();
    const country = (params?.country as string) || 'in';
    const { loginFromVerification } = useAuth();
    const processedRef = useRef(false);
    const [status, setStatus] = useState('Connecting to your account...');

    useEffect(() => {
        if (processedRef.current) return;

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // Handle Google OAuth error (user cancelled, etc.)
        if (error || !code) {
            processedRef.current = true;
            const errorDesc = searchParams.get('error_description') || 'Google login was cancelled or failed.';
            toast.error(errorDesc);
            window.location.href = `/login`;
            return;
        }

        const exchangeCode = async () => {
            processedRef.current = true;

            try {
                setStatus('Verifying your identity...');

                // Send authorization code to our backend
                const res = await authFetch(`${API_URL}/api/auth/social/google/callback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ code }),
                });

                const data = await res.json();

                if (data.success && data.data?.customer) {
                    // All users (new + returning) get JWT immediately — no OTP required
                    setStatus('Welcome! Redirecting...');

                    loginFromVerification(data.data.customer);

                    if (data.data.is_new_user) {
                        toast.success('Account created! Welcome to Vedashi 🌿');
                    } else if (data.data.account_linked) {
                        toast.success('Google account linked to your existing account!');
                    } else {
                        toast.success('Welcome back!');
                    }

                    setTimeout(() => {
                        window.location.href = `/`;
                    }, 100);
                } else {
                    // Login failed
                    toast.error(data.message || data.error || 'Google login failed. Please try again.');
                    window.location.href = `/login`;
                }
            } catch (err) {
                console.error('[Google Callback] Error:', err);
                toast.error('Something went wrong during Google login.');
                window.location.href = `/login`;
            }
        };

        exchangeCode();
    }, [searchParams, country, loginFromVerification]);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream backdrop-blur-md">
            <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-burgundy border-r-burgundy/50 animate-spin" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 animate-pulse">
                    <Leaf className="h-8 w-8 text-herbal-green" />
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center space-y-2">
                <h2 className="text-2xl font-bold text-charcoal tracking-tight">
                    Signing you in...
                </h2>
                <p className="text-sm font-medium text-warm-gray animate-pulse">
                    {status}
                </p>
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream backdrop-blur-md">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-burgundy border-r-burgundy/50 animate-spin" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 animate-pulse">
                        <Leaf className="h-8 w-8 text-herbal-green" />
                    </div>
                </div>
                <div className="mt-8 flex flex-col items-center space-y-2">
                    <h2 className="text-2xl font-bold text-charcoal tracking-tight">
                        Signing you in...
                    </h2>
                    <p className="text-sm font-medium text-warm-gray animate-pulse">
                        Connecting to your account...
                    </p>
                </div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}

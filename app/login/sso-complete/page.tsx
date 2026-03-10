'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, useClerk } from '@clerk/nextjs';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Wine } from 'lucide-react';

/**
 * SSO Complete Page — Step 2 of 2
 *
 * At this point Clerk has successfully authenticated the user via OAuth.
 * This page:
 *   1. Gets the active Clerk session token
 *   2. Sends it to our backend's /api/auth/social/login
 *   3. For RETURNING users → stores JWT → redirects to /account
 *   4. For NEW users → redirects to /login/verify-social-otp (OTP required)
 *
 * Uses window.location.href (not router.push) to avoid flash/flicker issues.
 */

export default function SSOCompletePage() {
    const { session, isLoaded: sessionLoaded } = useSession();
    const { signOut } = useClerk();
    const { socialLogin } = useAuth();
    const processedRef = useRef(false);
    const [status, setStatus] = useState('Connecting to your account...');

    useEffect(() => {
        if (!sessionLoaded || processedRef.current) return;

        const handleTokenExchange = async () => {
            processedRef.current = true;

            try {
                if (!session) {
                    toast.error('No active session found. Please try again.');
                    window.location.href = '/login';
                    return;
                }

                setStatus('Getting authentication token...');

                // 1. Get Clerk session JWT token
                const clerkToken = await session.getToken();

                if (!clerkToken) {
                    toast.error('Failed to get authentication token. Please try again.');
                    window.location.href = '/login';
                    return;
                }

                setStatus('Verifying your identity...');

                // 2. Exchange Clerk token for our backend JWT
                const result = await socialLogin(clerkToken);

                // 3. Sign out of Clerk AFTER we have the result
                //    Use try/catch — non-critical if it fails
                try { await signOut(); } catch { /* Clerk session will expire */ }

                // 4. Handle result — use window.location.href to avoid React flash
                if (result.success && result.pending_verification) {
                    // NEW USER → OTP verification required
                    sessionStorage.setItem('social_otp_data', JSON.stringify({
                        customer_id: result.customer_id,
                        email: result.email,
                        full_name: result.full_name,
                    }));
                    setStatus('Redirecting to verification...');
                    // Use window.location for clean redirect — no flash
                    window.location.href = '/login/verify-social-otp';
                } else if (result.success) {
                    // RETURNING USER → JWT issued, logged in
                    setStatus('Welcome back! Redirecting...');
                    if (result.account_linked) {
                        toast.success('Social account linked to your existing account!');
                    } else {
                        toast.success('Welcome back!');
                    }
                    // Full page load ensures AuthContext initializes from localStorage
                    window.location.href = '/account';
                } else {
                    toast.error(result.error || 'Social login failed.');
                    window.location.href = '/login';
                }
            } catch (err) {
                console.error('[SSO Complete] Error:', err);
                toast.error('Something went wrong during social login.');
                window.location.href = '/login';
            }
        };

        handleTokenExchange();
    }, [sessionLoaded, session, socialLogin, signOut]);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream backdrop-blur-md">
            <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-burgundy border-r-burgundy/50 animate-spin" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 animate-pulse">
                    <Wine className="h-8 w-8 text-burgundy" />
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center space-y-2">
                <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
                    Securing your session...
                </h2>
                <p className="text-sm font-medium text-warm-gray animate-pulse">
                    {status}
                </p>
            </div>
        </div>
    );
}

'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Social Login Buttons
 *
 * Uses Clerk ONLY for OAuth (Google, Facebook, Apple).
 * 
 * Key: Uses signUp.authenticateWithRedirect (NOT signIn) because:
 *   - signIn fails if user doesn't have a Clerk account → shows Clerk's sign-up form
 *   - signUp with OAuth strategy goes DIRECTLY to Google (no Clerk form)
 *   - If user already has a Clerk account, Clerk auto-transfers to signIn
 */

interface SocialLoginButtonsProps {
    onLoadingChange?: (loading: boolean) => void;
    disabled?: boolean;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
);

export default function SocialLoginButtons({ onLoadingChange, disabled }: SocialLoginButtonsProps) {
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    const isReady = signInLoaded && signUpLoaded;

    const handleSocialLogin = async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
        if (!isReady || !signUp || !signIn) {
            toast.error('Social login is not ready. Please wait a moment.');
            return;
        }

        const providerName = strategy.replace('oauth_', '');
        setLoadingProvider(providerName);
        onLoadingChange?.(true);

        try {
            // Use signUp.authenticateWithRedirect for OAuth:
            // - For NEW users: creates Clerk account via OAuth (goes DIRECTLY to Google)
            // - For EXISTING users: Clerk auto-detects and transfers to signIn
            // This avoids Clerk's hosted sign-up form entirely
            await signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: '/login/sso-callback',
                redirectUrlComplete: '/login/sso-complete',
            });
        } catch (err: unknown) {
            // If user already exists in Clerk, fall back to signIn
            const clerkError = err as { errors?: Array<{ code: string }> };
            if (clerkError?.errors?.[0]?.code === 'form_identifier_exists') {
                try {
                    await signIn.authenticateWithRedirect({
                        strategy,
                        redirectUrl: '/login/sso-callback',
                        redirectUrlComplete: '/login/sso-complete',
                    });
                    return;
                } catch (signInErr) {
                    console.error(`[Social Login] signIn fallback failed:`, signInErr);
                }
            }

            console.error(`[Social Login] ${providerName} error:`, err);
            const message = err instanceof Error ? err.message : 'Social login failed';
            toast.error(message);
            setLoadingProvider(null);
            onLoadingChange?.(false);
        }
    };

    const providers = [
        { key: 'oauth_google' as const, label: 'Google', icon: <GoogleIcon />, bg: 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700' },
        { key: 'oauth_facebook' as const, label: 'Facebook', icon: <FacebookIcon />, bg: 'bg-[#1877F2] hover:bg-[#166FE5] border-[#1877F2] text-white' },
        { key: 'oauth_apple' as const, label: 'Apple', icon: <AppleIcon />, bg: 'bg-black hover:bg-gray-900 border-black text-white' },
    ];

    return (
        <div className="space-y-3">
            <div id="clerk-captcha" />

            {providers.map(({ key, label, icon, bg }) => (
                <button
                    key={key}
                    type="button"
                    data-social={label.toLowerCase()}
                    onClick={() => handleSocialLogin(key)}
                    disabled={disabled || !isReady || !!loadingProvider}
                    className={`w-full flex items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${bg}`}
                >
                    {loadingProvider === key.replace('oauth_', '') ? (
                        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                        icon
                    )}
                    <span>Continue with {label}</span>
                </button>
            ))}
        </div>
    );
}

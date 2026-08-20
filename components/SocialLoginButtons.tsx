'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RU_DICTIONARY } from '@/content/ru';

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

export default function SocialLoginButtons({ onLoadingChange, disabled }: SocialLoginButtonsProps) {
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    // ── Direct Google OAuth (no Clerk) ────────────────────────────────
    const handleGoogleLogin = () => {
        setLoadingProvider('google');
        onLoadingChange?.(true);

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            toast.error('Google login is not configured. Please contact support.');
            setLoadingProvider(null);
            onLoadingChange?.(false);
            return;
        }

        const oauthParams = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'select_account',
        });

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${oauthParams.toString()}`;
    };

    // Listen for custom trigger events from parent
    useEffect(() => {
        const handleExternalTrigger = (e: any) => {
            const provider = e.detail;
            if (provider === 'google') handleGoogleLogin();
        };

        window.addEventListener('trigger-social-login', handleExternalTrigger);
        return () => window.removeEventListener('trigger-social-login', handleExternalTrigger);
    }, []);

    return (
        <div className="space-y-3">
            <button
                type="button"
                data-social="google"
                onClick={handleGoogleLogin}
                disabled={disabled || !!loadingProvider}
                className="w-full flex items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
            >
                {loadingProvider === 'google' ? (
                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                <span>{RU_DICTIONARY.auth.continueWithGoogle || "Продолжить с Google"}</span>
            </button>
        </div>
    );
}

'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Wine } from 'lucide-react';

/**
 * SSO Callback Page — Step 1 of 2
 *
 * This is the intermediate page where Clerk processes the OAuth response
 * from the provider (Google, Facebook, Apple).
 *
 * AuthenticateWithRedirectCallback handles ALL cases:
 *   - New user via signUp → creates Clerk account → redirects to sso-complete
 *   - Existing user via signIn → authenticates → redirects to sso-complete
 *   - Transfer (signUp detects existing user → auto-transfers to signIn)
 *
 * After Clerk finishes processing, it redirects to /login/sso-complete.
 */

export default function SSOCallbackPage() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream/90 backdrop-blur-md">
            {/* Clerk processes the OAuth callback automatically.
                Both signIn and signUp redirect URLs point to sso-complete. */}
            <AuthenticateWithRedirectCallback
                signInForceRedirectUrl="/login/sso-complete"
                signUpForceRedirectUrl="/login/sso-complete"
                signInFallbackRedirectUrl="/login/sso-complete"
                signUpFallbackRedirectUrl="/login/sso-complete"
            />

            {/* Loading UI while Clerk processes */}
            <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-burgundy border-r-burgundy/50 animate-spin" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 animate-pulse">
                    <Wine className="h-8 w-8 text-burgundy" />
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center space-y-2">
                <h2 className="font-serif text-2xl font-bold text-charcoal tracking-tight">
                    Verifying your account...
                </h2>
                <p className="text-sm font-medium text-warm-gray animate-pulse">
                    Please wait while we complete sign in...
                </p>
            </div>
        </div>
    );
}

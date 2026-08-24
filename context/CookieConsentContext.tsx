'use client';
import { authFetch, API_URL } from '@/lib/api';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConsentCategories {
    strictly_necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
}

interface CookieConsentContextType {
    consent: ConsentCategories | null;
    showBanner: boolean;
    updateConsent: (newConsent: ConsentCategories) => Promise<void>;
    acceptAll: () => Promise<void>;
    rejectAll: () => Promise<void>;
    openSettings: () => void;
    closeSettings: () => void;
    isSettingsOpen: boolean;
}

const defaultConsent: ConsentCategories = {
    strictly_necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

// API URL from env
// API_URL imported from @/lib/api

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [consent, setConsent] = useState<ConsentCategories | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        // Checking for local cookie (set by backend, accessible by frontend)
        const match = document.cookie.match(new RegExp('(^| )gdpr_consent=([^;]+)'));
        if (match) {
            try {
                const parsedConsent = JSON.parse(decodeURIComponent(match[2]));
                 
                setConsent(parsedConsent);
                setShowBanner(false);
            } catch {
                setShowBanner(true); // Parse failed, show banner
            }
        } else {
            setShowBanner(true); // No cookie, show banner
        }
    }, []);

    const updateConsent = async (newConsent: ConsentCategories) => {
        try {
            // Optimistically update UI
            setConsent(newConsent);
            setShowBanner(false);
            setIsSettingsOpen(false);

            // Fix: Explicitly set cookie on frontend domain to persist across refreshes
            const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `gdpr_consent=${encodeURIComponent(JSON.stringify(newConsent))}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax${secureFlag}`;

            // Send to backend to track logs and set cookies
            await authFetch(`${API_URL}/api/gdpr/consent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important to send/receive session cookies
                body: JSON.stringify({
                    categories: newConsent,
                    policy_version: '1.0.0' // Should match DB seeded version
                })
            });
        } catch (error) {
            console.error('Failed to save GDPR consent', error);
        }
    };

    const acceptAll = async () => {
        await updateConsent({
            strictly_necessary: true,
            analytics: true,
            marketing: true,
            preferences: true
        });
    };

    const rejectAll = async () => {
        await updateConsent(defaultConsent);
    };

    const openSettings = () => {
        setIsSettingsOpen(true);
    };

    const closeSettings = () => {
        setIsSettingsOpen(false);
    };

    return (
        <CookieConsentContext.Provider value={{
            consent,
            showBanner,
            updateConsent,
            acceptAll,
            rejectAll,
            openSettings,
            closeSettings,
            isSettingsOpen
        }}>
            {children}
        </CookieConsentContext.Provider>
    );
}

export function useCookieConsent() {
    const context = useContext(CookieConsentContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
}

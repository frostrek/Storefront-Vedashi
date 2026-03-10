'use client';

import React, { useState } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { Shield, X, Check } from 'lucide-react';

export default function CookieBanner() {
    const { showBanner, acceptAll, rejectAll, openSettings, isSettingsOpen, closeSettings, updateConsent, consent } = useCookieConsent();

    // Local state for the settings modal
    const [localConsent, setLocalConsent] = useState({
        strictly_necessary: true,
        analytics: consent?.analytics || false,
        marketing: consent?.marketing || false,
        preferences: consent?.preferences || false,
    });

    if (!showBanner && !isSettingsOpen) return null;

    const handleSaveSettings = () => {
        updateConsent(localConsent);
    };

    return (
        <>
            {/* ── BANNER ── */}
            {showBanner && !isSettingsOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 md:p-6 animate-in slide-in-from-bottom flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                            <Shield className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <h3 className="text-gray-900 font-semibold text-base mb-1">Your privacy matters</h3>
                            <p className="text-gray-600 text-sm max-w-3xl">
                                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience.
                                By clicking Accept, you agree to this, as outlined in our <a href="/privacy-policy" className="text-emerald-700 hover:underline">Cookie Policy</a>.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                        <button
                            onClick={openSettings}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto"
                        >
                            Manage Preferences
                        </button>
                        <button
                            onClick={rejectAll}
                            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors w-full sm:w-auto"
                        >
                            Reject Non-Essential
                        </button>
                        <button
                            onClick={acceptAll}
                            className="px-6 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors w-full sm:w-auto"
                        >
                            Accept All
                        </button>
                    </div>
                </div>
            )}

            {/* ── SETTINGS MODAL ── */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-700" />
                                Privacy Preferences
                            </h2>
                            <button onClick={closeSettings} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            <p className="text-sm text-gray-600 mb-4">
                                You can choose which cookies to allow. You can change these settings at any time by visiting via the link in our footer.
                            </p>

                            {/* Strictly Necessary */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                <div className="pr-4">
                                    <h4 className="font-semibold text-gray-900">Strictly Necessary Cookies</h4>
                                    <p className="text-xs text-gray-500 mt-1">These cookies are required for the website to function and cannot be switched off.</p>
                                </div>
                                <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                                    <Check className="w-4 h-4" /> Always Active
                                </div>
                            </div>

                            {/* Analytics */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                <div className="pr-4">
                                    <h4 className="font-semibold text-gray-900">Analytics & Performance Options</h4>
                                    <p className="text-xs text-gray-500 mt-1">Help us improve our website by collecting and reporting information on how you use it.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={localConsent.analytics}
                                        onChange={(e) => setLocalConsent({ ...localConsent, analytics: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            {/* Marketing */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                <div className="pr-4">
                                    <h4 className="font-semibold text-gray-900">Marketing & Targeting Cookies</h4>
                                    <p className="text-xs text-gray-500 mt-1">Used to track visitors across websites to display relevant and engaging advertising.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={localConsent.marketing}
                                        onChange={(e) => setLocalConsent({ ...localConsent, marketing: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            {/* Preferences */}
                            <div className="flex justify-between items-start pb-2">
                                <div className="pr-4">
                                    <h4 className="font-semibold text-gray-900">Functional & Preference Cookies</h4>
                                    <p className="text-xs text-gray-500 mt-1">Enable the website to provide enhanced functionality and personalization (e.g. language preferences).</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={localConsent.preferences}
                                        onChange={(e) => setLocalConsent({ ...localConsent, preferences: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={rejectAll}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors w-full sm:w-auto text-center"
                            >
                                Reject All Optional
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors w-full sm:w-auto text-center"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

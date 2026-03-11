'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'vedashi_age_verified';

const TERMS_CONTENT = `
TERMS & CONDITIONS — Vedashi

Last updated: March 2026

1. AGE REQUIREMENT
Certain products may have an age requirement. By agreeing to these Terms & Conditions and confirming your age, you certify that you meet any minimum age requirement for the specific items in your order.

2. ACCEPTANCE OF TERMS
By accessing or using the Vedashi website and services, you agree to be bound by these Terms & Conditions. If you do not agree, you must not use our website or services.

3. PRODUCT INFORMATION
All product descriptions, images, and pricing on our website are provided for informational purposes only. While we strive for accuracy, we do not warrant that product descriptions or other content are error-free. Colors, flavors, and other characteristics may vary from batch to batch.

4. ORDERING & PAYMENT
All orders placed through our website are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Payment must be made in full at the time of purchase unless otherwise agreed. Prices are listed in USD and are subject to change without notice.

5. SHIPPING & DELIVERY
Alcoholic beverages can only be shipped to addresses within jurisdictions where such shipments are permitted by law. A valid signature from an adult of legal drinking age is required at the time of delivery. We are not responsible for delays caused by shipping carriers.

6. RETURN & REFUND POLICY
Due to the nature of our products, returns are accepted only for damaged, defective, or incorrectly shipped items. Please contact our support team within 48 hours of delivery to report any issues. Refunds will be processed within 7–10 business days.

7. RESPONSIBLE DRINKING
Vedashi promotes responsible wellness. We encourage our customers to use our wellness formulations as directed. If you or someone you know has questions about usage, please consult a practitioner.

8. PRIVACY POLICY
Your personal information is collected, stored, and processed in accordance with our Privacy Policy. We do not sell or share your personal information with third parties for marketing purposes without your explicit consent.

9. INTELLECTUAL PROPERTY
All content on the Vedashi website, including logos, text, images, and design elements, is the property of Vedashi and is protected by intellectual property laws. Unauthorized use, reproduction, or distribution is strictly prohibited.

10. LIMITATION OF LIABILITY
Vedashi shall not be held liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the purchase price of the product(s) in question.

11. GOVERNING LAW
These Terms & Conditions shall be governed by and construed in accordance with the laws of the applicable jurisdiction, without regard to its conflict of law provisions.

12. CHANGES TO TERMS
We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of the updated terms.

13. CONTACT
For questions regarding these Terms & Conditions, please contact us at:
Email: care@vedashi.com
Phone: +91 124 456 7890
`.trim();

export default function AgeVerificationModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [checkboxEnabled, setCheckboxEnabled] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isTermsExiting, setIsTermsExiting] = useState(false);
    const termsRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Check localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const verified = localStorage.getItem(STORAGE_KEY);
            if (!verified) {
                setIsVisible(true);
                document.body.style.overflow = 'hidden';
            }
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Focus traps
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showTerms) {
                closeTerms();
                return;
            }
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, showTerms]);

    const handleTermsScroll = useCallback(() => {
        const BURGUNDY = [59, 93, 59] as [number, number, number];
        const GOLD = [181, 149, 47] as [number, number, number];
        const el = termsRef.current;
        if (!el) return;
        const threshold = 30;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
            setCheckboxEnabled(true);
        }
    }, []);

    const handleYes = () => {
        setIsExiting(true);
        setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsVisible(false);
            document.body.style.overflow = '';
        }, 400);
    };

    const handleNo = () => {
        window.location.href = 'https://www.google.com';
    };

    const closeTerms = () => {
        setIsTermsExiting(true);
        setTimeout(() => {
            setShowTerms(false);
            setIsTermsExiting(false);
        }, 300);
    };

    const openTerms = () => {
        setShowTerms(true);
        setIsTermsExiting(false);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${isExiting ? 'animate-overlay-fade-out' : 'animate-overlay-fade-in'}`}
            style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-modal-title"
            aria-describedby="age-modal-desc"
            ref={modalRef}
        >
            {/* Main Modal */}
            <div
                className={`relative w-full max-w-md rounded-2xl border border-[#B5952F]/30 shadow-2xl ${isExiting ? 'animate-scale-out' : 'animate-scale-in'}`}
                style={{
                    background: 'linear-gradient(145deg, #1a1714 0%, #231f1b 50%, #1a1714 100%)',
                }}
            >
                {/* Decorative top border */}
                <div className="flex-shrink-0 h-1.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #3B5D3B, #B5952F)' }} />

                <div className="p-8 sm:p-10">
                    {/* Ayurvedic Icon */}
                    <div className="flex justify-center mb-5">
                        <div
                            className="flex items-center justify-center w-20 h-20 rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(59,93,59,0.15) 0%, transparent 70%)',
                                border: '2px solid rgba(59,93,59,0.25)',
                            }}
                        >
                            <span className="text-4xl" role="img" aria-label="Herb">🌿</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2
                        id="age-modal-title"
                        className="text-center text-2xl sm:text-3xl font-bold mb-3"
                        style={{ fontFamily: 'var(--font-serif)', color: '#B5952F' }}
                    >
                        Age Verification
                    </h2>

                    {/* Question */}
                    <p
                        id="age-modal-desc"
                        className="text-center text-base sm:text-lg mb-8"
                        style={{ color: '#c9bcab' }}
                    >
                        Are you 18 years or older?
                    </p>

                    {/* Checkbox */}
                    <label
                        className={`flex items-start gap-3 mb-8 p-4 rounded-xl transition-all duration-300 ${checkboxEnabled
                            ? 'cursor-pointer border border-[#B5952F]/30 bg-[#B5952F]/5 hover:bg-[#B5952F]/10'
                            : 'cursor-not-allowed border border-gray-700/50 bg-white/[0.02]'
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!checkboxEnabled}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded accent-[#B5952F] flex-shrink-0 disabled:opacity-40"
                            aria-label="I agree to the Terms and Conditions"
                        />
                        <span className={`text-sm leading-relaxed ${checkboxEnabled ? 'text-gray-300' : 'text-gray-500'}`}>
                            I agree to the{' '}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openTerms();
                                }}
                                className="underline font-semibold transition-colors hover:text-[#B5952F] focus:text-[#B5952F]"
                                style={{ color: '#B5952F' }}
                            >
                                Terms &amp; Conditions
                            </button>
                            {!checkboxEnabled && (
                                <span className="block text-xs mt-1 italic" style={{ color: '#7a7067' }}>
                                    Please read the Terms &amp; Conditions to enable this checkbox
                                </span>
                            )}
                        </span>
                    </label>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleNo}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold border transition-all duration-300 hover:bg-red-900/30 hover:border-red-400/50 active:scale-[0.98]"
                            style={{ borderColor: 'rgba(156,100,100,0.4)', color: '#c49090' }}
                        >
                            No, I&apos;m not
                        </button>
                        <button
                            onClick={handleYes}
                            disabled={!isChecked}
                            className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                            style={{
                                background: isChecked
                                    ? 'linear-gradient(135deg, #3B5D3B 0%, #B5952F 100%)'
                                    : 'rgba(100,90,70,0.3)',
                                color: isChecked ? '#1a1714' : '#7a7067',
                                boxShadow: isChecked ? '0 4px 20px rgba(59,93,59,0.3)' : 'none',
                            }}
                        >
                            Yes, I&apos;m 18+
                        </button>
                    </div>
                </div>
            </div>

            {/* Terms & Conditions Modal */}
            {showTerms && (
                <div
                    className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 ${isTermsExiting ? 'animate-overlay-fade-out' : 'animate-overlay-fade-in'}`}
                    style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Terms and Conditions"
                >
                    <div
                        className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-[#B5952F]/20 shadow-2xl ${isTermsExiting ? 'animate-scale-out' : 'animate-scale-in'}`}
                        style={{
                            background: 'linear-gradient(145deg, #1e1b17 0%, #262220 50%, #1e1b17 100%)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-700/50 flex-shrink-0">
                            <h3
                                className="text-lg sm:text-xl font-bold"
                                style={{ fontFamily: 'var(--font-serif)', color: '#B5952F' }}
                            >
                                Terms &amp; Conditions
                            </h3>
                            <button
                                onClick={closeTerms}
                                className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-white/10"
                                style={{ color: '#999' }}
                                aria-label="Close Terms and Conditions"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div
                            ref={termsRef}
                            onScroll={handleTermsScroll}
                            className="flex-1 overflow-y-auto p-5 sm:p-6"
                            style={{ color: '#b5a998' }}
                        >
                            {TERMS_CONTENT.split('\n\n').map((paragraph, i) => {
                                const isHeading = /^\d+\.\s/.test(paragraph);
                                if (paragraph.startsWith('TERMS')) {
                                    return (
                                        <h4
                                            key={i}
                                            className="text-base font-bold mb-1"
                                            style={{ color: '#B5952F' }}
                                        >
                                            {paragraph}
                                        </h4>
                                    );
                                }
                                if (paragraph.startsWith('Last updated')) {
                                    return (
                                        <p key={i} className="text-xs italic mb-6" style={{ color: '#7a7067' }}>
                                            {paragraph}
                                        </p>
                                    );
                                }
                                if (isHeading) {
                                    const [title, ...rest] = paragraph.split('\n');
                                    return (
                                        <div key={i} className="mb-5">
                                            <h5 className="text-sm font-bold mb-1.5" style={{ color: '#B5952F' }}>
                                                {title}
                                            </h5>
                                            <p className="text-sm leading-relaxed">{rest.join(' ')}</p>
                                        </div>
                                    );
                                }
                                return (
                                    <p key={i} className="text-sm leading-relaxed mb-4">{paragraph}</p>
                                );
                            })}

                            {/* Scroll Indicator */}
                            {!checkboxEnabled && (
                                <div className="text-center py-4 border-t border-gray-700/30 mt-4">
                                    <p className="text-xs animate-pulse" style={{ color: '#d4af37' }}>
                                        ↓ Scroll to the bottom to accept ↓
                                    </p>
                                </div>
                            )}

                            {checkboxEnabled && (
                                <div className="text-center py-4 border-t border-gray-700/30 mt-4">
                                    <p className="text-xs font-semibold" style={{ color: '#6dbe6d' }}>
                                        ✓ You&apos;ve read the Terms &amp; Conditions. You may now close this and check the box.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 sm:p-6 border-t border-gray-700/50 flex-shrink-0">
                            <button
                                onClick={closeTerms}
                                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-[0.98]"
                                style={{
                                    background: checkboxEnabled
                                        ? 'linear-gradient(135deg, #d4af37 0%, #b5952f 100%)'
                                        : 'rgba(100,90,70,0.3)',
                                    color: checkboxEnabled ? '#1a1714' : '#999',
                                }}
                            >
                                {checkboxEnabled ? 'Close & Accept' : 'Read to continue...'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

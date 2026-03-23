'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { Shield, X, Check, Cookie, ChevronRight, Lock, BarChart2, Megaphone, Sliders } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function CookieBanner() {
    const { showBanner, acceptAll, rejectAll, openSettings, isSettingsOpen, closeSettings, updateConsent, consent } = useCookieConsent();

    const [localConsent, setLocalConsent] = useState({
        strictly_necessary: true,
        analytics: consent?.analytics || false,
        marketing: consent?.marketing || false,
        preferences: consent?.preferences || false,
    });

    const [isMounted, setIsMounted] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [policyContent, setPolicyContent] = useState<string | null>(null);
    const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [policyModalVisible, setPolicyModalVisible] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (showBanner) {
            const t = setTimeout(() => setBannerVisible(true), 120);
            return () => clearTimeout(t);
        } else { setBannerVisible(false); }
    }, [showBanner]);

    useEffect(() => {
        if (isSettingsOpen) {
            const t = setTimeout(() => setModalVisible(true), 30);
            return () => clearTimeout(t);
        } else { setModalVisible(false); }
    }, [isSettingsOpen]);

    useEffect(() => {
        if (isPolicyModalOpen) {
            const t = setTimeout(() => setPolicyModalVisible(true), 30);
            return () => clearTimeout(t);
        } else { setPolicyModalVisible(false); }
    }, [isPolicyModalOpen]);

    useEffect(() => {
        if (isSettingsOpen || isPolicyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [isSettingsOpen, isPolicyModalOpen]);

    const handleCloseSettings = () => {
        setModalVisible(false);
        setTimeout(() => closeSettings(), 280);
    };

    const handleClosePolicyModal = () => {
        setPolicyModalVisible(false);
        setTimeout(() => setIsPolicyModalOpen(false), 280);
    };

    const handleOpenPolicy = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPolicyModalOpen(true);
        if (!policyContent) {
            setIsLoadingPolicy(true);
            try {
                const res = await fetch(`${API_URL}/api/legal/public/privacy-policy`);
                const json = await res.json();
                if (json.success && json.data) {
                    let blocks: any[] = [];
                    try { blocks = JSON.parse(json.data.content); }
                    catch { blocks = [{ type: 'paragraph', text: json.data.content }]; }
                    // Inline styles so we don't depend on Tailwind prose classes for spacing
                    const sectionHeadings = [
                        '1. Information Collection and Use', '2. Cookies Data', '3. Use of Data',
                        '4. Transfer of Data', '5. Security of Data', 'Contact Us', 'Personal Data', 'Usage Data',
                    ];
                    const bulletItems = [
                        'Email address', 'First name and last name', 'Phone number',
                        'Address, State, Province ZIP/Postal code City', 'IP address',
                        'Browser type and version', 'Pages visited', 'Time and date of visit',
                        'Time spent on pages', 'Unique device identifiers',
                    ];

                    const renderBlock = (b: any): string => {
                        if (b.type === 'heading') {
                            return `<h3 style="font-size:15px;font-weight:700;color:#065f46;margin:24px 0 8px;padding-bottom:8px;border-bottom:1px solid #d1fae5;font-family:DM Sans,sans-serif;letter-spacing:-0.01em">${b.text}</h3>`;
                        }

                        // Raw text — split by newlines, process each line
                        const rawText: string = b.text || '';
                        // Split on real newlines (backend may use \n)
                        const lines = rawText.split(/\n/);
                        let outputParts: string[] = [];
                        let pendingBullets: string[] = [];

                        const flushBullets = () => {
                            if (pendingBullets.length > 0) {
                                const items = pendingBullets.map(li =>
                                    `<li style="padding:3px 0;color:#374151;font-size:13.5px">${li}</li>`
                                ).join('');
                                outputParts.push(
                                    `<ul style="margin:8px 0 8px 18px;padding:0;list-style:disc">${items}</ul>`
                                );
                                pendingBullets = [];
                            }
                        };

                        for (const rawLine of lines) {
                            const line = rawLine.trim();
                            if (!line) continue;

                            // Check if this line IS a known section heading
                            const isHeading = sectionHeadings.some(h => line === h || line.startsWith(h));
                            if (isHeading) {
                                flushBullets();
                                outputParts.push(
                                    `<h4 style="font-size:14px;font-weight:700;color:#065f46;margin:20px 0 6px;padding-left:10px;border-left:3px solid #059669;font-family:DM Sans,sans-serif">${line}</h4>`
                                );
                                continue;
                            }

                            // Check if this line IS a known bullet item
                            const isBullet = bulletItems.some(b => line === b || line.includes(b));
                            if (isBullet) {
                                pendingBullets.push(line);
                                continue;
                            }

                            // Regular paragraph line — check if it contains an inline heading
                            let processed = line;
                            let hadInlineHeading = false;
                            for (const h of sectionHeadings) {
                                if (processed.includes(h)) {
                                    hadInlineHeading = true;
                                    const [before, ...after] = processed.split(h);
                                    const rest = after.join(h);
                                    if (before.trim()) {
                                        flushBullets();
                                        outputParts.push(
                                            `<p style="font-size:13.5px;color:#4b5563;line-height:1.65;margin:0 0 10px;font-family:DM Sans,sans-serif">${before.trim()}</p>`
                                        );
                                    }
                                    flushBullets();
                                    outputParts.push(
                                        `<h4 style="font-size:14px;font-weight:700;color:#065f46;margin:20px 0 6px;padding-left:10px;border-left:3px solid #059669;font-family:DM Sans,sans-serif">${h}</h4>`
                                    );
                                    if (rest.trim()) {
                                        outputParts.push(
                                            `<p style="font-size:13.5px;color:#4b5563;line-height:1.65;margin:0 0 10px;font-family:DM Sans,sans-serif">${rest.trim()}</p>`
                                        );
                                    }
                                    break;
                                }
                            }
                            if (!hadInlineHeading) {
                                // Check inline bullet items
                                let hasBullet = false;
                                for (const bi of bulletItems) {
                                    if (processed.includes(bi)) {
                                        hasBullet = true;
                                        pendingBullets.push(bi);
                                    }
                                }
                                if (!hasBullet) {
                                    flushBullets();
                                    outputParts.push(
                                        `<p style="font-size:13.5px;color:#4b5563;line-height:1.65;margin:0 0 10px;font-family:DM Sans,sans-serif">${processed}</p>`
                                    );
                                }
                            }
                        }

                        flushBullets();
                        return outputParts.join('');
                    };

                    const html = `<div style="font-family:DM Sans,sans-serif">${blocks.map(renderBlock).join('')}</div>`;
                    setPolicyContent(html);
                } else { setPolicyContent('<p>Unable to load Cookie Policy.</p>'); }
            } catch { setPolicyContent('<p>Unable to load Cookie Policy.</p>'); }
            finally { setIsLoadingPolicy(false); }
        }
    };

    if (!isMounted) return null;
    if (!showBanner && !isSettingsOpen && !isPolicyModalOpen) return null;

    // Policy can be opened from anywhere — keep portal always available when open

    const handleSaveSettings = () => { updateConsent(localConsent); };

    const cookieCategories = [
        {
            key: 'strictly_necessary',
            label: 'Strictly Necessary',
            desc: 'Essential for the website to function. Always active.',
            icon: Lock,
            locked: true,
            color: '#065f46',
            bg: '#ecfdf5',
        },
        {
            key: 'analytics',
            label: 'Analytics & Performance',
            desc: 'Helps us understand how visitors interact with our site.',
            icon: BarChart2,
            locked: false,
            color: '#1d4ed8',
            bg: '#eff6ff',
        },
        {
            key: 'marketing',
            label: 'Marketing & Targeting',
            desc: 'Delivers relevant ads and tracks campaign effectiveness.',
            icon: Megaphone,
            locked: false,
            color: '#b45309',
            bg: '#fffbeb',
        },
        {
            key: 'preferences',
            label: 'Functional & Preferences',
            desc: 'Enables personalized features like language settings.',
            icon: Sliders,
            locked: false,
            color: '#7c3aed',
            bg: '#f5f3ff',
        },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

                @keyframes bannerSlideIn {
                    0%   { opacity: 0; transform: translateY(24px) scale(0.94); }
                    55%  { transform: translateY(-5px) scale(1.015); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes bannerSlideOut {
                    0%   { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(18px) scale(0.95); }
                }
                @keyframes overlayFadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes overlayFadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes modalPop {
                    0%   { opacity: 0; transform: scale(0.88) translateY(20px); }
                    55%  { transform: scale(1.025) translateY(-3px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes modalPopOut {
                    0%   { opacity: 1; transform: scale(1) translateY(0); }
                    100% { opacity: 0; transform: scale(0.92) translateY(12px); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes glowPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.25); }
                    50%      { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
                }
                @keyframes rowIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                .ck * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

                /* ─── Banner ─── */
                .ck-banner {
                    position: fixed;
                    bottom: 22px;
                    right: 22px;
                    z-index: 9999;
                    width: 352px;
                }
                .ck-banner.v-enter { animation: bannerSlideIn 0.52s cubic-bezier(0.34,1.56,0.64,1) forwards; }
                .ck-banner.v-exit  { animation: bannerSlideOut 0.28s ease forwards; pointer-events: none; }

                .ck-card {
                    background: #fff;
                    border-radius: 18px;
                    border: 1px solid rgba(0,0,0,0.07);
                    box-shadow:
                        0 2px 4px rgba(0,0,0,0.03),
                        0 8px 20px rgba(0,0,0,0.08),
                        0 24px 48px rgba(0,0,0,0.07);
                    overflow: hidden;
                    position: relative;
                }
                .ck-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
                    background: linear-gradient(90deg, #059669 0%, #34d399 50%, #059669 100%);
                    background-size: 200% auto;
                    animation: shimmer 2.8s linear infinite;
                    z-index: 1;
                }

                .ck-card-body { padding: 16px 18px 6px; display: flex; gap: 13px; align-items: flex-start; }

                .ck-icon-pill {
                    width: 38px; height: 38px; flex-shrink: 0;
                    background: linear-gradient(135deg, #064e3b, #059669);
                    border-radius: 11px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 3px 10px rgba(6,95,70,0.35);
                    animation: glowPulse 2.8s ease-in-out infinite;
                }

                .ck-card-title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.015em; }
                .ck-card-text  { font-size: 12px; color: #64748b; margin: 0; line-height: 1.6; }
                .ck-link {
                    color: #059669; font-weight: 600; cursor: pointer;
                    background: none; border: none; padding: 0;
                    font-size: inherit; font-family: inherit;
                    text-decoration: underline; text-decoration-color: rgba(5,150,105,0.35);
                    text-underline-offset: 2px;
                    transition: text-decoration-color 0.15s;
                }
                .ck-link:hover { text-decoration-color: #059669; }

                .ck-actions { padding: 12px 18px 16px; display: flex; flex-direction: column; gap: 9px; }
                .ck-btn-row  { display: flex; gap: 8px; }

                .ck-accept {
                    flex: 1;
                    background: linear-gradient(135deg, #065f46, #059669);
                    color: #fff; border: none; border-radius: 10px;
                    padding: 9px 0; font-size: 13px; font-weight: 600;
                    cursor: pointer; letter-spacing: 0.01em;
                    box-shadow: 0 2px 10px rgba(6,95,70,0.35);
                    font-family: 'DM Sans', sans-serif;
                    transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
                }
                .ck-accept:hover  { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 5px 16px rgba(6,95,70,0.4); }
                .ck-accept:active { transform: translateY(0); filter: brightness(0.97); }

                .ck-reject {
                    flex: 1;
                    background: #f8fafc; color: #475569;
                    border: 1px solid #e2e8f0; border-radius: 10px;
                    padding: 9px 0; font-size: 13px; font-weight: 500;
                    cursor: pointer; font-family: 'DM Sans', sans-serif;
                    transition: background 0.15s, border-color 0.15s;
                }
                .ck-reject:hover { background: #f1f5f9; border-color: #cbd5e1; }

                .ck-manage {
                    background: none; border: none; padding: 2px 0;
                    color: #94a3b8; font-size: 11.5px; font-weight: 500;
                    cursor: pointer; font-family: 'DM Sans', sans-serif;
                    display: flex; align-items: center; justify-content: center; gap: 3px;
                    letter-spacing: 0.01em;
                    transition: color 0.15s;
                }
                .ck-manage:hover { color: #059669; }
                .ck-manage svg { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
                .ck-manage:hover svg { transform: translateX(4px); }

                /* ─── Overlay ─── */
                .ck-ov {
                    position: fixed; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    padding: 16px;
                }
                .ck-ov-bg {
                    position: absolute; inset: 0;
                    background: rgba(2,6,23,0.55);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }
                .ck-ov.v-enter .ck-ov-bg   { animation: overlayFadeIn  0.28s ease forwards; }
                .ck-ov.v-exit  .ck-ov-bg   { animation: overlayFadeOut 0.28s ease forwards; }
                .ck-ov.v-enter .ck-modal,
                .ck-ov.v-enter .ck-policy  { animation: modalPop    0.48s cubic-bezier(0.34,1.56,0.64,1) forwards; }
                .ck-ov.v-exit  .ck-modal,
                .ck-ov.v-exit  .ck-policy  { animation: modalPopOut 0.28s ease forwards; }

                /* ─── Modal shared ─── */
                .ck-modal, .ck-policy {
                    position: relative; z-index: 1;
                    background: #fff; border-radius: 22px;
                    width: 100%;
                    max-height: 90vh;
                    display: flex; flex-direction: column;
                    overflow: hidden;
                    box-shadow:
                        0 0 0 1px rgba(0,0,0,0.05),
                        0 8px 30px rgba(0,0,0,0.1),
                        0 40px 90px rgba(0,0,0,0.22);
                }
                .ck-modal  { max-width: 510px; }
                .ck-policy { max-width: 680px; }

                .ck-modal::before, .ck-policy::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, #059669 0%, #34d399 50%, #059669 100%);
                    background-size: 200% auto;
                    animation: shimmer 2.8s linear infinite;
                    z-index: 2;
                }

                .ck-mhead {
                    padding: 20px 22px 17px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .ck-mhead-left { display: flex; align-items: center; gap: 13px; }
                .ck-mhead-icon {
                    width: 42px; height: 42px;
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                    border: 1px solid #a7f3d0;
                    border-radius: 13px;
                    display: flex; align-items: center; justify-content: center;
                }
                .ck-mhead-title { font-size: 15.5px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
                .ck-mhead-sub   { font-size: 11.5px; color: #94a3b8; margin: 3px 0 0; }

                .ck-xbtn {
                    width: 32px; height: 32px;
                    background: #f8fafc; border: 1px solid #e2e8f0;
                    border-radius: 9px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #94a3b8;
                    transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
                }
                .ck-xbtn:hover { background: #fef2f2; border-color: #fca5a5; color: #ef4444; transform: rotate(90deg) scale(1.1); }

                .ck-mbody {
                    padding: 18px 22px; overflow-y: auto; flex: 1;
                }
                .ck-mbody::-webkit-scrollbar { width: 4px; }
                .ck-mbody::-webkit-scrollbar-track { background: transparent; }
                .ck-mbody::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

                .ck-info-box {
                    font-size: 12.5px; color: #64748b; line-height: 1.65;
                    background: #f8fafc; border-radius: 11px;
                    padding: 11px 14px; margin-bottom: 18px;
                    border-left: 3px solid #10b981;
                }

                /* ─── Category rows ─── */
                .ck-row {
                    display: flex; align-items: center; gap: 14px;
                    padding: 13px 0;
                    border-bottom: 1px solid #f1f5f9;
                    opacity: 0;
                    animation: rowIn 0.32s ease forwards;
                }
                .ck-row:last-child { border-bottom: none; }
                .ck-row:nth-child(1) { animation-delay: 0.06s; }
                .ck-row:nth-child(2) { animation-delay: 0.12s; }
                .ck-row:nth-child(3) { animation-delay: 0.18s; }
                .ck-row:nth-child(4) { animation-delay: 0.24s; }

                .ck-row-icon {
                    width: 38px; height: 38px; flex-shrink: 0;
                    border-radius: 11px;
                    display: flex; align-items: center; justify-content: center;
                }
                .ck-row-label { font-size: 13px; font-weight: 650; color: #0f172a; margin: 0 0 2px; }
                .ck-row-desc  { font-size: 11.5px; color: #94a3b8; margin: 0; line-height: 1.45; }
                .ck-row-info  { flex: 1; min-width: 0; }

                /* Toggle */
                .ck-tog {
                    width: 44px; height: 24px; flex-shrink: 0;
                    border-radius: 999px; background: #e2e8f0;
                    position: relative; cursor: pointer; border: none; padding: 0;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
                    transition: background 0.25s cubic-bezier(0.34,1.56,0.64,1),
                                box-shadow 0.25s ease;
                }
                .ck-tog.on {
                    background: linear-gradient(135deg, #059669, #10b981);
                    box-shadow: 0 2px 10px rgba(5,150,105,0.4);
                }
                .ck-tog-thumb {
                    position: absolute; top: 3px; left: 3px;
                    width: 18px; height: 18px;
                    background: #fff; border-radius: 50%;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
                    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
                }
                .ck-tog.on .ck-tog-thumb { transform: translateX(20px); }

                .ck-always {
                    display: inline-flex; align-items: center; gap: 4px;
                    font-size: 10.5px; font-weight: 600;
                    color: #065f46; background: #ecfdf5;
                    border: 1px solid #a7f3d0;
                    border-radius: 999px; padding: 4px 10px;
                    white-space: nowrap; flex-shrink: 0;
                    font-family: 'DM Mono', monospace;
                    letter-spacing: 0.02em;
                }

                /* ─── Modal footer ─── */
                .ck-mfoot {
                    padding: 14px 22px;
                    border-top: 1px solid #f1f5f9;
                    background: #fafbfc;
                    display: flex; gap: 10px; justify-content: flex-end;
                }

                .ck-btn-ghost {
                    background: none; border: 1px solid #e2e8f0;
                    border-radius: 10px; padding: 8.5px 17px;
                    font-size: 12.5px; font-weight: 500; color: #94a3b8;
                    cursor: pointer; font-family: 'DM Sans', sans-serif;
                    transition: color 0.15s, border-color 0.15s, background 0.15s;
                }
                .ck-btn-ghost:hover { color: #475569; border-color: #cbd5e1; background: #f8fafc; }

                .ck-btn-save {
                    background: linear-gradient(135deg, #065f46, #059669);
                    color: #fff; border: none; border-radius: 10px;
                    padding: 9px 24px; font-size: 13px; font-weight: 700;
                    cursor: pointer; letter-spacing: 0.01em;
                    box-shadow: 0 2px 12px rgba(6,95,70,0.35);
                    font-family: 'DM Sans', sans-serif;
                    transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
                }
                .ck-btn-save:hover  { filter: brightness(1.07); transform: translateY(-1px); box-shadow: 0 5px 18px rgba(6,95,70,0.4); }
                .ck-btn-save:active { transform: translateY(0); }

                /* ─── Spinner ─── */
                .ck-spin {
                    width: 34px; height: 34px; margin: 56px auto;
                    border: 3px solid #f1f5f9; border-top-color: #059669;
                    border-radius: 50%; animation: spin 0.65s linear infinite;
                }
            `}</style>

            {/* ══ BANNER ══ */}
            {showBanner && !isSettingsOpen && createPortal(
                <div className={`ck ck-banner ${bannerVisible ? 'v-enter' : 'v-exit'}`}>
                    <div className="ck-card">
                        <div className="ck-card-body">
                            <div className="ck-icon-pill">
                                <Cookie style={{ width: 18, height: 18, color: '#fff' }} />
                            </div>
                            <div>
                                <p className="ck-card-title">We value your privacy</p>
                                <p className="ck-card-text">
                                    We use cookies to personalise content and analyse traffic.{' '}
                                    <button className="ck-link" onClick={handleOpenPolicy}>Cookie Policy</button>
                                </p>
                            </div>
                        </div>

                        <div className="ck-actions">
                            <div className="ck-btn-row">
                                <button className="ck-accept" onClick={acceptAll}>Accept All</button>
                                <button className="ck-reject" onClick={rejectAll}>Reject</button>
                            </div>
                            <button className="ck-manage" onClick={openSettings}>
                                Manage Preferences
                                <ChevronRight style={{ width: 13, height: 13 }} />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ══ SETTINGS MODAL ══ */}
            {isSettingsOpen && createPortal(
                <div className={`ck ck-ov ${modalVisible ? 'v-enter' : 'v-exit'}`} style={{ zIndex: 9999 }}>
                    <div className="ck-ov-bg" onClick={handleCloseSettings} />
                    <div className="ck-modal">
                        <div className="ck-mhead">
                            <div className="ck-mhead-left">
                                <div className="ck-mhead-icon">
                                    <Shield style={{ width: 18, height: 18, color: '#059669' }} />
                                </div>
                                <div>
                                    <h2 className="ck-mhead-title">Privacy Preferences</h2>
                                    <p className="ck-mhead-sub">Customize your cookie settings</p>
                                </div>
                            </div>
                            <button className="ck-xbtn" onClick={handleCloseSettings}>
                                <X style={{ width: 15, height: 15 }} />
                            </button>
                        </div>

                        <div className="ck-mbody">
                            <p className="ck-info-box">
                                Choose which cookies to allow. You can change these settings at any time via the link in our footer.{' '}
                                <button className="ck-link" onClick={handleOpenPolicy}>View Cookie Policy →</button>
                            </p>

                            {cookieCategories.map((cat) => {
                                const Icon = cat.icon;
                                const isOn = localConsent[cat.key as keyof typeof localConsent];
                                return (
                                    <div className="ck-row" key={cat.key}>
                                        <div className="ck-row-icon" style={{ background: cat.bg }}>
                                            <Icon style={{ width: 17, height: 17, color: cat.color }} />
                                        </div>
                                        <div className="ck-row-info">
                                            <p className="ck-row-label">{cat.label}</p>
                                            <p className="ck-row-desc">{cat.desc}</p>
                                        </div>
                                        {cat.locked ? (
                                            <span className="ck-always">
                                                <Check style={{ width: 10, height: 10 }} />
                                                Always On
                                            </span>
                                        ) : (
                                            <button
                                                className={`ck-tog ${isOn ? 'on' : ''}`}
                                                onClick={() => setLocalConsent(prev => ({
                                                    ...prev,
                                                    [cat.key]: !prev[cat.key as keyof typeof localConsent],
                                                }))}
                                                role="switch"
                                                aria-checked={isOn}
                                                aria-label={cat.label}
                                            >
                                                <div className="ck-tog-thumb" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="ck-mfoot">
                            <button className="ck-btn-ghost" onClick={rejectAll}>Reject Optional</button>
                            <button className="ck-btn-save" onClick={handleSaveSettings}>Save Preferences</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ══ POLICY MODAL ══ */}
            {isPolicyModalOpen && createPortal(
                <div className={`ck ck-ov ${policyModalVisible ? 'v-enter' : 'v-exit'}`} style={{ zIndex: 10000 }}>
                    <div className="ck-ov-bg" onClick={handleClosePolicyModal} />
                    <div className="ck-policy">
                        {/* Rich gradient header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                            padding: '22px 24px 20px',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            position: 'relative', overflow: 'hidden', flexShrink: 0,
                        }}>
                            {/* BG decoration circles */}
                            <div style={{ position:'absolute', top:-28, right:-28, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
                            <div style={{ position:'absolute', bottom:-18, right:60, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

                            <div style={{ display:'flex', alignItems:'center', gap:13, position:'relative', zIndex:1 }}>
                                <div style={{
                                    width:42, height:42, borderRadius:13,
                                    background:'rgba(255,255,255,0.15)',
                                    backdropFilter:'blur(8px)',
                                    border:'1px solid rgba(255,255,255,0.2)',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    flexShrink: 0,
                                }}>
                                    <Shield style={{ width:19, height:19, color:'#fff' }} />
                                </div>
                                <div>
                                    <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>
                                        Cookie Policy
                                    </h2>
                                    <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.6)', fontFamily:'DM Sans, sans-serif' }}>
                                        How we use cookies on our site
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleClosePolicyModal}
                                style={{
                                    width:32, height:32, flexShrink:0,
                                    background:'rgba(255,255,255,0.12)',
                                    border:'1px solid rgba(255,255,255,0.18)',
                                    borderRadius:9, cursor:'pointer',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    color:'rgba(255,255,255,0.8)',
                                    transition:'background 0.15s, color 0.15s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                                    position:'relative', zIndex:1,
                                }}
                                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,0.22)'; b.style.color='#fff'; b.style.transform='rotate(90deg) scale(1.1)'; }}
                                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,0.12)'; b.style.color='rgba(255,255,255,0.8)'; b.style.transform='rotate(0deg) scale(1)'; }}
                            >
                                <X style={{ width:15, height:15 }} />
                            </button>
                        </div>

                        <div className="ck-mbody" style={{ padding: '22px 26px' }}>
                            {isLoadingPolicy
                                ? (
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 0', gap:14 }}>
                                        <div className="ck-spin" />
                                        <p style={{ margin:0, fontSize:12.5, color:'#94a3b8', fontFamily:'DM Sans, sans-serif' }}>Loading policy…</p>
                                    </div>
                                )
                                : (
                                    <div
                                        style={{ lineHeight: 1.65 }}
                                        dangerouslySetInnerHTML={{ __html: policyContent || '' }}
                                    />
                                )
                            }
                        </div>

                        <div className="ck-mfoot">
                            <button className="ck-btn-save" onClick={handleClosePolicyModal}>Got it</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
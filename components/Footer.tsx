'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import RegionSwitcher from './RegionSwitcher';
import GoogleTranslateWidget from './GoogleTranslateWidget';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { API_URL, subscribeNewsletter } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface FooterSettings {
    use_dynamic_footer?: boolean;
}

interface FooterData {
    settings?: FooterSettings;
    company?: {
        name: string;
        description: string;
        logo_url?: string;
    };
    links?: Array<{
        title: string;
        items: Array<{ label: string; href: string }>;
    }>;
    social?: Array<{
        platform: string;
        url: string;
        icon_name?: string;
    }>;
    contact?: {
        email?: string;
        phone?: string;
        address?: string;
        hours?: string;
    };
    legal?: Array<{ label: string; href: string }>;
    newsletter?: {
        title: string;
        description: string;
    };
    bottom_bar?: {
        copyright: string;
        text: string;
    };
}

// ─── Platform icon map ────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
};

// ─── Static fallbacks (when CMS is missing, failed, or disabled) ──

const FALLBACK: FooterData = {
    company: {
        name: 'Vedashi',
        description: 'Nurturing your journey towards holistic health through the ancient wisdom of Ayurveda.',
        logo_url: '/vedashi-logo.png',
    },
    links: [
        {
            title: 'Explore',
            items: [
                { label: 'Our Story', href: '/about' },
                { label: 'Natural Products', href: '/products' },
            ],
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', href: '/help-center' },
                { label: 'Consultation FAQ', href: '/help-center/faq' },
                { label: 'Shipping Policy', href: '/shipping' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
            ],
        },
    ],
    social: [
        { platform: 'Instagram', url: '#', icon_name: 'instagram' },
        { platform: 'Facebook', url: '#', icon_name: 'facebook' },
        { platform: 'Twitter', url: '#', icon_name: 'twitter' },
    ],
    newsletter: {
        title: 'Newsletter',
        description: 'Join our community for weekly wellness rituals.',
    },
    bottom_bar: {
        copyright: `© ${new Date().getFullYear()} Vedashi. All rights reserved.`,
        text: 'Gently crafted for modern balance.',
    },
};

// ─── Footer Component ─────────────────────────────────────────────

export default function Footer() {
    const pathname = usePathname();
    const [data, setData] = useState<FooterData | null>(null);
    const { openSettings } = useCookieConsent();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/footer`, { credentials: 'include' })
            .then(r => r.json())
            .then(res => { if (res.success && res.data) setData(res.data); })
            .catch(() => { /* Use fallback silently */ });
    }, []);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) { toast.error('Please enter a valid email.'); return; }
        setLoading(true);
        try {
            const res = await subscribeNewsletter(email);
            if (res.success) { toast.success(res.message || 'Successfully subscribed!'); setEmail(''); }
            else toast.error(res.message || 'Failed to subscribe.');
        } catch { toast.error('Communication error. Please try again later.'); }
        finally { setLoading(false); }
    };

    if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

    // Check if the dynamic footer is explicitly disabled from the CMS settings
    const isDynamic = data?.settings?.use_dynamic_footer !== false;

    // If dynamic is enabled AND data exists, use it. Otherwise, use FALLBACK.
    const company = (isDynamic && data?.company) ? data.company : FALLBACK.company;
    const columns = (isDynamic && data?.links && data.links.length > 0) ? data.links : (FALLBACK.links ?? []);
    const social = (isDynamic && data?.social && data.social.length > 0) ? data.social : (FALLBACK.social ?? []);
    const newsletter = (isDynamic && data?.newsletter) ? data.newsletter : FALLBACK.newsletter;
    const bottomBar = (isDynamic && data?.bottom_bar) ? data.bottom_bar : FALLBACK.bottom_bar;

    return (
        <footer className="bg-cream text-[#4a4a4a] border-t border-[#e8e8e0] relative z-10">
            {/* ── Main footer body ── */}
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-4">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Brand column */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4 group">
                            <img
                                src={company?.logo_url || '/vedashi-logo.png'}
                                alt={company?.name || 'Vedashi'}
                                className="h-16 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm leading-relaxed text-[#6b6b6b] max-w-[260px]">
                            {company?.description}
                        </p>

                        {/* Social icons */}
                        {social.length > 0 && (
                            <div className="mt-4 flex gap-3">
                                {social.map((s, i) => {
                                    const IconComp = SOCIAL_ICONS[s.icon_name ?? s.platform?.toLowerCase()] ?? Globe;
                                    if (!s.url) return null;
                                    return (
                                        <a
                                            key={i}
                                            href={s.url}
                                            aria-label={s.platform}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors"
                                        >
                                            <IconComp className="w-[18px] h-[18px]" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Dynamic link columns */}
                    {columns.map((col, ci) => (
                        <div key={ci}>
                            <h4 className="font-display font-bold text-[#333] text-lg mb-3">{col.title}</h4>
                            <ul className="space-y-2">
                                {col.items.map((item, ii) => (
                                    <li key={ii}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                                {/* Cookie Settings is always injected into the last column */}
                                {ci === columns.length - 1 && (
                                    <li>
                                        <button
                                            suppressHydrationWarning
                                            onClick={openSettings}
                                            className="text-sm font-medium text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors bg-transparent border-none p-0 cursor-pointer text-left"
                                        >
                                            Cookie Settings
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    ))}

                    {/* Newsletter column */}
                    {newsletter && (
                        <div>
                            <h4 className="font-display font-bold text-[#333] text-lg mb-3">
                                {newsletter.title || 'Newsletter'}
                            </h4>
                            <p className="text-sm text-[#6b6b6b] leading-relaxed mb-4">
                                {newsletter.description}
                            </p>
                            <form onSubmit={handleSubscribe} className="flex gap-2" suppressHydrationWarning>
                                <input
                                    suppressHydrationWarning
                                    type="email"
                                    placeholder="Your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="flex-1 min-w-0 rounded-md px-3 py-2 text-sm bg-white border border-[#d9d9d0] focus:outline-none focus:border-[#3B5D3B] focus:ring-1 focus:ring-[#3B5D3B]/20 placeholder:text-[#aaa] text-[#333] transition-all disabled:opacity-50"
                                />
                                <button
                                    suppressHydrationWarning
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 bg-[#3B5D3B] text-white text-xs font-black font-ui uppercase tracking-widest rounded-md hover:bg-[#2d472d] transition-colors whitespace-nowrap disabled:opacity-70 flex items-center justify-center min-w-[70px]"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ── Bottom bar ── */}
                <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e8e8e0]">
                    <p className="text-[10px] font-bold font-base uppercase tracking-widest text-[#999]">
                        {bottomBar?.copyright || `© ${new Date().getFullYear()} Vedashi. All rights reserved.`}
                    </p>
                    <div className="flex items-center gap-6">
                        <RegionSwitcher upward={true} />
                        <GoogleTranslateWidget upward={true} />
                        {bottomBar?.text && (
                            <p className="text-xs text-[#999] italic font-accent">
                                {bottomBar.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}

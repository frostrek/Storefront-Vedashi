'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, MapPin, Phone, Mail } from 'lucide-react';
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
                { label: 'About Us', href: '/about' },
                { label: 'Blogs', href: '/blog' },
                { label: 'All Products', href: '/products' },
                { label: 'Contact Us', href: '/contact' },


            ],
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', href: '/help-center' },
                { label: 'FAQ', href: '/help-center/faq' },
                { label: 'Shipping Policy', href: '/shipping' },
                { label: 'Return Policy', href: '/return-policy' },
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
        <footer className="bg-[#F3F4F6] text-black border-t border-gray-200 relative z-10 pt-4 pb-0 font-sans">
            <div className="mx-auto max-w-[1500px] px-6 sm:px-8 lg:px-12">

                {/* ── Top Row (Buttons & Social Icons) ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row justify-start gap-3 lg:gap-4">
                        <Link
                            href="/vendor-registration"
                            className="min-w-[220px] bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300 py-3 px-6 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-center gap-2.5 group whitespace-nowrap"
                        >
                            <span className="font-normal text-[14px] sm:text-[15px] text-black group-hover:text-[#3B5D3B]">Vendor Registration</span>
                        </Link>
                        <Link
                            href="/bulk-order"
                            className="min-w-[220px] bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300 py-3 px-6 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-center gap-2.5 group whitespace-nowrap"
                        >
                            <span className="font-normal text-[14px] sm:text-[15px] text-black group-hover:text-[#3B5D3B]">Bulk Order</span>
                        </Link>
                    </div>

                    {/* Social icons moved to top right */}
                    {social.length > 0 && (
                        <div className="flex gap-2.5 px-1">
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
                                        className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black hover:text-[#3B5D3B] hover:border-[#3B5D3B]/30 hover:shadow-md transition-all shadow-sm"
                                    >
                                        <IconComp className="w-4.5 h-4.5" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Main footer body ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pb-2">

                    {/* 1. Contact Us */}
                    <div>
                        <h4 className="inline-flex items-center justify-center bg-[#FFD100] text-black font-normal text-[11px] tracking-widest uppercase px-3 py-1 rounded-full mb-2.5 shadow-sm min-h-[22px]">
                            Contact Us
                        </h4>
                        <div className="space-y-1">
                            <div className="flex items-start gap-2.5 p-2 rounded-lg border border-gray-200/80 bg-white hover: transition-colors">
                                <MapPin className="text-black h-3.5 w-3.5 flex-shrink-0 mt-[1px]" />
                                <span className="text-[12px] font-normal text-black leading-tight">
                                    {data?.contact?.address || 'Plot No. E-56, Shop No. 2, Sector-09, Airoli, Navi Mumbai, Thane, Maharashtra – 400708 India'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200/80 bg-white hover: transition-colors">
                                <Phone className="text-black h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-[12px] font-normal text-black leading-tight">
                                    {data?.contact?.phone || '+91 96677 88869'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200/80 bg-white hover: transition-colors">
                                <Mail className="text-black h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-[12px] font-normal text-black leading-tight">
                                    {data?.contact?.email || 'info@vedashi.com'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Explore */}
                    <div>
                        <h4 className="inline-flex items-center justify-center bg-[#FFD100] text-black font-normal text-[11px] tracking-widest uppercase px-3 py-1 rounded-full mb-2.5 shadow-sm min-h-[22px]">
                            {columns[0]?.title || 'Explore'}
                        </h4>
                        <ul className="space-y-0 px-1">
                            {columns[0]?.items.map((item, ii) => (
                                <li key={ii} className="flex items-center">
                                    <Link
                                        href={item.href}
                                        className="text-[12px] font-normal text-black hover:text-[#3B5D3B] flex items-center h-5 transition-all"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 3. Support */}
                    <div>
                        <h4 className="inline-flex items-center justify-center bg-[#FFD100] text-black font-normal text-[11px] tracking-widest uppercase px-3 py-1 rounded-full mb-2.5 shadow-sm min-h-[22px]">
                            {columns[1]?.title || 'Support'}
                        </h4>
                        <ul className="space-y-0 px-1">
                            {columns[1]?.items.map((item, ii) => (
                                <li key={ii} className="flex items-center">
                                    <Link
                                        href={item.href}
                                        className="text-[12px] font-normal text-black hover:text-[#3B5D3B] flex items-center h-5 transition-all"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            <li className="flex items-center">
                                <button
                                    suppressHydrationWarning
                                    onClick={openSettings}
                                    className="text-[12px] font-normal text-black hover:text-[#3B5D3B] flex items-center h-5 transition-all bg-transparent border-none p-0 cursor-pointer text-left"
                                >
                                    Cookie Settings
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* 4. Newsletter */}
                    {newsletter && (
                        <div>
                            <h4 className="inline-flex items-center justify-center bg-[#FFD100] text-black font-normal text-[11px] tracking-widest uppercase px-3 py-1 rounded-full mb-2.5 shadow-sm min-h-[22px]">
                                {newsletter.title || 'Newsletter'}
                            </h4>
                            <p className="text-[12px] font-normal text-black leading-tight mb-2.5 px-1 min-h-[1.5rem] flex items-center">
                                {newsletter.description}
                            </p>
                            <form onSubmit={handleSubscribe} className="flex gap-2 mb-3" suppressHydrationWarning>
                                <input
                                    suppressHydrationWarning
                                    type="email"
                                    placeholder="Your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="flex-1 min-w-0 rounded-lg px-3 py-1.5 text-[11px] bg-white border border-gray-200 focus:outline-none focus:border-[#3B5D3B] placeholder:text-gray-400 font-normal text-black transition-all disabled:opacity-50"
                                />
                                <button
                                    suppressHydrationWarning
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-1.5 bg-[#01C800] text-white text-[10px] font-semibold uppercase tracking-widest rounded-lg hover:bg-[#03B302] shadow-sm transition-all whitespace-nowrap disabled:opacity-70 flex items-center justify-center min-w-[70px]"
                                >
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Subscribe'}
                                </button>
                            </form>

                            <div className="flex items-center gap-3 px-1 mt-3">
                                <RegionSwitcher upward={true} />
                                <GoogleTranslateWidget upward={true} />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Bottom Bar ── */}
                <div className="mt-2 pt-2 border-t border-gray-300/80 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-[12px] font-normal text-black">
                        {bottomBar?.copyright || `Copyright © ${new Date().getFullYear()} Vedashi | All Rights Reserved`}
                    </p>
                    <div className="flex items-center gap-1.5 opacity-50">
                        <div className="h-5 w-8 bg-gray-200 rounded-sm"></div>
                        <div className="h-5 w-8 bg-gray-200 rounded-sm"></div>
                        <div className="h-5 w-8 bg-gray-200 rounded-sm"></div>
                        <div className="h-5 w-8 bg-gray-200 rounded-sm"></div>
                    </div>
                </div>
            </div>
            {/* ── Bottom Green Strip ── */}
            <div className="w-full h-5 bg-[#01CC00] mt-4" />
        </footer>
    );
}

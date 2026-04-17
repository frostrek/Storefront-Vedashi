'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, MapPin, Phone, Mail, Leaf, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
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
                { label: 'Blogs', href: '/blog' },
                { label: 'All Products', href: '/products' },
                { label: 'Press & Media', href: '/press' },
                { label: 'Contact Us', href: '/contact' },
            ],
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', href: '/help-center' },
                { label: 'Track Order', href: '/track-order' },
                { label: 'Shipping & Returns', href: '/shipping' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
            ],
        },
    ],
    social: [
        { platform: 'Instagram', url: '#', icon_name: 'instagram' },
        { platform: 'YouTube', url: '#', icon_name: 'youtube' },
        { platform: 'Facebook', url: '#', icon_name: 'facebook' },
    ],
    newsletter: {
        title: 'Newsletter',
        description: 'Get 10% OFF + Weekly Ayurvedic Secrets',
    },
    bottom_bar: {
        copyright: `© ${new Date().getFullYear()} Vedashi. All rights reserved.`,
        text: 'Made with 💚 in India | Inspired by Ayurveda, backed by science.',
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

    const isDynamic = data?.settings?.use_dynamic_footer !== false;

    const company = (isDynamic && data?.company) ? data.company : FALLBACK.company;
    const columns = (isDynamic && data?.links && data.links.length > 0) ? data.links : (FALLBACK.links ?? []);
    const social = (isDynamic && data?.social && data.social.length > 0) ? data.social : (FALLBACK.social ?? []);
    const bottomBar = (isDynamic && data?.bottom_bar) ? data.bottom_bar : FALLBACK.bottom_bar;

    return (
        <footer className="relative z-10 font-sans">

            {/* ═══════════════ SUBSCRIBE BAR (floating at top) ═══════════════ */}
            <div className="bg-white">
                <div className="mx-auto max-w-[600px] px-6 relative -mb-5 pt-5">
                    <form onSubmit={handleSubscribe} className="flex relative z-20" suppressHydrationWarning>
                        <input
                            suppressHydrationWarning
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="flex-1 min-w-0 rounded-l-full px-6 py-3 text-[13px] bg-white border border-gray-200 border-r-0 focus:outline-none focus:border-[#91CA35] placeholder:text-gray-400 text-black transition-all disabled:opacity-50 shadow-sm"
                        />
                        <button
                            suppressHydrationWarning
                            type="submit"
                            disabled={loading}
                            className="px-7 py-3 bg-[#91CA35] text-white text-[11px] font-bold uppercase tracking-widest rounded-r-full hover:bg-[#b49d6a] transition-all whitespace-nowrap disabled:opacity-70 flex items-center justify-center min-w-[110px] shadow-sm"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Subscribe'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ═══════════════ MAIN DARK SECTION ═══════════════ */}
            <div className="bg-[#1a1a1a] text-gray-300 pt-10 pb-5">
                <div className="mx-auto max-w-[1500px] px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-between">

                        {/* 1. Vedashi Logo + Address */}
                        <div className="flex flex-col gap-2.5 items-start">
                            <Image
                                src={company?.logo_url || '/vedashi-logo.png'}
                                alt={company?.name || 'Vedashi'}
                                width={180}
                                height={48}
                                className="h-10 w-auto object-contain brightness-0 invert object-left"
                            />
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-start gap-2">
                                    <MapPin className="text-gray-500 h-3 w-3 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11.5px] text-gray-400 leading-snug">
                                        {data?.contact?.address || 'Plot No C-89, Shop No: 2, Sector-04, Airoli, Navi Mumbai, Thane, Maharashtra – 400708 India'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="text-gray-500 h-3 w-3 flex-shrink-0" />
                                    <span className="text-[11.5px] text-gray-400">
                                        {data?.contact?.phone || '+91 96677 88869'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="text-gray-500 h-3 w-3 flex-shrink-0" />
                                    <span className="text-[11.5px] text-gray-400">
                                        {data?.contact?.email || 'info@vedashi.com'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Explore */}
                        <div>
                            <h4 className="text-[#91CA35] font-semibold text-[12px] tracking-widest uppercase mb-1">
                                {columns[0]?.title || 'Explore'}
                            </h4>
                            <div className="w-7 h-[2px] bg-[#91CA35] mb-2.5" />
                            <ul className="space-y-1.5">
                                {columns[0]?.items.map((item, ii) => (
                                    <li key={ii}>
                                        <Link
                                            href={item.href}
                                            className="text-[12px] text-gray-400 hover:text-white transition-colors duration-200"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. Support */}
                        <div>
                            <h4 className="text-[#91CA35] font-semibold text-[12px] tracking-widest uppercase mb-1">
                                {columns[1]?.title || 'Support'}
                            </h4>
                            <div className="w-7 h-[2px] bg-[#91CA35] mb-2.5" />
                            <ul className="space-y-1.5">
                                {columns[1]?.items.map((item, ii) => (
                                    <li key={ii}>
                                        <Link
                                            href={item.href}
                                            className="text-[12px] text-gray-400 hover:text-white transition-colors duration-200"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <button
                                        suppressHydrationWarning
                                        onClick={openSettings}
                                        className="text-[12px] text-gray-400 hover:text-white transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer text-left"
                                    >
                                        Cookie Settings
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* 4. Follow Us + Social */}
                        <div className="flex flex-col items-start lg:items-end">
                            <h4 className="text-[#91CA35] font-semibold text-[12px] tracking-widest uppercase mb-1">
                                Follow Us
                            </h4>
                            <div className="w-7 h-[2px] bg-[#91CA35] mb-2.5" />
                            {social.length > 0 && (
                                <div className="flex gap-3">
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
                                                className="h-9 w-9 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#91CA35] hover:bg-[#91CA35]/10 transition-all duration-200"
                                            >
                                                <IconComp className="w-4.5 h-4.5" />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ TRUST BADGES STRIP ═══════════════ */}
            <div className="bg-[#222222] py-3 border-t border-[#2a2a2a]">
                <div className="mx-auto max-w-[1500px] px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-[#91CA35]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-white uppercase tracking-wide">100% Natural</p>
                                <p className="text-[10px] text-gray-500">Ayurveda Certified</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
                                <Truck className="h-5 w-5 text-[#91CA35]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-white uppercase tracking-wide">Free Shipping</p>
                                <p className="text-[10px] text-gray-500">above ₹499</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
                                <RotateCcw className="h-5 w-5 text-[#91CA35]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-white uppercase tracking-wide">Easy Returns</p>
                                <p className="text-[10px] text-gray-500">within 7 days</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5 text-[#91CA35]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-white uppercase tracking-wide">Secure Payments</p>
                                <p className="text-[10px] text-gray-500">100% protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ BOTTOM BAR ═══════════════ */}
            <div className="bg-[#111111] py-2.5">
                <div className="mx-auto max-w-[1500px] px-6 sm:px-8 lg:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                            <p className="text-[11px] text-gray-500">
                                {bottomBar?.copyright || `© ${new Date().getFullYear()} Vedashi. All rights reserved.`}
                            </p>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Made with 💚 in India | Inspired by Ayurveda, backed by science.
                        </p>
                        <div className="flex items-center gap-3">
                            <RegionSwitcher upward={true} />
                            <GoogleTranslateWidget upward={true} />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

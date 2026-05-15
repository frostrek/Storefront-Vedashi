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
        logo_url: '/vedashi-logo-white.png',
    },
    links: [
        {
            title: 'Explore',
            items: [
                { label: 'Our Story', href: '/about' },
                { label: 'Blogs', href: '/blog' },
                { label: 'All Products', href: '/products' },
                { label: 'Contact Us', href: '/contact' },
            ],
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', href: '/help-center' },
                { label: 'Shipping Policy', href: '/shipping' },
                { label: 'Return Policy', href: '/return-policy' },
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

    const FollowUsContent = (
        <div className="flex flex-col items-start pt-0 pl-0 sm:pl-[42px]">
            <h4 className="text-[#91CA35] font-semibold text-[10px] sm:text-[12px] tracking-widest uppercase mb-0.5 sm:mb-1">
                Follow Us
            </h4>
            <div className="w-7 h-[2px] bg-[#91CA35] mb-1.5 sm:mb-2.5" />
            {social.length > 0 && (
                <div className="flex gap-2 sm:gap-3">
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
                                className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#91CA35] hover:bg-[#91CA35]/10 transition-all duration-200"
                            >
                                <IconComp className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const partnerAndBulkBanners = (
        <>
            <div className="relative rounded-xl overflow-hidden bg-[#181818] border border-[#2a2a2a] group flex flex-col justify-center shadow-lg min-h-[75px] sm:min-h-[96px] w-full flex-shrink-0">
                <div className="absolute inset-y-0 left-0 w-[60%] z-0 overflow-hidden">
                    <Image
                        src="/Footer-banners/vendor regis.jpeg"
                        alt="Become a Partner"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Fade out the right edge of the block to blend smoothly */}
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#181818] to-transparent" />
                </div>

                <div className="relative z-10 py-2 px-3 sm:pr-4 flex flex-row items-center h-full w-full justify-end">
                    <div className="flex flex-col items-start w-[140px]">
                        <h5 className="text-[#91C935] text-[12px] sm:text-sm md:text-base font-bold mb-0.5 drop-shadow-md">Become a Partner</h5>
                        <p className="text-gray-200 text-[8.5px] sm:text-[9.5px] md:text-[10px] leading-tight mb-1 sm:mb-1.5 drop-shadow-sm">
                            Start selling with Vedashi<br />
                            and reach thousands.
                        </p>
                        <Link
                            href="/vendor-registration"
                            className="inline-flex w-fit items-center justify-center bg-[#91C935] hover:bg-[#7eb02e] text-white text-[9.5px] sm:text-[11px] font-medium py-1 px-3 sm:px-4 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(110,147,42,0.2)] hover:shadow-[0_6px_16px_rgba(110,147,42,0.3)] hover:-translate-y-0.5"
                        >
                            Register Now
                        </Link>
                    </div>
                </div>
            </div>
            {/* Bulk Orders */}
            <div className="relative rounded-xl overflow-hidden bg-[#181818] border border-[#2a2a2a] group flex flex-col justify-center shadow-lg min-h-[75px] sm:min-h-[96px] w-full flex-shrink-0">
                <div className="absolute inset-y-0 left-0 w-[60%] z-0 overflow-hidden">
                    <Image
                        src="/Footer-banners/bulk order.jpeg"
                        alt="Bulk Orders"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Fade out the right edge of the block to blend smoothly */}
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#181818] to-transparent" />
                </div>

                <div className="relative z-10 py-2 px-3 sm:pr-4 flex flex-row items-center h-full w-full justify-end">
                    <div className="flex flex-col items-start w-[140px]">
                        <h5 className="text-[#91C935] text-[12px] sm:text-sm md:text-base font-bold mb-0.5 drop-shadow-md">Bulk Orders</h5>
                        <p className="text-gray-200 text-[8.5px] sm:text-[9.5px] md:text-[10px] leading-tight mb-1 sm:mb-1.5 drop-shadow-sm">
                            Stock up on Vedashi<br />
                            products at special prices.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex w-fit items-center justify-center bg-[#91C935] hover:bg-[#7eb02e] text-white text-[9.5px] sm:text-[11px] font-medium py-1 px-3 sm:px-4 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(110,147,42,0.2)] hover:shadow-[0_6px_16px_rgba(110,147,42,0.3)] hover:-translate-y-0.5"
                        >
                            Inquire Now
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <footer className="relative z-10 font-sans" style={{ isolation: 'auto' }}>

            {/* ═══════════════ SUBSCRIBE BAR (floating at top) ═══════════════ */}
            <div className="bg-transparent">
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
                            className="px-7 py-3 bg-[#91CA35] text-white text-[11px] font-bold uppercase tracking-widest rounded-r-full hover:bg-[#7eb02e] transition-all whitespace-nowrap disabled:opacity-70 flex items-center justify-center min-w-[110px] shadow-sm"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Subscribe'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ═══════════════ MAIN DARK SECTION ═══════════════ */}
            <div className="bg-[#1a1a1a] text-gray-300 pt-4 sm:pt-10 pb-2 sm:pb-5">
                <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">

                    {/* Mobile-only Banners Below Subscribe */}
                    <div className="flex sm:hidden flex-col items-center gap-3 justify-center pt-4 pb-2 mb-2">
                        {partnerAndBulkBanners}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-6 xl:gap-8 justify-between">

                        {/* 1. Vedashi Logo + Address */}
                        <div className="flex flex-col gap-3 sm:gap-6 items-start lg:col-span-5">
                            <div className="flex flex-col gap-2 sm:gap-2.5 items-start">
                                <Image
                                    src={company?.logo_url || '/vedashi-logo-white.png'}
                                    alt={company?.name || 'Vedashi'}
                                    width={180}
                                    height={48}
                                    className="h-10 w-auto object-contain object-left"
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

                            {/* Follow Us (Desktop Only here) */}
                            <div className="hidden sm:block">
                                {FollowUsContent}
                            </div>
                        </div>

                        {/* 2 & 3. Explore & Support (Grouped for 2 columns on Mobile) */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-4 md:col-span-1">
                            {/* 2. Explore */}
                            <div className="flex flex-col">
                                <h4 className="text-[#91CA35] font-semibold text-[10px] sm:text-[12px] tracking-widest uppercase mb-0.5 sm:mb-1">
                                    {columns[0]?.title || 'Explore'}
                                </h4>
                                <div className="w-7 h-[2px] bg-[#91CA35] mb-1.5 sm:mb-2.5" />
                                <ul className="space-y-0 sm:space-y-1.5 flex-grow">
                                    {columns[0]?.items.map((item, ii) => (
                                        <li key={ii}>
                                            <Link
                                                href={item.href}
                                                className="text-[11px] sm:text-[12px] text-gray-400 hover:text-white transition-colors duration-200"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                {/* Mobile-only Follow Us */}
                                <div className="block sm:hidden mt-4">
                                    {FollowUsContent}
                                </div>

                                {/* Mobile-only Currency & Language */}
                                <div className="flex md:hidden flex-row items-center gap-0 mt-2 relative z-[200]">
                                    <div className="scale-[0.85] origin-left">
                                        <RegionSwitcher upward={true} />
                                    </div>
                                    <div className="scale-[0.85] origin-left -ml-4">
                                        <GoogleTranslateWidget upward={true} />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Support */}
                            <div>
                                <h4 className="text-[#91CA35] font-semibold text-[10px] sm:text-[12px] tracking-widest uppercase mb-0.5 sm:mb-1">
                                    {columns[1]?.title || 'Support'}
                                </h4>
                                <div className="w-7 h-[2px] bg-[#91CA35] mb-1.5 sm:mb-2.5" />
                                <ul className="space-y-0 sm:space-y-1.5">
                                    {columns[1]?.items.map((item, ii) => (
                                        <li key={ii}>
                                            <Link
                                                href={item.href}
                                                className="text-[11px] sm:text-[12px] text-gray-400 hover:text-white transition-colors duration-200"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            suppressHydrationWarning
                                            onClick={openSettings}
                                            className="text-[11px] sm:text-[12px] text-gray-400 hover:text-white transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer text-left"
                                        >
                                            Cookie Settings
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* 4. Partner / Vendor Registration (Desktop Only) */}
                        <div className="hidden sm:flex lg:col-span-3 flex-col gap-3 justify-start">
                            {partnerAndBulkBanners}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ TRUST BADGES STRIP ═══════════════ */}
            <div className="bg-[#222222] py-2 sm:py-3 border-t border-[#2a2a2a]">
                <div className="mx-auto max-w-[1500px] px-2 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-3">
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <Leaf className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">100% Natural</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">Ayurveda Certified</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <Truck className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">Free Shipping</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">Free Worldwide Shipping</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">Authentic</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">Trusted sources & sellers</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">Secure Pay</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">100% protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ BOTTOM BAR ═══════════════ */}
            <div className="bg-[#111111] py-1.5 sm:py-2.5 relative z-[200]">
                <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-1 sm:gap-2">
                        <p className="text-[9.5px] sm:text-[11px] text-gray-500 text-center order-1 md:order-2">
                            Made with 💚 in India | Inspired by Ayurveda, backed by science.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-3 order-2 md:order-1 mt-0.5 md:mt-0">
                            <p className="text-[9.5px] sm:text-[11px] text-gray-500 text-center">
                                {bottomBar?.copyright || `© ${new Date().getFullYear()} Vedashi. All rights reserved.`}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 sm:gap-3 mt-1 sm:mt-0 order-3 md:order-3 relative z-[200]">
                            <div className="scale-90 sm:scale-100 origin-right">
                                <RegionSwitcher upward={true} />
                            </div>
                            <div className="scale-90 sm:scale-100 origin-left">
                                <GoogleTranslateWidget upward={true} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

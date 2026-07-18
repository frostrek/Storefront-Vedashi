'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, MapPin, Phone, Mail, Leaf, Truck, RotateCcw, ShieldCheck, FileText, ExternalLink, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCookieConsent } from '@/context/CookieConsentContext';
import { API_URL, subscribeNewsletter } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { buildPath, getCountryFromPathname } from '@/lib/currency';
import { RU_DICTIONARY } from '@/content/ru';

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
        description: RU_DICTIONARY.footer.companyDesc,
        logo_url: '/vedashi-logo-white.webp',
    },
    links: [
        {
            title: RU_DICTIONARY.footer.explore,
            items: [
                { label: RU_DICTIONARY.footer.ourStory, href: ROUTES.about },
                { label: RU_DICTIONARY.footer.blogs, href: ROUTES.blog },
                { label: RU_DICTIONARY.footer.allProducts, href: ROUTES.katalog },
                { label: RU_DICTIONARY.footer.contactUs, href: ROUTES.contact },
            ],
        },
        {
            title: RU_DICTIONARY.footer.support,
            items: [
                { label: RU_DICTIONARY.footer.helpCenter, href: ROUTES.helpCenter },
                { label: RU_DICTIONARY.footer.shippingPolicy, href: ROUTES.shipping },
                { label: RU_DICTIONARY.footer.returnPolicy, href: ROUTES.returnPolicy },
                { label: RU_DICTIONARY.footer.termsOfService, href: ROUTES.terms },
                { label: RU_DICTIONARY.footer.privacyPolicyFooter, href: ROUTES.privacy },
            ],
        },
    ],
    social: [
        { platform: 'Instagram', url: '#', icon_name: 'instagram' },
        { platform: 'YouTube', url: '#', icon_name: 'youtube' },
        { platform: 'Facebook', url: '#', icon_name: 'facebook' },
    ],
    newsletter: {
        title: RU_DICTIONARY.footer.newsletter,
        description: RU_DICTIONARY.footer.newsletterDesc,
    },
    bottom_bar: {
        copyright: RU_DICTIONARY.footer.copyright,
        text: RU_DICTIONARY.footer.madeWith,
    },
};

// ─── Footer Component ─────────────────────────────────────────────

export default function Footer() {
    const pathname = usePathname();
    const currentCountry = getCountryFromPathname(pathname || '/');
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
        if (!email || !email.includes('@')) { toast.error(RU_DICTIONARY.footer.validEmail); return; }
        setLoading(true);
        try {
            const res = await subscribeNewsletter(email);
            if (res.success) { toast.success(res.message || RU_DICTIONARY.footer.subscribeSuccess); setEmail(''); }
            else toast.error(res.message || RU_DICTIONARY.footer.subscribeFailed);
        } catch { toast.error(RU_DICTIONARY.footer.commError); }
        finally { setLoading(false); }
    };

    if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

    const isDynamic = data?.settings?.use_dynamic_footer !== false;

    const company = (isDynamic && data?.company) ? data.company : FALLBACK.company;
    let columns = (isDynamic && data?.links && data.links.length > 0) ? data.links : (FALLBACK.links ?? []);
    const social = (isDynamic && data?.social && data.social.length > 0) ? data.social : (FALLBACK.social ?? []);
    const bottomBar = (isDynamic && data?.bottom_bar) ? data.bottom_bar : FALLBACK.bottom_bar;

    // ─── Russia-only: always use Russian footer links when not dynamic ───
    if (!isDynamic) {
        columns = [
            {
                title: 'Навигация',
                items: [
                    { label: 'О нас', href: ROUTES.about },
                    { label: 'Блог', href: ROUTES.blog },
                    { label: 'Все товары', href: ROUTES.katalog },
                    { label: 'Контакты', href: ROUTES.contact },
                ],
            },
            {
                title: 'Информация',
                items: [
                    { label: 'Центр помощи', href: ROUTES.helpCenter },
                    { label: 'Доставка', href: ROUTES.shipping },
                    { label: 'Возврат', href: ROUTES.returnPolicy },
                    { label: 'Условия', href: ROUTES.terms },
                    { label: 'Конфиденциальность', href: ROUTES.privacy },
                ],
            },
        ];
    }

    const FollowUsContent = (
        <div className="flex flex-col items-start pt-0 pl-0 sm:pl-[42px]">
            <h4 className="text-[#91CA35] font-semibold text-[10px] sm:text-[12px] tracking-widest uppercase mb-0.5 sm:mb-1">
                {RU_DICTIONARY.footer.followUs}
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
                        alt={RU_DICTIONARY.footer.becomePartnerAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Fade out the right edge of the block to blend smoothly */}
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#181818] to-transparent" />
                </div>

                <div className="relative z-10 py-2 px-3 sm:pr-4 flex flex-row items-center h-full w-full justify-end">
                    <div className="flex flex-col items-start w-[140px]">
                        <h5 className="text-[#91C935] text-[12px] sm:text-sm md:text-base font-bold mb-0.5 drop-shadow-md">{RU_DICTIONARY.footer.becomePartner}</h5>
                        <p className="text-gray-200 text-[8.5px] sm:text-[9.5px] md:text-[10px] leading-tight mb-1 sm:mb-1.5 drop-shadow-sm">
                            {RU_DICTIONARY.footer.becomePartnerSub}
                        </p>
                        <Link
                            href="/vendor-registration"
                            className="inline-flex w-fit items-center justify-center bg-[#91C935] hover:bg-[#7eb02e] text-white text-[9.5px] sm:text-[11px] font-medium py-1 px-3 sm:px-4 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(110,147,42,0.2)] hover:shadow-[0_6px_16px_rgba(110,147,42,0.3)] hover:-translate-y-0.5"
                        >
                            {RU_DICTIONARY.footer.registerNow}
                        </Link>
                    </div>
                </div>
            </div>
            {/* Bulk Orders */}
            <div className="relative rounded-xl overflow-hidden bg-[#181818] border border-[#2a2a2a] group flex flex-col justify-center shadow-lg min-h-[75px] sm:min-h-[96px] w-full flex-shrink-0">
                <div className="absolute inset-y-0 left-0 w-[60%] z-0 overflow-hidden">
                    <Image
                        src="/Footer-banners/bulk order.jpeg"
                        alt={RU_DICTIONARY.footer.bulkOrdersAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Fade out the right edge of the block to blend smoothly */}
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#181818] to-transparent" />
                </div>

                <div className="relative z-10 py-2 px-3 sm:pr-4 flex flex-row items-center h-full w-full justify-end">
                    <div className="flex flex-col items-start w-[140px]">
                        <h5 className="text-[#91C935] text-[12px] sm:text-sm md:text-base font-bold mb-0.5 drop-shadow-md">{RU_DICTIONARY.footer.bulkOrders}</h5>
                        <p className="text-gray-200 text-[8.5px] sm:text-[9.5px] md:text-[10px] leading-tight mb-1 sm:mb-1.5 drop-shadow-sm">
                            {RU_DICTIONARY.footer.bulkOrdersSub}
                        </p>
                        <Link
                            href={ROUTES.contact}
                            className="inline-flex w-fit items-center justify-center bg-[#91C935] hover:bg-[#7eb02e] text-white text-[9.5px] sm:text-[11px] font-medium py-1 px-3 sm:px-4 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(110,147,42,0.2)] hover:shadow-[0_6px_16px_rgba(110,147,42,0.3)] hover:-translate-y-0.5"
                        >
                            {RU_DICTIONARY.footer.inquireNow}
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
                            placeholder={RU_DICTIONARY.footer.enterEmail}
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
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : RU_DICTIONARY.footer.subscribe}
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
                                            {data?.contact?.address || '117292, г. Москва, вн.тер.г. муниципальный округ Академический, ул. Шверника, д. 6, к. 1, помещ. 8П'}
                                            {!data?.contact?.address && (
                                                <>
                                                    <br />
                                                    <span className="text-gray-500">Генеральный директор: Андреев Кирилл Павлович</span>
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Mail className="text-gray-500 h-3 w-3 flex-shrink-0" />
                                        <a href={`mailto:${data?.contact?.email || 'info@vedashiherbals.com'}`} className="text-[11.5px] text-gray-400 hover:text-[#91C934] transition-colors">
                                            {data?.contact?.email || 'info@vedashiherbals.com'}
                                        </a>
                                    </div>
                                    <div className="flex items-start gap-2 mt-0.5">
                                        <FileText className="text-gray-500 h-3 w-3 flex-shrink-0 mt-0.5" />
                                        <div className="flex flex-col gap-0.5 text-[11.5px] text-gray-400 leading-tight">
                                            <span>ИНН 9727117720</span>
                                            <span>КПП 772701001</span>
                                            <span>ОГРН 1257700504709</span>
                                        </div>
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
                                    {columns[0]?.title || RU_DICTIONARY.footer.explore}
                                </h4>
                                <div className="w-7 h-[2px] bg-[#91CA35] mb-1.5 sm:mb-2.5" />
                                <ul className="space-y-0 sm:space-y-1.5 flex-grow">
                                    {columns[0]?.items.map((item, ii) => (
                                        <li key={ii}>
                                            <Link
                                                href={item.href.startsWith('/') ? buildPath(currentCountry, item.href) : item.href}
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


                            </div>

                            {/* 3. Support */}
                            <div>
                                <h4 className="text-[#91CA35] font-semibold text-[10px] sm:text-[12px] tracking-widest uppercase mb-0.5 sm:mb-1">
                                    {columns[1]?.title || RU_DICTIONARY.footer.support}
                                </h4>
                                <div className="w-7 h-[2px] bg-[#91CA35] mb-1.5 sm:mb-2.5" />
                                <ul className="space-y-0 sm:space-y-1.5">
                                    {columns[1]?.items.map((item, ii) => (
                                        <li key={ii}>
                                            <Link
                                                href={item.href.startsWith('/') ? buildPath(currentCountry, item.href) : item.href}
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
                                            {RU_DICTIONARY.footer.cookieSettings || 'Cookie Settings'}
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
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">{RU_DICTIONARY.footer.natural}</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">{RU_DICTIONARY.footer.naturalSub}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <Truck className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">{RU_DICTIONARY.footer.freeShipping}</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">{RU_DICTIONARY.footer.freeShippingSub}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">{RU_DICTIONARY.footer.authentic}</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">{RU_DICTIONARY.footer.authenticSub}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-start gap-1 sm:gap-3 text-center sm:text-left">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#91CA35]" />
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-[8px] sm:text-[11px] font-bold text-white uppercase tracking-tight sm:tracking-wide leading-[1.1] text-center sm:text-left">{RU_DICTIONARY.footer.securePay}</p>
                                <p className="hidden sm:block text-[10px] text-gray-500 leading-tight">{RU_DICTIONARY.footer.securePaySub}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ BOTTOM BAR ═══════════════ */}
            <div className="bg-[#111111] py-1.5 sm:py-2.5 relative z-[200]">
                <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-1 sm:gap-2">
                        <p className="text-gray-400 text-xs text-center sm:text-left">
                            {RU_DICTIONARY.footer.copyright}
                        </p>
                        <p className="text-[#91C935]/80 text-[10px] text-center sm:text-right">
                            {RU_DICTIONARY.footer.madeWith}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

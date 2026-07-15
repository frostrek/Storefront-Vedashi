'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Search, ChevronDown, ChevronLeft, HelpCircle,
    CreditCard, Truck, Leaf, ShieldCheck, Clock,
    Mail, ArrowUpRight, BookOpen, FileText, Sparkles
} from 'lucide-react';
import { getFaqs, searchFaqs } from '@/lib/api';
import { generateFAQPageJsonLd } from '@/lib/seo';
import { RU_DICTIONARY } from '@/content/ru';

interface Faq {
    faq_id: string;
    question: string;
    answer: string;
    category: string;
    sort_order?: number;
    is_active?: boolean;
}

/* ── Category icon mapping ─────────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Account & Billing': CreditCard,
    'Orders & Shipping': Truck,
    'Products & Ingredients': Leaf,
    'Returns & Refunds': ShieldCheck,
    'General': HelpCircle,
};

function getCategoryIcon(category: string) {
    return CATEGORY_ICONS[category] || HelpCircle;
}

export default function FAQPage() {
    const [faqData, setFaqData] = useState<{ faqs: Faq[]; grouped: Record<string, Faq[]> }>({ faqs: [], grouped: {} });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Faq[] | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFaqs().then((data) => {
            setFaqData(data || { faqs: [], grouped: {} });
            setLoading(false);
        });
    }, []);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        const results = await searchFaqs(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
    }, [searchQuery]);

    const categories = Object.keys(faqData.grouped || {});

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Structured Data */}
            {!loading && faqData.faqs.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageJsonLd(faqData.faqs)) }}
                />
            )}

            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section className="relative overflow-hidden py-20 px-6">
                {/* Ayurvedic Texture Background */}
                <div 
                    className="absolute inset-0 z-0 opacity-40 bg-repeat bg-center"
                    style={{ 
                        backgroundImage: "url('/ayurvedic-texture.png')",
                        backgroundSize: '400px',
                        filter: 'sepia(0.1) contrast(1.05)'
                    }}
                ></div>

                {/* Decorative botanical SVG background */}
                <div className="absolute inset-0 opacity-[0.1] pointer-events-none">
                    <svg className="absolute top-0 right-0 h-full w-1/2" viewBox="0 0 400 500" fill="none">
                        <path d="M250 50 C300 100, 350 200, 300 300 C250 400, 150 450, 100 400 C50 350, 80 250, 150 200 C220 150, 200 0, 250 50Z" stroke="#4A5D23" strokeWidth="1.5" fill="none" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-[#4A5D23]/10 backdrop-blur-sm border border-[#4A5D23]/10 rounded-full px-5 py-2 mb-6 shadow-sm">
                        <Sparkles className="h-4 w-4 text-[#4A5D23]" />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2D3A15]">{RU_DICTIONARY.helpCenter.faqPage.hero.badge}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-[#1a2408] mb-6 leading-tight">
                        {RU_DICTIONARY.helpCenter.faqPage.hero.titlePart1} <em className="not-italic text-[#4A5D23]">{RU_DICTIONARY.helpCenter.faqPage.hero.titlePart2}</em>
                    </h1>

                    {/* Search bar */}
                    <div className="relative max-w-2xl mx-auto mt-10 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#4A5D23]/20 to-[#8B4513]/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value.trim()) setSearchResults(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder={RU_DICTIONARY.helpCenter.faqPage.hero.searchPlaceholder}
                            className="relative w-full pl-14 pr-4 py-5 rounded-2xl bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 text-lg border border-[#4A5D23]/10 focus:outline-none focus:ring-2 focus:ring-[#4A5D23] shadow-2xl transition-all"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-[#4A5D23]" />
                    </div>
                </div>
            </section>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">

                {/* Search results banner */}
                {searchResults && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#4A5D23]/10">
                            <h2 className="text-2xl font-bold text-[#1a2408] flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-[#4A5D23] rounded-full"></div>
                                {searchResults.length > 0
                                    ? `${searchResults.length} ${searchResults.length !== 1 ? RU_DICTIONARY.helpCenter.faqPage.results.resultsFor : RU_DICTIONARY.helpCenter.faqPage.results.resultFor} "${searchQuery}"`
                                    : RU_DICTIONARY.helpCenter.faqPage.results.noResults}
                            </h2>
                            <button
                                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                                className="px-4 py-2 rounded-xl bg-[#4A5D23]/5 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white font-bold text-sm transition-all shadow-sm"
                            >
                                {RU_DICTIONARY.helpCenter.faqPage.results.clearSearch}
                            </button>
                        </div>
                        {searchResults.length > 0 ? (
                            <div className="grid gap-4 mb-12">
                                {searchResults.map((faq: Faq) => (
                                    <div
                                        key={faq.faq_id}
                                        className="bg-white rounded-2xl border border-[#4A5D23]/5 overflow-hidden transition-all hover:border-[#4A5D23]/20 hover:shadow-xl group"
                                    >
                                        <button
                                            onClick={() => setExpandedId(expandedId === faq.faq_id ? null : faq.faq_id)}
                                            className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
                                        >
                                            <span className="text-lg font-bold text-[#1a2408] pr-6 group-hover:text-[#4A5D23] transition-colors">{faq.question}</span>
                                            <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-[#4A5D23]/10 transition-colors ${expandedId === faq.faq_id ? 'bg-[#4A5D23] text-white' : 'text-[#4A5D23]'}`}>
                                                <ChevronDown
                                                    className={`h-5 w-5 transition-transform duration-300 ${expandedId === faq.faq_id ? 'rotate-180 text-white' : ''}`}
                                                />
                                            </div>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${expandedId === faq.faq_id ? 'max-h-[800px] border-t border-gray-50' : 'max-h-0'}`}>
                                            <div className="p-6 text-base text-[#5B4A31] leading-relaxed whitespace-pre-line bg-gray-50/30">
                                                {faq.answer}
                                            </div>
                                            <div className="px-6 pb-6">
                                                <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-[#4A5D23]/10 text-[#4A5D23]">
                                                    {(RU_DICTIONARY.helpCenter.faqPage.categories as Record<string, string>)[faq.category] || faq.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-[#4A5D23]/5">
                                <Search className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-[#1a2408] mb-2">{RU_DICTIONARY.helpCenter.faqPage.results.noMatchingTitle}</h3>
                                <p className="text-[#5B4A31]">{RU_DICTIONARY.helpCenter.faqPage.results.noMatchingDesc}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* ─── LEFT COLUMN: FAQ Accordions ─── */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-12">
                            <h2 className="text-3xl md:text-5xl font-bold text-[#1a2408] mb-4">
                                {RU_DICTIONARY.helpCenter.faqPage.main.title}
                            </h2>
                            <p className="text-lg text-[#5B4A31] max-w-2xl leading-relaxed">
                                {RU_DICTIONARY.helpCenter.faqPage.main.desc}
                            </p>
                        </div>

                        {loading ? (
                            /* Loading skeleton */
                            <div className="space-y-12">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
                                            <div className="h-8 bg-gray-200 rounded-full w-48 animate-pulse" />
                                        </div>
                                        <div className="space-y-4">
                                            {[...Array(2)].map((_, j) => (
                                                <div key={j} className="bg-white rounded-2xl p-8 border border-gray-100 animate-pulse">
                                                    <div className="h-6 bg-gray-200 rounded-full w-3/4" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : categories.length === 0 && faqData.faqs.length === 0 ? (
                            /* Empty state */
                            <div className="text-center py-24 bg-white rounded-[40px] border border-[#4A5D23]/5">
                                <HelpCircle className="h-20 w-20 text-gray-100 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-[#1a2408] mb-2">{RU_DICTIONARY.helpCenter.faqPage.main.noFaqsTitle}</h3>
                                <p className="text-[#5B4A31]">{RU_DICTIONARY.helpCenter.faqPage.main.noFaqsDesc}</p>
                            </div>
                        ) : !searchResults && (
                            /* Category-grouped FAQ sections */
                            <div className="space-y-16">
                                {(categories.length > 0 ? categories : ['General']).map((category) => {
                                    const Icon = getCategoryIcon(category);
                                    const faqs = categories.length > 0
                                        ? (faqData.grouped?.[category] || [])
                                        : faqData.faqs || [];

                                    if (faqs.length === 0) return null;

                                    return (
                                        <div key={category} className="faq-category-group">
                                            {/* Category header */}
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 rounded-2xl bg-[#4A5D23]/10 flex items-center justify-center shadow-inner">
                                                    <Icon className="h-6 w-6 text-[#4A5D23]" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-[#1a2408] tracking-tight">{(RU_DICTIONARY.helpCenter.faqPage.categories as Record<string, string>)[category] || category}</h3>
                                            </div>

                                            {/* FAQ items */}
                                            <div className="grid gap-4">
                                                {faqs.map((faq: Faq) => {
                                                    const isExpanded = expandedId === faq.faq_id;
                                                    return (
                                                        <div
                                                            key={faq.faq_id}
                                                            className={`bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${isExpanded
                                                                ? 'border-[#4A5D23]/30 shadow-2xl scale-[1.01]'
                                                                : 'border-[#4A5D23]/5 hover:border-[#4A5D23]/15 hover:shadow-lg'
                                                                }`}
                                                        >
                                                            <button
                                                                onClick={() => setExpandedId(isExpanded ? null : faq.faq_id)}
                                                                className="w-full flex items-center justify-between p-7 text-left cursor-pointer group"
                                                            >
                                                                <span className="text-lg font-bold text-[#1a2408] pr-8 group-hover:text-[#4A5D23] transition-colors leading-snug">
                                                                    {faq.question}
                                                                </span>
                                                                <div className={`p-2.5 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-[#4A5D23] text-white' : 'bg-[#4A5D23]/5 text-[#4A5D23] group-hover:bg-[#4A5D23]/10'}`}>
                                                                    <ChevronDown
                                                                        className={`h-5 w-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
                                                                    />
                                                                </div>
                                                            </button>
                                                            <div
                                                                className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] border-t border-gray-50' : 'max-h-0'}`}
                                                            >
                                                                <div className="p-8 text-lg text-[#5B4A31] leading-relaxed whitespace-pre-line bg-gray-50/30">
                                                                    {faq.answer}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ─── RIGHT COLUMN: Sidebar ─── */}
                    <div className="w-full lg:w-[380px] flex-shrink-0">
                        <div className="lg:sticky lg:top-8 space-y-10">

                            {/* Featured: Our Organic Promise */}
                            <div className="relative group bg-[#1a2408] rounded-[40px] p-10 overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-[url('/ayurvedic-texture.png')] opacity-10 bg-repeat pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#4A5D23] flex items-center justify-center shadow-lg">
                                                <ShieldCheck className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-xs font-black text-[#A6BF8F] uppercase tracking-[0.2em]">{RU_DICTIONARY.helpCenter.faqPage.sidebar.featured}</span>
                                        </div>
                                        <Leaf className="h-10 w-10 text-[#4A5D23]/40 -mr-2" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#F2E8CF] mb-4">{RU_DICTIONARY.helpCenter.faqPage.sidebar.promiseTitle}</h3>
                                    <p className="text-base text-[#A6BF8F] leading-relaxed mb-8 font-medium">
                                        {RU_DICTIONARY.helpCenter.faqPage.sidebar.promiseDesc}
                                    </p>
                                    <ul className="space-y-4 mb-10">
                                        {RU_DICTIONARY.helpCenter.faqPage.sidebar.promiseItems.map((item) => (
                                            <li key={item} className="flex items-center gap-3 text-sm text-[#FDFBF7] font-semibold">
                                                <div className="w-2 h-2 rounded-full bg-[#A6BF8F] shadow-[0_0_8px_rgba(166,191,143,0.5)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                            {/* Still need help? */}
                            <div className="bg-white rounded-[40px] border border-[#4A5D23]/5 p-10 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A5D23]/5 rounded-bl-[100px] pointer-events-none"></div>
                                <h3 className="text-2xl font-bold text-[#1a2408] mb-4">{RU_DICTIONARY.helpCenter.faqPage.sidebar.needHelpTitle}</h3>
                                <p className="text-base text-[#5B4A31] leading-relaxed mb-8 font-medium">
                                    {RU_DICTIONARY.helpCenter.faqPage.sidebar.needHelpDesc}
                                </p>
                                <Link
                                    href="/help-center/support"
                                    className="flex items-center justify-center gap-3 bg-[#4A5D23] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#3a491b] transition-all shadow-lg hover:-translate-y-1"
                                >
                                    <Mail className="h-5 w-5" />
                                    {RU_DICTIONARY.helpCenter.faqPage.sidebar.contactUs}
                                </Link>
                                <div className="flex items-center justify-around mt-10 pt-8 border-t border-gray-100">
                                    <div className="flex flex-col items-center gap-1">
                                        <Clock className="h-6 w-6 text-[#4A5D23] opacity-60" />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{RU_DICTIONARY.helpCenter.faqPage.sidebar.monFri}</span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-100"></div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Mail className="h-6 w-6 text-[#4A5D23] opacity-60" />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{RU_DICTIONARY.helpCenter.faqPage.sidebar.reply24h}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back + CTA footer */}
                <div className="mt-24 flex flex-col sm:flex-row items-center justify-between gap-8 border-t-2 border-[#4A5D23]/5 pt-12">
                    <Link
                        href="/help-center"
                        className="inline-flex items-center gap-3 text-lg font-bold text-[#5B4A31] hover:text-[#4A5D23] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-[#4A5D23] group-hover:text-white transition-all">
                            <ChevronLeft className="h-6 w-6" />
                        </div>
                        {RU_DICTIONARY.helpCenter.faqPage.footer.home}
                    </Link>
                    <Link
                        href="/help-center/support"
                        className="inline-flex items-center gap-3 bg-white text-[#4A5D23] border-2 border-[#4A5D23] px-10 py-5 rounded-[20px] font-black text-lg hover:bg-[#4A5D23] hover:text-white transition-all shadow-xl hover:-translate-y-1"
                    >
                        {RU_DICTIONARY.helpCenter.faqPage.footer.submitTicket}
                    </Link>
                </div>
            </div>
        </div>
    );
}

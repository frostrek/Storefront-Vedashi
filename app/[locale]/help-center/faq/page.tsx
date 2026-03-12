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
    const [faqData, setFaqData] = useState<any>({ faqs: [], grouped: {} });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFaqs().then((data: any) => {
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
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* Structured Data */}
            {!loading && faqData.faqs.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageJsonLd(faqData.faqs)) }}
                />
            )}

            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#3d5c3a] via-[#4a6b47] to-[#5a7a57] py-16 md:py-20 px-6">
                {/* Decorative botanical SVG background */}
                <div className="absolute inset-0 opacity-[0.06]">
                    <svg className="absolute top-0 right-0 h-full w-1/2" viewBox="0 0 400 500" fill="none">
                        <path d="M250 50 C300 100, 350 200, 300 300 C250 400, 150 450, 100 400 C50 350, 80 250, 150 200 C220 150, 200 0, 250 50Z" stroke="white" strokeWidth="1.5" fill="none" />
                        <path d="M280 100 C330 150, 370 250, 320 340 C270 430, 170 470, 130 420" stroke="white" strokeWidth="1" fill="none" />
                        <path d="M200 80 Q250 150, 230 250 Q210 350, 160 380" stroke="white" strokeWidth="1" fill="none" />
                    </svg>
                    <svg className="absolute bottom-0 left-0 h-3/4 w-1/3" viewBox="0 0 300 400" fill="none">
                        <path d="M50 350 C0 300, 20 200, 80 150 C140 100, 200 120, 180 200 C160 280, 100 320, 50 350Z" stroke="white" strokeWidth="1.5" fill="none" />
                        <path d="M80 300 C40 260, 60 180, 110 140" stroke="white" strokeWidth="1" fill="none" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Knowledge Base badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                        <Sparkles className="h-3.5 w-3.5 text-[#c8d8a0]" />
                        <span className="text-xs font-semibold tracking-widest uppercase text-white/90">Knowledge Base</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                        How can we help you <em className="not-italic text-[#c8d8a0]">grow</em>?
                    </h1>

                    {/* Search bar */}
                    <div className="relative max-w-xl mx-auto mt-8">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value.trim()) setSearchResults(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search for tracking, returns, or ingredients..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8d8a0] shadow-xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                </div>
            </section>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">

                {/* Search results banner */}
                {searchResults && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">
                                {searchResults.length > 0
                                    ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                                    : 'No results found'}
                            </h2>
                            <button
                                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                                className="text-sm text-[#3d5c3a] hover:underline font-medium cursor-pointer"
                            >
                                Clear search
                            </button>
                        </div>
                        {searchResults.length > 0 ? (
                            <div className="space-y-3 mb-8">
                                {searchResults.map((faq: any) => (
                                    <div
                                        key={faq.faq_id}
                                        className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all hover:border-[#3d5c3a]/20 hover:shadow-sm"
                                    >
                                        <button
                                            onClick={() => setExpandedId(expandedId === faq.faq_id ? null : faq.faq_id)}
                                            className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                                        >
                                            <span className="text-sm font-semibold text-gray-800 pr-4">{faq.question}</span>
                                            <ChevronDown
                                                className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${expandedId === faq.faq_id ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${expandedId === faq.faq_id ? 'max-h-[500px] pb-5' : 'max-h-0'}`}>
                                            <div className="px-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                                {faq.answer}
                                            </div>
                                            <div className="px-5 mt-3">
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-[#3d5c3a]/10 text-[#3d5c3a]">
                                                    {faq.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Try a different search term or browse categories below.</p>
                        )}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* ─── LEFT COLUMN: FAQ Accordions ─── */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-8">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-sm text-gray-500">
                                Quick answers to our most common inquiries, categorized for your convenience.
                            </p>
                        </div>

                        {loading ? (
                            /* Loading skeleton */
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            {[...Array(2)].map((_, j) => (
                                                <div key={j} className="bg-white rounded-xl p-5 animate-pulse">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : categories.length === 0 && faqData.faqs.length === 0 ? (
                            /* Empty state */
                            <div className="text-center py-16">
                                <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-1">No FAQs available</h3>
                                <p className="text-sm text-gray-400">Check back soon for updates</p>
                            </div>
                        ) : !searchResults && (
                            /* Category-grouped FAQ sections */
                            <div className="space-y-10">
                                {(categories.length > 0 ? categories : ['General']).map((category) => {
                                    const Icon = getCategoryIcon(category);
                                    const faqs = categories.length > 0
                                        ? (faqData.grouped?.[category] || [])
                                        : faqData.faqs || [];

                                    if (faqs.length === 0) return null;

                                    return (
                                        <div key={category}>
                                            {/* Category header */}
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-[#3d5c3a]/10 flex items-center justify-center">
                                                    <Icon className="h-4 w-4 text-[#3d5c3a]" />
                                                </div>
                                                <h3 className="text-base font-bold text-gray-900">{category}</h3>
                                            </div>

                                            {/* FAQ items */}
                                            <div className="space-y-2.5">
                                                {faqs.map((faq: any) => {
                                                    const isExpanded = expandedId === faq.faq_id;
                                                    return (
                                                        <div
                                                            key={faq.faq_id}
                                                            className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 ${isExpanded
                                                                ? 'border-[#3d5c3a]/30 shadow-sm'
                                                                : 'border-gray-100 hover:border-[#3d5c3a]/15'
                                                                }`}
                                                        >
                                                            <button
                                                                onClick={() => setExpandedId(isExpanded ? null : faq.faq_id)}
                                                                className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
                                                            >
                                                                <span className="text-sm font-semibold text-gray-800 pr-4 group-hover:text-[#3d5c3a] transition-colors">
                                                                    {faq.question}
                                                                </span>
                                                                <ChevronDown
                                                                    className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#3d5c3a]' : ''}`}
                                                                />
                                                            </button>
                                                            <div
                                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] pb-5' : 'max-h-0'}`}
                                                            >
                                                                <div className="px-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-50 pt-4">
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
                    <div className="w-full lg:w-[340px] flex-shrink-0">
                        <div className="lg:sticky lg:top-8 space-y-6">

                            {/* Featured: Our Organic Promise */}
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#3d5c3a]/10 flex items-center justify-center">
                                                <ShieldCheck className="h-4 w-4 text-[#3d5c3a]" />
                                            </div>
                                            <span className="text-xs font-bold text-[#3d5c3a] uppercase tracking-wide">Featured</span>
                                        </div>
                                        {/* Decorative leaf */}
                                        <svg className="w-10 h-10 text-[#3d5c3a]/15" viewBox="0 0 40 40" fill="currentColor">
                                            <path d="M30 5 C35 15, 35 25, 25 35 C20 30, 18 22, 20 15 C22 8, 28 5, 30 5Z" />
                                            <path d="M30 5 C25 12, 22 20, 20 30" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Our Organic Promise</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                        We believe transparency is the root of trust. Every Vedashi product is independently verified for purity and environmental impact.
                                    </p>
                                    <ul className="space-y-2.5 mb-5">
                                        {[
                                            'Soil Association Certified',
                                            'Direct-from-farm Sourcing',
                                            'Zero Synthetic Additives',
                                        ].map((item) => (
                                            <li key={item} className="flex items-center gap-2 text-xs text-gray-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#3d5c3a] flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/about"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d5c3a] hover:text-[#2d4a2a] transition-colors group"
                                    >
                                        Read Sourcing Report
                                        <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            {/* Still need help? */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 mb-2">Still need help?</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                    Our Care Experts are rooted in knowledge and ready to assist you personally.
                                </p>
                                <Link
                                    href="/help-center/support"
                                    className="block w-full text-center bg-[#3d5c3a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d4a2a] transition-colors"
                                >
                                    Contact Us
                                </Link>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        Mon – Fri
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Mail className="h-3.5 w-3.5" />
                                        24h Reply
                                    </div>
                                </div>
                            </div>

                            {/* Quick Resources */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Quick Resources</h4>
                                <div className="space-y-1">
                                    {[
                                        { label: 'Returns Portal', href: '/help-center/support' },
                                        { label: 'Shipping Policy', href: '/help-center/knowledge-base' },
                                        { label: 'Ingredient Glossary', href: '/help-center/knowledge-base' },
                                        { label: 'Sustainability Report', href: '/about' },
                                    ].map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="flex items-center justify-between py-2.5 text-sm text-gray-700 hover:text-[#3d5c3a] transition-colors group"
                                        >
                                            {link.label}
                                            <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#3d5c3a] transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Back + CTA footer */}
                <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-8">
                    <Link
                        href="/help-center"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3d5c3a] transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Help Center
                    </Link>
                    <Link
                        href="/help-center/support"
                        className="inline-flex items-center gap-2 bg-[#3d5c3a] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#2d4a2a] transition-colors shadow-sm"
                    >
                        Submit a Support Ticket
                    </Link>
                </div>
            </div>
        </div>
    );
}

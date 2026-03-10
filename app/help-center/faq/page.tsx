'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronLeft, HelpCircle } from 'lucide-react';
import { getFaqs, searchFaqs } from '@/lib/api';
import { generateFAQPageJsonLd } from '@/lib/seo';

export default function FAQPage() {
    const [faqData, setFaqData] = useState<any>({ faqs: [], grouped: {} });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFaqs().then((data: any) => {
            setFaqData(data || { faqs: [], grouped: {} });
            setLoading(false);
        });
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        const results = await searchFaqs(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
    };

    const categories = Object.keys(faqData.grouped || {});
    const displayFaqs = searchResults
        ? searchResults
        : activeCategory === 'all'
            ? faqData.faqs || []
            : (faqData.grouped?.[activeCategory] || []);

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* Structured Data */}
            {!loading && faqData.faqs.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageJsonLd(faqData.faqs)) }}
                />
            )}
            {/* Header */}
            <section className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/help-center" className="inline-flex items-center gap-1 text-[#C6A75E] text-sm mb-4 hover:text-white transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Help Center
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-[#C6A75E] mb-6">Find answers to the most common questions</p>
                    <div className="relative max-w-lg">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value.trim()) setSearchResults(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search FAQs..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Category Tabs */}
                {!searchResults && categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeCategory === 'all'
                                ? 'bg-[#4b0f1a] text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#C6A75E]/50'
                                }`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeCategory === cat
                                    ? 'bg-[#4b0f1a] text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#C6A75E]/50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* FAQ List */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : displayFaqs.length === 0 ? (
                    <div className="text-center py-16">
                        <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-1">
                            {searchResults ? 'No results found' : 'No FAQs available'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {searchResults ? 'Try a different search term' : 'Check back soon for updates'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayFaqs.map((faq: any) => (
                            <div
                                key={faq.faq_id}
                                className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all hover:border-[#C6A75E]/20"
                            >
                                <button
                                    onClick={() => setExpandedId(expandedId === faq.faq_id ? null : faq.faq_id)}
                                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        <HelpCircle className="h-4 w-4 text-[#722F37] mt-0.5 flex-shrink-0" />
                                        <span className="text-sm font-semibold text-gray-800">{faq.question}</span>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${expandedId === faq.faq_id ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${expandedId === faq.faq_id ? 'max-h-[500px] pb-5' : 'max-h-0'
                                        }`}
                                >
                                    <div className="px-5 pl-12 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                    </div>
                                    <div className="px-5 pl-12 mt-3">
                                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#4b0f1a]/10 text-[#4b0f1a]">
                                            {faq.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact footer */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500 mb-3">Can&apos;t find what you&apos;re looking for?</p>
                    <Link
                        href="/help-center/support"
                        className="inline-flex items-center gap-2 bg-[#4b0f1a] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3a0b14] transition-colors"
                    >
                        Submit a Support Ticket
                    </Link>
                </div>
            </div>
        </div>
    );
}

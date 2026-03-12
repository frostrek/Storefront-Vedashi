'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, HelpCircle, BookOpen, FileText, ChevronRight, Send } from 'lucide-react';
import { getFaqs, getHelpArticles, searchFaqs, searchHelpArticles, searchKBArticles } from '@/lib/api';

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [popularFaqs, setPopularFaqs] = useState<any[]>([]);

    useEffect(() => {
        getFaqs().then((data: any) => {
            const faqs = data?.faqs || [];
            setPopularFaqs(faqs.slice(0, 5));
        });
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const [faqResults, helpResults, kbResults] = await Promise.all([
                searchFaqs(searchQuery),
                searchHelpArticles(searchQuery),
                searchKBArticles(searchQuery),
            ]);
            const combined = [
                ...(Array.isArray(faqResults) ? faqResults.map((f: any) => ({ ...f, _type: 'faq' })) : []),
                ...(Array.isArray(helpResults) ? helpResults.map((a: any) => ({ ...a, _type: 'help' })) : []),
                ...(Array.isArray(kbResults) ? kbResults.map((a: any) => ({ ...a, _type: 'kb' })) : []),
            ];
            setSearchResults(combined);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const sections = [
        {
            title: 'FAQs',
            desc: 'Find quick answers to common questions about orders, payments, and more.',
            icon: HelpCircle,
            href: '/help-center/faq',
            color: '#722F37',
        },
        {
            title: 'Knowledge Base',
            desc: 'Browse detailed guides, tutorials, and documentation.',
            icon: BookOpen,
            href: '/help-center/knowledge-base',
            color: '#8B4513',
        },
        {
            title: 'Support Tickets',
            desc: 'Submit a support request or track your existing tickets.',
            icon: MessageSquare,
            href: '/help-center/support',
            color: '#4b0f1a',
        },
        {
            title: 'Customer Enquiry',
            desc: 'Share your thoughts, report an issue or contact us.',
            icon: Send,
            href: '/help-center/customer-enquiry',
            color: '#5B3A29',
        },
    ];

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#4b0f1a] via-[#722F37] to-[#4b0f1a] py-20 px-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyelwySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                        How can we help you?
                    </h1>
                    <p className="text-[#C6A75E] text-lg mb-8">
                        Search our help center or browse categories below
                    </p>
                    <div className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search for help articles, FAQs, guides..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-[#C6A75E] shadow-xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4b0f1a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#3a0b14] transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </section>

            {/* Search Results */}
            {(searchResults.length > 0 || searching) && (
                <section className="max-w-4xl mx-auto px-6 py-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {searching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`}
                    </h2>
                    {!searching && (
                        <div className="space-y-3">
                            {searchResults.map((item, i) => (
                                <Link
                                    key={i}
                                    href={
                                        item._type === 'faq'
                                            ? '/help-center/faq'
                                            : item._type === 'help'
                                                ? `/help-center/${item.slug || ''}`
                                                : `/help-center/knowledge-base/${item.slug || ''}`
                                    }
                                    className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-[#C6A75E]/30 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#4b0f1a]/10 text-[#4b0f1a] whitespace-nowrap mt-0.5">
                                            {item._type === 'faq' ? 'FAQ' : item._type === 'help' ? 'Help' : 'Guide'}
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm">
                                                {item.question || item.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {item.answer || item.excerpt || item.content?.substring(0, 120) + '...'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Quick-access Cards */}
            <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Link
                                key={section.title}
                                href={section.href}
                                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#C6A75E]/30 shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: section.color + '15' }}
                                >
                                    <Icon className="h-6 w-6" style={{ color: section.color }} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">{section.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{section.desc}</p>
                                <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-[#722F37] group-hover:gap-2 transition-all">
                                    Explore <ChevronRight className="h-3 w-3" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Popular FAQs */}
            {popularFaqs.length > 0 && (
                <section className="max-w-4xl mx-auto px-6 py-16">
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Popular Questions</h2>
                    <div className="space-y-3">
                        {popularFaqs.map((faq: any) => (
                            <Link
                                key={faq.faq_id}
                                href="/help-center/faq"
                                className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 hover:border-[#C6A75E]/30 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <HelpCircle className="h-4 w-4 text-[#722F37] flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#722F37] transition-colors" />
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-6">
                        <Link
                            href="/help-center/faq"
                            className="text-sm font-semibold text-[#722F37] hover:text-[#4b0f1a] transition-colors"
                        >
                            View all FAQs →
                        </Link>
                    </div>
                </section>
            )}

            {/* Contact CTA */}
            <section className="max-w-4xl mx-auto px-6 pb-16">
                <div className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] rounded-2xl p-8 md:p-12 text-center">
                    <h2 className="text-2xl font-serif font-bold text-white mb-3">
                        Still need help?
                    </h2>
                    <p className="text-[#C6A75E] mb-6 text-sm">
                        Our support team is here to assist you. Submit a ticket and we&apos;ll get back to you soon.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/help-center/support"
                            className="inline-flex items-center justify-center gap-2 bg-white text-[#4b0f1a] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#C6A75E] hover:text-white transition-colors"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Submit a Ticket
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

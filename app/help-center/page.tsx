'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, MessageSquare, HelpCircle, BookOpen, FileText, ChevronRight, Send } from 'lucide-react';
import { getFaqs, getHelpArticles, searchFaqs, searchHelpArticles, searchKBArticles } from '@/lib/api';
import { RU_DICTIONARY } from '@/content/ru';

export default function HelpCenterPage() {
    const params = useParams();
    const country = params?.country || 'in';
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
            title: RU_DICTIONARY.helpCenter.sections.faqs.title,
            desc: RU_DICTIONARY.helpCenter.sections.faqs.desc,
            icon: HelpCircle,
            href: `/help-center/faq`,
            color: '#722F37',
        },
        {
            title: RU_DICTIONARY.helpCenter.sections.knowledgeBase.title,
            desc: RU_DICTIONARY.helpCenter.sections.knowledgeBase.desc,
            icon: BookOpen,
            href: `/help-center/knowledge-base`,
            color: '#8B4513',
        },
        {
            title: RU_DICTIONARY.helpCenter.sections.supportTickets.title,
            desc: RU_DICTIONARY.helpCenter.sections.supportTickets.desc,
            icon: MessageSquare,
            href: `/help-center/support`,
            color: '#4b0f1a',
        },
        {
            title: RU_DICTIONARY.helpCenter.sections.customerEnquiry.title,
            desc: RU_DICTIONARY.helpCenter.sections.customerEnquiry.desc,
            icon: Send,
            href: `/help-center/customer-enquiry`,
            color: '#5B3A29',
        },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Hero Section */}
            <section className="relative py-24 px-6 overflow-hidden">
                {/* Ayurvedic Texture Background */}
                <div 
                    className="absolute inset-0 z-0 opacity-40 bg-repeat bg-center"
                    style={{ 
                        backgroundImage: "url('/ayurvedic-texture.png')",
                        backgroundSize: '400px',
                        filter: 'sepia(0.2) contrast(1.1)'
                    }}
                ></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#4A5D23]/10 to-transparent z-0"></div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#4A5D23]/50 text-[#2D3A15] text-xs font-bold tracking-widest uppercase mb-6">
                        {RU_DICTIONARY.helpCenter.hero.badge}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1a2408] mb-6 leading-tight">
                        {RU_DICTIONARY.helpCenter.hero.titlePart1} <span className="text-[#4A5D23]">{RU_DICTIONARY.helpCenter.hero.titlePart2}</span>
                    </h1>
                    <p className="text-[#5B4A31] text-lg mb-8 max-w-2xl mx-auto font-bold leading-relaxed">
                        {RU_DICTIONARY.helpCenter.hero.description}
                    </p>
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#4A5D23]/20 to-[#8B4513]/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={RU_DICTIONARY.helpCenter.hero.searchPlaceholder}
                                className="w-full pl-14 pr-32 py-5 rounded-2xl bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 text-lg border border-[#4A5D23]/10 focus:outline-none focus:ring-2 focus:ring-[#4A5D23] shadow-2xl transition-all"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-[#4A5D23]" />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#4A5D23] text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-[#3a491b] transition-all shadow-lg active:scale-95"
                            >
                                {RU_DICTIONARY.helpCenter.hero.searchBtn}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search Results */}
            {(searchResults.length > 0 || searching) && (
                <section className="max-w-4xl mx-auto px-6 py-8">
                    <h2 className="text-xl font-bold text-[#1a2408] mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-[#4A5D23] rounded-full"></div>
                        {searching ? RU_DICTIONARY.helpCenter.results.finding : `${searchResults.length} ${searchResults.length !== 1 ? RU_DICTIONARY.helpCenter.results.results : RU_DICTIONARY.helpCenter.results.result} ${RU_DICTIONARY.helpCenter.results.found}`}
                    </h2>
                    {!searching && (
                        <div className="grid gap-4">
                            {searchResults.map((item, i) => (
                                <Link
                                    key={i}
                                    href={
                                        item._type === 'faq'
                                            ? `/help-center/faq`
                                            : item._type === 'help'
                                                ? `/help-center/${item.slug || ''}`
                                                : `/help-center/knowledge-base/${item.slug || ''}`
                                    }
                                    className="block bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-[#4A5D23]/5 hover:border-[#4A5D23]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="bg-[#4A5D23]/10 p-2 rounded-lg group-hover:bg-[#4A5D23] transition-colors">
                                            <FileText className="h-5 w-5 text-[#4A5D23] group-hover:text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-[#1a2408] group-hover:text-[#4A5D23] transition-colors">
                                                    {item.question || item.title}
                                                </h3>
                                                <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md bg-[#4A5D23]/10 text-[#4A5D23]">
                                                    {item._type === 'faq' ? RU_DICTIONARY.helpCenter.results.faq : item._type === 'help' ? RU_DICTIONARY.helpCenter.results.help : RU_DICTIONARY.helpCenter.results.guide}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#5B4A31] line-clamp-2">
                                                {item.answer || item.excerpt || item.content?.substring(0, 150) + '...'}
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
            <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-10 mb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const herbalColors = [
                            { bg: '#E8EDDF', text: '#4A5D23' },
                            { bg: '#F2E8CF', text: '#8B4513' },
                            { bg: '#E9F5F2', text: '#2E5A50' },
                            { bg: '#F9F1E7', text: '#A67C52' }
                        ];
                        const colorIdx = sections.indexOf(section) % herbalColors.length;
                        const theme = herbalColors[colorIdx];

                        return (
                            <Link
                                key={section.title}
                                href={section.href}
                                className="group relative bg-white rounded-3xl p-8 border border-[#4A5D23]/5 hover:border-[#4A5D23]/20 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#4A5D23]/5 to-transparent rounded-bl-[100px] -mr-4 -mt-4 group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                                
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-inner"
                                    style={{ backgroundColor: theme.bg }}
                                >
                                    <Icon className="h-8 w-8" style={{ color: theme.text }} />
                                </div>
                                <h3 className="text-xl font-bold text-[#1a2408] mb-3">{section.title}</h3>
                                <p className="text-sm text-[#5B4A31] leading-relaxed mb-6">{section.desc}</p>
                                <div 
                                    className="inline-flex items-center gap-2 text-sm font-bold tracking-wide transition-all duration-300 group-hover:gap-3"
                                    style={{ color: theme.text }}
                                >
                                    {RU_DICTIONARY.helpCenter.exploreMore} <ChevronRight className="h-4 w-4" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Popular FAQs */}
            {popularFaqs.length > 0 && (
                <section className="max-w-5xl mx-auto px-6 py-20 bg-[#FDFBF7] rounded-[50px] mb-20 border border-[#4A5D23]/5">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a2408] mb-4">{RU_DICTIONARY.helpCenter.commonQuestions}</h2>
                        <div className="w-24 h-1 bg-[#4A5D23] mx-auto rounded-full opacity-30"></div>
                    </div>
                    <div className="grid md:grid-cols-1 gap-4 max-w-3xl mx-auto">
                        {popularFaqs.map((faq: any) => (
                            <Link
                                key={faq.faq_id}
                                href={`/help-center/faq`}
                                className="flex items-center justify-between bg-white rounded-2xl p-6 border border-[#4A5D23]/5 hover:border-[#4A5D23]/20 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#4A5D23]/5 flex items-center justify-center group-hover:bg-[#4A5D23] transition-colors">
                                        <HelpCircle className="h-5 w-5 text-[#4A5D23] group-hover:text-white" />
                                    </div>
                                    <span className="text-base font-semibold text-[#1a2408]">{faq.question}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-[#4A5D23]/10 transition-colors">
                                    <ChevronRight className="h-5 w-5 text-[#4A5D23]" />
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link
                            href={`/help-center/faq`}
                            className="inline-flex items-center gap-2 py-3 px-8 rounded-full border-2 border-[#4A5D23] text-[#4A5D23] font-bold hover:bg-[#4A5D23] hover:text-white transition-all"
                        >
                            {RU_DICTIONARY.helpCenter.viewAllFaqs}
                        </Link>
                    </div>
                </section>
            )}

            {/* Contact CTA */}
            <section className="max-w-5xl mx-auto px-6 pb-24">
                <div className="relative overflow-hidden bg-[#1a2408] rounded-[40px] p-10 md:p-16 text-center">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[url('/ayurvedic-texture.png')] bg-repeat opacity-20"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-[#F2E8CF] mb-4">
                            {RU_DICTIONARY.helpCenter.cta.title}
                        </h2>
                        <p className="text-[#A6BF8F] mb-10 text-lg max-w-xl mx-auto font-medium">
                            {RU_DICTIONARY.helpCenter.cta.desc}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <Link
                                href={`/help-center/support`}
                                className="inline-flex items-center justify-center gap-3 bg-[#4A5D23] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#3a491b] hover:shadow-2xl hover:-translate-y-1 transition-all"
                            >
                                <MessageSquare className="h-6 w-6" />
                                {RU_DICTIONARY.helpCenter.cta.submitTicket}
                            </Link>
                            <Link
                                href={`/contact`}
                                className="inline-flex items-center justify-center gap-3 border-2 border-[#F2E8CF]/30 text-[#F2E8CF] px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#F2E8CF]/10 transition-all"
                            >
                                {RU_DICTIONARY.helpCenter.cta.contactUs}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

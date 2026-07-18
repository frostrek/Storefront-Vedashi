'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Search, ChevronLeft, ChevronDown, BookOpen,
    ShoppingCart, HeadphonesIcon, Truck, Sparkles,
    ArrowRight, Clock, Leaf, HelpCircle, FileText
} from 'lucide-react';
import { getKBCategories, getKBArticles, searchKBArticles } from '@/lib/api';
import { RU_DICTIONARY } from '@/content/ru';
import { ROUTES } from '@/lib/routes';

/* ── Category icon mapping ─────────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Shopping': ShoppingCart,
    'Customer Care': HeadphonesIcon,
    'Logistics': Truck,
    'Products': Leaf,
    'General': FileText,
};

function getCategoryIcon(category: string) {
    if (!category) return FileText;
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (category.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return FileText;
}

/* ── Estimate read time from content ───────────────────────── */
function estimateReadTime(content?: string, excerpt?: string): number {
    const text = content || excerpt || '';
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

export default function KnowledgeBasePage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getKBCategories(), getKBArticles()]).then(([cats, arts]) => {
            setCategories(Array.isArray(cats) ? cats : []);
            setArticles(Array.isArray(arts) ? arts : []);
            setLoading(false);
        });
    }, []);

    const handleCategoryClick = async (slug: string) => {
        setSelectedCategory(slug);
        setSearchResults(null);
        setExpandedId(null);
        setLoading(true);
        const arts = await getKBArticles(slug);
        setArticles(Array.isArray(arts) ? arts : []);
        setLoading(false);
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        const results = await searchKBArticles(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
    }, [searchQuery]);

    const displayArticles = searchResults || articles;

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden py-24 px-6">
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
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#4A5D23]/20 via-transparent to-[#4A5D23]/5 z-0"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#4A5D23]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#8B4513]/5 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Resource Hub badge */}
                    <div className="inline-flex items-center gap-3 bg-white/40 backdrop-blur-md border border-[#4A5D23]/10 rounded-full px-6 py-2 mb-10 shadow-sm">
                        <Sparkles className="h-4 w-4 text-[#4A5D23]" />
                        <span className="text-xs font-black tracking-[0.2em] uppercase text-[#1a2408]">{RU_DICTIONARY.helpCenter.knowledgeBase.hero.badge}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-[#1a2408] mb-8 leading-tight">
                        {RU_DICTIONARY.helpCenter.knowledgeBase.hero.titlePart1} <span className="text-[#4A5D23]">{RU_DICTIONARY.helpCenter.knowledgeBase.hero.titlePart2}</span>
                    </h1>

                    <p className="text-[#5B4A31] text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                        {RU_DICTIONARY.helpCenter.knowledgeBase.hero.desc}
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#4A5D23]/20 to-[#8B4513]/20 rounded-[30px] blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (!e.target.value.trim()) setSearchResults(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={RU_DICTIONARY.helpCenter.knowledgeBase.hero.searchPlaceholder}
                                className="w-full pl-16 pr-20 py-6 rounded-[24px] bg-white/90 backdrop-blur-xl text-[#1a2408] placeholder-[#5B4A31]/40 text-lg focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 shadow-2xl transition-all border border-[#4A5D23]/5"
                            />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#4A5D23]" />
                            <button
                                onClick={handleSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#4A5D23] text-white rounded-2xl flex items-center justify-center hover:bg-[#3a491b] hover:scale-105 transition-all cursor-pointer shadow-lg"
                            >
                                <ArrowRight className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <div className="max-w-7xl mx-auto px-6 py-20">

                {/* Search results header */}
                {searchResults && (
                    <div className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-3xl font-bold text-[#1a2408]">
                            {searchResults.length > 0
                                ? `${searchResults.length} ${RU_DICTIONARY.helpCenter.knowledgeBase.results.wisdomFound} "${searchQuery}"`
                                : RU_DICTIONARY.helpCenter.knowledgeBase.results.noResultsHub}
                        </h2>
                        <button
                            onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                            className="text-sm font-black uppercase tracking-widest text-[#4A5D23] hover:text-[#3a491b] flex items-center gap-2 cursor-pointer bg-white px-6 py-3 rounded-full border border-[#4A5D23]/5 shadow-sm"
                        >
                            <ChevronLeft className="h-4 w-4" /> {RU_DICTIONARY.helpCenter.knowledgeBase.results.clearSearch}
                        </button>
                    </div>
                )}

                {/* Category filter pills */}
                {!searchResults && categories.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
                        <button
                            onClick={() => {
                                setSelectedCategory('');
                                setExpandedId(null);
                                setLoading(true);
                                getKBArticles().then(a => { setArticles(Array.isArray(a) ? a : []); setLoading(false); });
                            }}
                            className={`px-8 py-3 rounded-[20px] text-sm font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm ${!selectedCategory
                                ? 'bg-[#4A5D23] text-white shadow-[#4A5D23]/30 shadow-lg'
                                : 'bg-white text-[#5B4A31] border border-[#4A5D23]/5 hover:border-[#4A5D23]/30'
                                }`}
                        >
                            {RU_DICTIONARY.helpCenter.knowledgeBase.categories.allArticles}
                        </button>
                        {categories.map((cat: any) => (
                            <button
                                key={cat.category_id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`px-8 py-3 rounded-[20px] text-sm font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm ${selectedCategory === cat.slug
                                    ? 'bg-[#4A5D23] text-white shadow-[#4A5D23]/30 shadow-lg'
                                    : 'bg-white text-[#5B4A31] border border-[#4A5D23]/5 hover:border-[#4A5D23]/30'
                                    }`}
                            >
                                {(RU_DICTIONARY.helpCenter.knowledgeBase.categories as Record<string, string>)[cat.name] || cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Article cards grid */}
                {loading ? (
                    /* Loading skeleton */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[40px] p-10 animate-pulse border border-[#4A5D23]/5 h-[400px]">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="h-6 bg-gray-100 rounded-full w-24" />
                                    <div className="h-4 bg-gray-50 rounded w-16" />
                                </div>
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-8" />
                                <div className="h-8 bg-gray-100 rounded w-3/4 mb-4" />
                                <div className="h-4 bg-gray-50 rounded w-full mb-2" />
                                <div className="h-4 bg-gray-50 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : displayArticles.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-32 bg-white rounded-[60px] border border-[#4A5D23]/5 shadow-xl">
                        <div className="w-24 h-24 rounded-[30px] bg-[#4A5D23]/10 flex items-center justify-center mx-auto mb-10">
                            <BookOpen className="h-10 w-10 text-[#4A5D23]" />
                        </div>
                        <h3 className="text-3xl font-bold text-[#1a2408] mb-4">{RU_DICTIONARY.helpCenter.knowledgeBase.emptyState.title}</h3>
                        <p className="text-lg text-[#5B4A31] max-w-sm mx-auto font-medium">
                            {searchResults ? RU_DICTIONARY.helpCenter.knowledgeBase.emptyState.searchDesc : RU_DICTIONARY.helpCenter.knowledgeBase.emptyState.defaultDesc}
                        </p>
                    </div>
                ) : (
                    /* Article cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {displayArticles.map((article: any) => {
                            const Icon = getCategoryIcon(article.category_name);
                            const readTime = estimateReadTime(article.content, article.excerpt);
                            const isExpanded = expandedId === article.article_id;

                            return (
                                <div
                                    key={article.article_id}
                                    className="bg-white rounded-[40px] border border-[#4A5D23]/5 overflow-hidden hover:shadow-[0_32px_64px_-16px_rgba(74,93,35,0.12)] hover:-translate-y-2 transition-all duration-500 group flex flex-col"
                                >
                                    <div className="p-10 flex-1 flex flex-col">
                                        {/* Top meta row */}
                                        <div className="flex items-center justify-between mb-8">
                                            {article.category_name && (
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A5D23] bg-[#4A5D23]/5 px-4 py-1.5 rounded-full">
                                                    {(RU_DICTIONARY.helpCenter.knowledgeBase.categories as Record<string, string>)[article.category_name] || article.category_name}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5B4A31]/50">
                                                <Clock className="h-3.5 w-3.5" />
                                                {readTime} {RU_DICTIONARY.helpCenter.knowledgeBase.article.minRead}
                                            </div>
                                        </div>

                                        {/* Icon */}
                                        <div className="w-16 h-16 rounded-2xl bg-[#4A5D23]/5 flex items-center justify-center mb-8 group-hover:bg-[#4A5D23] transition-all duration-500 shadow-inner">
                                            <Icon className="h-7 w-7 text-[#4A5D23] group-hover:text-white transition-colors duration-500" />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl md:text-2xl font-bold text-[#1a2408] mb-4 leading-snug group-hover:text-[#4A5D23] transition-colors">
                                            {article.title}
                                        </h3>

                                        {/* Excerpt */}
                                        {article.excerpt && (
                                            <p className="text-base text-[#5B4A31] leading-relaxed mb-6 flex-1 line-clamp-3 font-medium">
                                                {article.excerpt}
                                            </p>
                                        )}

                                        {/* Expanded content preview */}
                                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] mb-6' : 'max-h-0'}`}>
                                            <div className="text-sm text-[#5B4A31] leading-relaxed border-t border-[#4A5D23]/10 pt-6 whitespace-pre-line font-medium">
                                                {article.content?.substring(0, 400)}
                                                {article.content && article.content.length > 400 && '...'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer action */}
                                    <div className="px-10 pb-10">
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : article.article_id)}
                                                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#5B4A31] hover:text-[#4A5D23] transition-colors cursor-pointer group/btn"
                                            >
                                                {isExpanded ? RU_DICTIONARY.helpCenter.knowledgeBase.article.collapse : RU_DICTIONARY.helpCenter.knowledgeBase.article.sneakPeek}
                                                <ChevronDown className={`h-4 w-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            <Link
                                                href={ROUTES.helpCenterKnowledgeBaseArticle(article.slug)}
                                                className="inline-flex items-center gap-3 bg-[#4A5D23]/5 text-[#4A5D23] px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#4A5D23] hover:text-white transition-all ml-auto hover:shadow-lg"
                                            >
                                                {RU_DICTIONARY.helpCenter.knowledgeBase.article.openArticle}
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Back + Help footer */}
                <div className="mt-32 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-[#4A5D23]/10 pt-16">
                    <Link
                        href={ROUTES.helpCenter}
                        className="inline-flex items-center gap-4 text-lg font-bold text-[#5B4A31] hover:text-[#4A5D23] transition-all group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center group-hover:bg-[#4A5D23] group-hover:text-white transition-all">
                            <ChevronLeft className="h-7 w-7" />
                        </div>
                        {RU_DICTIONARY.helpCenter.knowledgeBase.footer.home}
                    </Link>
                    <Link
                        href={ROUTES.helpCenterSupport}
                        className="inline-flex items-center gap-4 bg-[#4A5D23] text-white px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-[#3a491b] transition-all shadow-2xl hover:-translate-y-1"
                    >
                        <HeadphonesIcon className="h-6 w-6" />
                        {RU_DICTIONARY.helpCenter.knowledgeBase.footer.requestSupport}
                    </Link>
                </div>
            </div>
        </div>

    );
}

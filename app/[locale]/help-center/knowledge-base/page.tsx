'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Search, ChevronLeft, ChevronDown, BookOpen,
    ShoppingCart, HeadphonesIcon, Truck, Sparkles,
    ArrowRight, Clock, Leaf, HelpCircle, FileText
} from 'lucide-react';
import { getKBCategories, getKBArticles, searchKBArticles } from '@/lib/api';

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
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#3d5c3a] via-[#4a6b47] to-[#5a7a57] py-16 md:py-24 px-6">
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

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    {/* Resource Hub badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                        <Sparkles className="h-3.5 w-3.5 text-[#c8d8a0]" />
                        <span className="text-xs font-semibold tracking-widest uppercase text-white/90">Vedashi Resource Hub</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                        How can we help you <em className="not-italic text-[#c8d8a0]">grow</em> today?
                    </h1>

                    <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto mb-8">
                        Search our extensive library of guides, tutorials, and policy documentation to find the answers you need.
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value.trim()) setSearchResults(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search for 'refunds', 'tracking', or 'ingredients'..."
                            className="w-full pl-12 pr-16 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8d8a0] shadow-xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#3d5c3a] text-white rounded-lg flex items-center justify-center hover:bg-[#2d4a2a] transition-colors cursor-pointer"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">

                {/* Search results header */}
                {searchResults && (
                    <div className="flex items-center justify-between mb-6">
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
                )}

                {/* Category filter pills */}
                {!searchResults && categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                        <button
                            onClick={() => {
                                setSelectedCategory('');
                                setExpandedId(null);
                                setLoading(true);
                                getKBArticles().then(a => { setArticles(Array.isArray(a) ? a : []); setLoading(false); });
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${!selectedCategory
                                ? 'bg-[#3d5c3a] text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#3d5c3a]/30'
                                }`}
                        >
                            All
                        </button>
                        {categories.map((cat: any) => (
                            <button
                                key={cat.category_id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedCategory === cat.slug
                                    ? 'bg-[#3d5c3a] text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#3d5c3a]/30'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Article cards grid */}
                {loading ? (
                    /* Loading skeleton */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="h-5 bg-gray-200 rounded-full w-20" />
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                                <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : displayArticles.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-[#3d5c3a]/10 flex items-center justify-center mx-auto mb-5">
                            <BookOpen className="h-7 w-7 text-[#3d5c3a]/40" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No articles found</h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                            {searchResults ? 'Try different search terms or browse by category.' : 'Articles will be published soon'}
                        </p>
                    </div>
                ) : (
                    /* Article cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayArticles.map((article: any) => {
                            const Icon = getCategoryIcon(article.category_name);
                            const readTime = estimateReadTime(article.content, article.excerpt);
                            const isExpanded = expandedId === article.article_id;

                            return (
                                <div
                                    key={article.article_id}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#3d5c3a]/15 transition-all duration-300 flex flex-col"
                                >
                                    <div className="p-6 flex-1 flex flex-col">
                                        {/* Top meta row */}
                                        <div className="flex items-center justify-between mb-5">
                                            {article.category_name && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                                                    {article.category_name}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                                <Clock className="h-3 w-3" />
                                                {readTime} min read
                                            </div>
                                        </div>

                                        {/* Icon */}
                                        <div className="w-12 h-12 rounded-xl bg-[#3d5c3a]/8 border border-[#3d5c3a]/10 flex items-center justify-center mb-4">
                                            <Icon className="h-5 w-5 text-[#3d5c3a]" />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                                            {article.title}
                                        </h3>

                                        {/* Excerpt */}
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-3">
                                                {article.excerpt}
                                            </p>
                                        )}

                                        {/* Expanded content preview */}
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] mb-4' : 'max-h-0'}`}>
                                            <div className="text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3 whitespace-pre-line">
                                                {article.content?.substring(0, 400)}
                                                {article.content && article.content.length > 400 && '...'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer action */}
                                    <div className="px-6 pb-5">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : article.article_id)}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#3d5c3a] transition-colors cursor-pointer group"
                                            >
                                                {isExpanded ? 'Hide Preview' : 'Read Full Guide'}
                                                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            <Link
                                                href={`/help-center/knowledge-base/${article.slug}`}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-[#3d5c3a] hover:text-[#2d4a2a] transition-colors ml-auto group"
                                            >
                                                Open Article
                                                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Back + Help footer */}
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

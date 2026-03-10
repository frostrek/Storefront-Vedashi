'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, ChevronLeft, ChevronRight, Folder } from 'lucide-react';
import { getKBCategories, getKBArticles, searchKBArticles } from '@/lib/api';

export default function KnowledgeBasePage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);

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
        setLoading(true);
        const arts = await getKBArticles(slug);
        setArticles(Array.isArray(arts) ? arts : []);
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        const results = await searchKBArticles(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
    };

    const displayArticles = searchResults || articles;

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            <section className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <Link href="/help-center" className="inline-flex items-center gap-1 text-[#C6A75E] text-sm mb-4 hover:text-white transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Help Center
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Knowledge Base</h1>
                    <p className="text-[#C6A75E] mb-6">Detailed guides, tutorials, and documentation</p>
                    <div className="relative max-w-lg">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setSearchResults(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search articles..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* Categories */}
                {categories.length > 0 && !searchResults && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                        <button
                            onClick={() => { setSelectedCategory(''); getKBArticles().then(a => setArticles(Array.isArray(a) ? a : [])); }}
                            className={`p-4 rounded-xl border text-left transition-all ${!selectedCategory ? 'bg-[#4b0f1a] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-[#C6A75E]/50'}`}
                        >
                            <Folder className="h-5 w-5 mb-2" />
                            <span className="text-sm font-semibold block">All Articles</span>
                        </button>
                        {categories.map((cat: any) => (
                            <button
                                key={cat.category_id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedCategory === cat.slug ? 'bg-[#4b0f1a] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-[#C6A75E]/50'}`}
                            >
                                <Folder className="h-5 w-5 mb-2" />
                                <span className="text-sm font-semibold block">{cat.name}</span>
                                {cat.description && <span className="text-xs opacity-70 block mt-1">{cat.description}</span>}
                            </button>
                        ))}
                    </div>
                )}

                {/* Articles */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : displayArticles.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-1">No articles found</h3>
                        <p className="text-sm text-gray-400">
                            {searchResults ? 'Try different search terms' : 'Articles will be published soon'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {displayArticles.map((article: any) => (
                            <Link
                                key={article.article_id}
                                href={`/help-center/knowledge-base/${article.slug}`}
                                className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-[#C6A75E]/30 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-[#722F37] transition-colors">
                                            {article.title}
                                        </h3>
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                            {article.category_name && (
                                                <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">{article.category_name}</span>
                                            )}
                                            <span>{article.view_count || 0} views</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#722F37] mt-1 flex-shrink-0 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

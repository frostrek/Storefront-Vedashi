'use client';

import { RU_DICTIONARY } from '@/content/ru';

interface BlogCategoryFiltersProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export default function BlogCategoryFilters({
    categories,
    activeCategory,
    onCategoryChange,
    searchTerm,
    onSearchChange
}: BlogCategoryFiltersProps) {
    const getCategoryTranslation = (cat: string) => {
        const map = RU_DICTIONARY.blog.categoriesMap as Record<string, string>;
        return map[cat] || cat;
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 bg-white/40 p-4 rounded-3xl backdrop-blur-sm border border-light-border/40">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => onCategoryChange('All')}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === 'All'
                        ? 'bg-[#91C934] text-white shadow-md'
                        : 'bg-white border border-[#91C934]/50 text-warm-gray hover:border-[#91C934]/50 hover:text-[#91C934]'
                        }`}
                >
                    {RU_DICTIONARY.blog.filters.all}
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat
                            ? 'bg-[#91C934] text-white shadow-md'
                            : 'bg-white border border-[#91C934]/50 text-warm-gray hover:border-[#91C934]/50 hover:text-[#91C934]'
                            }`}
                    >
                        {getCategoryTranslation(cat)}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-[#8B9F8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={RU_DICTIONARY.blog.filters.searchPlaceholder}
                    className="block w-full pl-10 pr-4 py-2.5 bg-[#A3B5A3]/20 border-transparent rounded-full text-sm placeholder-[#8B9F8B] text-charcoal focus:bg-white focus:border-[#8B9F8B] focus:ring-1 focus:ring-[#8B9F8B] transition-colors"
                />
            </div>
        </div>
    );
}

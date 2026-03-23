'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { advancedSearch, type SearchParams } from '@/lib/api';
import { FilteredProduct, FilterMeta } from '@/types';
import ProductCard from '@/components/ProductCard';

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'name_asc', label: 'Name A–Z' },
    { value: 'name_desc', label: 'Name Z–A' },
];

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const q = searchParams.get('q') || '';
    const currentPage = Number(searchParams.get('page')) || 1;
    const currentSort = searchParams.get('sort') || 'relevance';

    const [products, setProducts] = useState<FilteredProduct[]>([]);
    const [meta, setMeta] = useState<FilterMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(q);

    const fetchResults = useCallback(async () => {
        if (!q.trim()) {
            setProducts([]);
            setMeta(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const params: SearchParams = {
                q,
                page: currentPage,
                limit: 20,
                sort: currentSort,
            };

            // Pass through any filter params from URL
            const category = searchParams.get('category');
            const brand = searchParams.get('brand');
            const minPrice = searchParams.get('min_price');
            const maxPrice = searchParams.get('max_price');
            if (category) params.category = category;
            if (brand) params.brand = brand;
            if (minPrice) params.min_price = Number(minPrice);
            if (maxPrice) params.max_price = Number(maxPrice);

            const result = await advancedSearch(params);
            setProducts(result.data);
            setMeta(result.meta);
        } catch {
            setProducts([]);
            setMeta(null);
        } finally {
            setIsLoading(false);
        }
    }, [q, currentPage, currentSort, searchParams]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    // ── Navigation helpers ─────────────────────────────────────
    const updateSearch = (newQ: string) => {
        if (!newQ.trim()) return;
        router.push(`/search?q=${encodeURIComponent(newQ.trim())}`);
    };

    const updateSort = (sort: string) => {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set('sort', sort);
        sp.set('page', '1');
        router.push(`/search?${sp.toString()}`);
    };

    const goToPage = (page: number) => {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set('page', String(page));
        router.push(`/search?${sp.toString()}`);
    };

    // ── Render ─────────────────────────────────────────────────
    return (
        <main className="min-h-screen bg-gray-50">
            {/* ═══ Search Header ═══ */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto max-w-[1400px] px-6 py-8">
                    {/* Search Bar */}
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            updateSearch(searchInput);
                        }}
                        className="relative max-w-2xl mx-auto mb-6"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search products, brands, categories…"
                            className="
                w-full pl-8 pr-8 py-1.5 rounded-full
                bg-gray-50 border border-gray-200
                text-base text-gray-800 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-[#4b0f1a]/30 focus:border-[#4b0f1a]/40
                transition-all duration-200
              "
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput('');
                                }}
                                className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="
                absolute right-2 top-1/2 -translate-y-1/2
                px-5 py-2 rounded-full
                bg-[#4b0f1a] text-white text-sm font-medium
                hover:bg-[#3a0c14] transition-colors
              "
                        >
                            Search
                        </button>
                    </form>

                    {/* Results summary + sort */}
                    {q && !isLoading && meta && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-[1400px]">
                            <p className="text-gray-600 text-sm">
                                {meta.total_count > 0 ? (
                                    <>
                                        Showing{' '}
                                        <span className="font-semibold text-gray-900">
                                            {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, meta.total_count)}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-semibold text-gray-900">{meta.total_count}</span>{' '}
                                        results for &ldquo;<span className="font-semibold text-[#4b0f1a]">{q}</span>&rdquo;
                                    </>
                                ) : (
                                    <>
                                        No results found for &ldquo;<span className="font-semibold text-[#4b0f1a]">{q}</span>&rdquo;
                                    </>
                                )}
                            </p>

                            {meta.total_count > 0 && (
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                                    <select
                                        value={currentSort}
                                        onChange={e => updateSort(e.target.value)}
                                        className="
                      text-sm border border-gray-200 rounded-lg
                      px-3 py-1.5 text-gray-700
                      focus:outline-none focus:ring-2 focus:ring-[#4b0f1a]/20
                      bg-white cursor-pointer
                    "
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Results Grid ═══ */}
            <div className="mx-auto max-w-[1400px] px-6 py-8">
                {isLoading ? (
                    /* Loading skeletons */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 rounded-xl aspect-square mb-3" />
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map(product => (
                                <ProductCard key={product.product_id} product={product} />
                            ))}
                        </div>

                        {/* ─── Pagination ─── */}
                        {meta && meta.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={!meta.has_prev_page}
                                    className="
                    px-4 py-2 text-sm font-medium rounded-lg
                    border border-gray-200 text-gray-700
                    hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors
                  "
                                >
                                    Previous
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: Math.min(meta.total_pages, 7) }, (_, i) => {
                                    let page: number;
                                    if (meta.total_pages <= 7) {
                                        page = i + 1;
                                    } else if (currentPage <= 4) {
                                        page = i + 1;
                                    } else if (currentPage >= meta.total_pages - 3) {
                                        page = meta.total_pages - 6 + i;
                                    } else {
                                        page = currentPage - 3 + i;
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`
                        w-10 h-10 text-sm font-medium rounded-lg transition-colors
                        ${page === currentPage
                                                    ? 'bg-[#4b0f1a] text-white'
                                                    : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                                                }
                      `}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={!meta.has_next_page}
                                    className="
                    px-4 py-2 text-sm font-medium rounded-lg
                    border border-gray-200 text-gray-700
                    hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors
                  "
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : q ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            No results found
                        </h2>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            We couldn&apos;t find any products matching &ldquo;{q}&rdquo;. Try adjusting your search
                            or browse our categories.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/products')}
                                className="
                  px-6 py-2.5 rounded-full text-sm font-semibold
                  bg-[#4b0f1a] text-white hover:bg-[#3a0c14]
                  transition-colors
                "
                            >
                                Browse All Products
                            </button>
                        </div>
                    </div>
                ) : (
                    /* No query state */
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-[#fdf6ee] flex items-center justify-center mb-6">
                            <Search className="h-8 w-8 text-[#C6A75E]" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Search Our Collection
                        </h2>
                        <p className="text-gray-500 text-center max-w-md">
                            Enter a search term above to find products by name, brand, category, or description.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading search…</div>
            </main>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

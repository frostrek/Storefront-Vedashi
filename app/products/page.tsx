'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getCategories, formatVND, getFilterOptions, getBestSellers, getNewArrivals, getFilteredProducts, searchProducts } from '@/lib/api';
import { FilteredProduct, FilterMeta } from '@/types';
import ProductCard from '@/components/ProductCard';
import { SkeletonProductGrid } from '@/components/Skeleton';
import {
    SlidersHorizontal, Search, X, Leaf, Loader2,
    Sparkles, ChevronDown
} from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { FILTER_CONFIGS, SORT_OPTIONS } from '@/lib/filterConfig';

// Filter components
import FilterSection from '@/components/filters/FilterSection';
import CheckboxGroup from '@/components/filters/CheckboxGroup';
import RangeSlider from '@/components/filters/RangeSlider';
import ToggleSwitch from '@/components/filters/ToggleSwitch';
import SortDropdown from '@/components/filters/SortDropdown';
import ActiveFilterChips from '@/components/filters/ActiveFilterChips';
import CountryDropdown from '@/components/filters/CountryDropdown';
import { COUNTRIES } from '@/lib/countries';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const ITEMS_PER_PAGE = 24;

function ProductsContent() {
    const {
        filters,
        activeChips,
        setSearch,
        setCategory,
        setSubCategory,
        setBrands,
        setCountry,
        setRatings,
        setPriceRange,

        setInStock,
        setBestSellers,
        setNewArrivals,
        setSort,
        setDiscountMin,
        setAttribute,
        removeFilter,
        clearAll,
    } = useFilters();

    const searchParams = useSearchParams();

    // Infinite scroll state
    const [products, setProducts] = useState<FilteredProduct[]>([]);
    const [meta, setMeta] = useState<FilterMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Sentinel ref for infinite scroll
    const [sentinelRef, isSentinelVisible] = useIntersectionObserver({
        rootMargin: '400px',
        threshold: 0,
    });

    // Dynamic filter options (loaded from API)
    const [brandOptions, setBrandOptions] = useState<string[]>([]);
    const [countryOptions, setCountryOptions] = useState<string[]>([]);
    const [priceMax, setPriceMax] = useState<number>(5000);
    const [categories, setCategories] = useState<any[]>([]);
    const [filterAttributes, setFilterAttributes] = useState<any[]>([]);

    const displayCountryOptions = Array.from(
        new Set([...COUNTRIES.map(c => c.name), ...countryOptions])
    ).sort();

    const filtersKey = JSON.stringify(filters);

    useEffect(() => {
        getFilterOptions().then(opts => {
            setBrandOptions(opts.brands);
            setCountryOptions(opts.countries);
            if (opts.maxPrice) setPriceMax(opts.maxPrice);
            if (opts.categories) setCategories(opts.categories);
            if (opts.attributes) setFilterAttributes(opts.attributes);
        });
    }, []);

    const buildParams = useCallback((page: number) => {
        const params: Record<string, unknown> = {
            page,
            limit: ITEMS_PER_PAGE,
        };

        if (filters.sort) params.sort = filters.sort;
        if (filters.category) params.category = filters.category;
        if (filters.sub_category) params.sub_category = filters.sub_category;
        if (filters.brands.length > 0) params.brand = filters.brands.join(','); // Backend now supports multiple if updated, or we send joined
        if (filters.priceRange[0] !== 0) params.min_price = filters.priceRange[0];
        if (filters.priceRange[1] !== Infinity) params.max_price = filters.priceRange[1];
        if (filters.country) params.country = filters.country;
        if (filters.ratings.length > 0) {
            const ratingValues = filters.ratings.map(r => parseInt(r)).filter(n => !isNaN(n));
            if (ratingValues.length > 0) params.min_rating = Math.min(...ratingValues);
        }
        if (filters.inStock) params.availability = 'in_stock';
        if (filters.discountMin) params.discount_min = filters.discountMin;
        if (Object.keys(filters.attributes).length > 0) params.attributes = filters.attributes;
        return params;
    }, [filters]);

    // Initial fetch when filters change
    useEffect(() => {
        let cancelled = false;

        const fetchInitial = async () => {
            setLoading(true);
            setCurrentPage(1);
            setProducts([]);
            setHasMore(true);

            if (filters.search) {
                const data = await searchProducts(filters.search);
                if (!cancelled) {
                    setProducts(data as FilteredProduct[]);
                    setMeta(null);
                    setHasMore(false);
                    setLoading(false);
                }
                return;
            }

            if (filters.bestSellers) {
                const bsParams: Record<string, any> = { limit: ITEMS_PER_PAGE, page: 1 };
                if (filters.category) bsParams.category = filters.category;
                if (filters.country) bsParams.country = filters.country;
                if (filters.priceRange[0] !== 0) bsParams.minPrice = filters.priceRange[0];
                if (filters.priceRange[1] !== Infinity) bsParams.maxPrice = filters.priceRange[1];
                const result = await getBestSellers(bsParams);
                if (!cancelled) {
                    setProducts(result.data);
                    setMeta(result.meta);
                    setHasMore(result.meta?.has_next_page ?? false);
                    setLoading(false);
                }
                return;
            }

            if (filters.newArrivals) {
                const naParams: Record<string, any> = { limit: ITEMS_PER_PAGE };
                if (filters.category) naParams.category = filters.category;
                if (filters.country) naParams.region = filters.country;
                if (filters.brands.length === 1) naParams.brand = filters.brands[0];
                if (filters.priceRange[0] !== 0) naParams.min_price = filters.priceRange[0];
                if (filters.priceRange[1] !== Infinity) naParams.max_price = filters.priceRange[1];
                if (filters.inStock) naParams.in_stock = true;
                const result = await getNewArrivals(naParams);
                if (!cancelled) {
                    setProducts(result.data);
                    setMeta(result.meta);
                    setHasMore(result.meta?.has_next_page ?? false);
                    setLoading(false);
                }
                return;
            }

            const params = buildParams(1);
            const result = await getFilteredProducts(params as any);
            if (!cancelled) {
                setProducts(result.data);
                setMeta(result.meta);
                setHasMore(result.meta?.has_next_page ?? false);
                setLoading(false);
            }
        };

        fetchInitial();
        return () => { cancelled = true; };
    }, [filtersKey, buildParams]);

    // Load more when sentinel is visible
    useEffect(() => {
        if (!isSentinelVisible || loading || loadingMore || !hasMore) return;
        if (filters.search) return;

        let cancelled = false;
        const nextPage = currentPage + 1;

        const fetchMore = async () => {
            setLoadingMore(true);

            if (filters.bestSellers) {
                const bsParams: Record<string, any> = { limit: ITEMS_PER_PAGE, page: nextPage };
                if (filters.category) bsParams.category = filters.category;
                if (filters.country) bsParams.country = filters.country;
                if (filters.priceRange[0] !== 0) bsParams.minPrice = filters.priceRange[0];
                if (filters.priceRange[1] !== Infinity) bsParams.maxPrice = filters.priceRange[1];
                const result = await getBestSellers(bsParams);
                if (!cancelled) {
                    setProducts(prev => [...prev, ...result.data]);
                    setMeta(result.meta);
                    setHasMore(result.meta?.has_next_page ?? false);
                    setCurrentPage(nextPage);
                    setLoadingMore(false);
                }
                return;
            }

            if (filters.newArrivals) {
                const naParams: Record<string, any> = { limit: ITEMS_PER_PAGE };
                if (filters.category) naParams.category = filters.category;
                if (filters.country) naParams.region = filters.country;
                if (filters.brands.length === 1) naParams.brand = filters.brands[0];
                if (filters.priceRange[0] !== 0) naParams.min_price = filters.priceRange[0];
                if (filters.priceRange[1] !== Infinity) naParams.max_price = filters.priceRange[1];
                if (filters.inStock) naParams.in_stock = true;
                const result = await getNewArrivals(naParams);
                if (!cancelled) {
                    setProducts(prev => [...prev, ...result.data]);
                    setMeta(result.meta);
                    setHasMore(result.meta?.has_next_page ?? false);
                    setCurrentPage(nextPage);
                    setLoadingMore(false);
                }
                return;
            }

            const params = buildParams(nextPage);
            const result = await getFilteredProducts(params as any);
            if (!cancelled) {
                setProducts(prev => [...prev, ...result.data]);
                setMeta(result.meta);
                setHasMore(result.meta?.has_next_page ?? false);
                setCurrentPage(nextPage);
                setLoadingMore(false);
            }
        };

        fetchMore();
        return () => { cancelled = true; };
    }, [isSentinelVisible, loading, loadingMore, hasMore, currentPage, filters, buildParams]);

    const totalCount = meta?.total_count ?? products.length;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    /* ─── Search bar state ─── */
    const [searchInput, setSearchInput] = useState(filters.search);
    useEffect(() => { setSearchInput(filters.search); }, [filters.search]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    /* ─── Sidebar content (shared between desktop & mobile) ─── */
    const sidebarContent = (
        <div className="space-y-0">
            {categories.length > 0 && (
                <FilterSection title="Category" defaultOpen={true}>
                    <div className="space-y-4">
                        <select
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3d5c3a] focus:outline-none focus:ring-1 focus:ring-[#3d5c3a] text-gray-700"
                            value={filters.category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setSubCategory(''); // Reset subcategory when category changes
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat: any) => (
                                <option key={cat.category_id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>

                        {/* Subcategory */}
                        {filters.category && categories.find((c: any) => c.slug === filters.category)?.children?.length > 0 && (
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3d5c3a] focus:outline-none focus:ring-1 focus:ring-[#3d5c3a] text-gray-700"
                                value={filters.sub_category}
                                onChange={(e) => setSubCategory(e.target.value)}
                            >
                                <option value="">All Subcategories</option>
                                {categories.find((c: any) => c.slug === filters.category).children.map((sub: any) => (
                                    <option key={sub.category_id} value={sub.slug}>{sub.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </FilterSection>
            )}

            {brandOptions.length > 0 && (
                <FilterSection title="Brand">
                    <CheckboxGroup
                        options={brandOptions}
                        selected={filters.brands}
                        onChange={setBrands}
                    />
                </FilterSection>
            )}

            <FilterSection title="Price Range">
                <div className="mb-5 flex flex-wrap gap-2 text-xs">
                    {[
                        { label: 'Under ₹1,000', range: [0, 1000] as [number, number] },
                        { label: '₹1,000 – ₹2,500', range: [1000, 2500] as [number, number] },
                        { label: '₹2,500 – ₹5,000', range: [2500, 5000] as [number, number] },
                        { label: '₹5,000+', range: [5000, Infinity] as [number, number] },
                    ].map(p => (
                        <button
                            key={p.label}
                            onClick={() => setPriceRange(p.range, priceMax)}
                            className={`rounded-full border px-3 py-1.5 transition-colors cursor-pointer ${(filters.priceRange[0] === p.range[0] && filters.priceRange[1] === p.range[1])
                                ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-sm'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-[#3d5c3a]/50 hover:text-gray-800'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <RangeSlider
                    min={0}
                    max={priceMax}
                    step={priceMax <= 5000 ? 100 : (priceMax <= 20000 ? 500 : 1000)}
                    value={[filters.priceRange[0] ?? 0, filters.priceRange[1] === Infinity ? priceMax : filters.priceRange[1]]}
                    onChange={(val) => setPriceRange(val, priceMax)}
                    formatLabel={v => formatVND(v)}
                />
            </FilterSection>

            <CountryDropdown
                options={displayCountryOptions}
                selected={filters.country}
                onChange={setCountry}
            />

            <FilterSection title="Rating" defaultOpen={false}>
                <CheckboxGroup
                    options={FILTER_CONFIGS.find(f => f.key === 'rating')?.staticOptions ?? []}
                    selected={filters.ratings}
                    onChange={setRatings}
                />
            </FilterSection>

            <FilterSection title="Discount" defaultOpen={false}>
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                    {[10, 20, 30, 40, 50].map(pct => (
                        <label key={pct} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="discount"
                                className="h-4 w-4 rounded border-gray-300 text-[#3d5c3a] focus:ring-[#3d5c3a]"
                                checked={filters.discountMin === pct}
                                onChange={() => {
                                    if (filters.discountMin === pct) {
                                        removeFilter('discount_min', '');
                                    } else {
                                        setDiscountMin(pct);
                                    }
                                }}
                            />
                            <span className="group-hover:text-gray-900 transition-colors">{pct}% and above</span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {filterAttributes.map((attr: any) => (
                <FilterSection key={attr.attribute_id} title={attr.attribute_name} defaultOpen={false}>
                    <CheckboxGroup
                        options={attr.values.map((v: any) => v.value_name)}
                        selected={filters.attributes[attr.attribute_slug] ? filters.attributes[attr.attribute_slug].map(slug => attr.values.find((v:any) => v.value_slug === slug)?.value_name || slug) : []}
                        onChange={(selectedNames) => {
                            const selectedSlugs = selectedNames.map(name => attr.values.find((v:any) => v.value_name === name)?.value_slug || name);
                            // @ts-ignore - useFilters hook exports setAttribute
                            setAttribute(attr.attribute_slug, selectedSlugs);
                        }}
                    />
                </FilterSection>
            ))}

            <FilterSection title="Availability">
                <div className="space-y-3">
                    <ToggleSwitch
                        label="In Stock Only"
                        checked={filters.inStock}
                        onChange={setInStock}
                    />
                    <ToggleSwitch
                        label="Best Sellers"
                        checked={filters.bestSellers}
                        onChange={setBestSellers}
                    />
                    <ToggleSwitch
                        label="New Arrivals"
                        checked={filters.newArrivals}
                        onChange={setNewArrivals}
                    />
                </div>
            </FilterSection>

            {activeChips.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={clearAll}
                        className="w-full rounded-xl border border-[#3d5c3a]/20 py-2.5 text-sm font-semibold text-[#3d5c3a] hover:bg-[#3d5c3a]/5 transition-colors cursor-pointer"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* ═══════ HERO SECTION ═══════ */}
            <section 
                className="relative overflow-hidden py-12 md:py-16 px-6 bg-cover bg-center"
                style={{ backgroundImage: "url('/ayurvedic-texture.png')" }}
            >
                <div className="absolute inset-0 bg-black/20" /> {/* Subtle overlay for text readability if needed */}

                <div className="max-w-xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
                        <Leaf className="h-3.5 w-3.5 text-[#c8d8a0]" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">Refine Collection</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3 italic">
                        Ancient Remedies
                    </h1>
                    <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
                        Explore our curated collection of authentic Ayurvedic wellness products
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search products, brands, or categories..."
                            className="w-full px-5 py-3 pl-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => { setSearchInput(''); setSearch(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 cursor-pointer"
                            >
                                <X className="h-4 w-4 text-white/60" />
                            </button>
                        )}
                    </form>
                </div>
            </section>

            {/* ═══════ MAIN CONTENT ═══════ */}
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8">
                {/* Mobile Filter Button */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-shadow lg:hidden cursor-pointer"
                >
                    <SlidersHorizontal className="h-4 w-4 text-[#3d5c3a]" />
                    Filters
                    {activeChips.length > 0 && (
                        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3d5c3a] text-[10px] font-bold text-white">
                            {activeChips.length}
                        </span>
                    )}
                </button>

                <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
                    {/* ─── Desktop Sidebar ─── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                            <h2 className="font-serif text-base font-bold text-gray-900 mb-1">Filters</h2>
                            <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                                <span className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    {totalCount} product{totalCount !== 1 ? 's' : ''} found
                                </span>
                                {loading && <Loader2 className="h-3 w-3 animate-spin text-[#3d5c3a]" />}
                            </p>
                            {sidebarContent}
                        </div>
                    </aside>

                    {/* ─── Mobile Drawer ─── */}
                    {mobileOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setMobileOpen(false)}
                            />
                            <div className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
                                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                                    <h2 className="font-serif text-lg font-bold text-gray-900">Filters</h2>
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-full p-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <X className="h-5 w-5 text-gray-400" />
                                    </button>
                                </div>
                                <div className="px-5 py-4">
                                    {sidebarContent}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Product Grid ─── */}
                    <div className="min-w-0">
                        {/* Sort bar + count */}
                        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <span className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    Showing <span className="font-semibold text-gray-900">{products.length}</span> of{' '}
                                    <span className="font-semibold text-gray-900">{totalCount}</span> products
                                </span>
                                {(loading || loadingMore) && <Loader2 className="h-4 w-4 animate-spin text-[#3d5c3a]" />}
                            </p>
                            <SortDropdown
                                value={filters.sort || SORT_OPTIONS[0].value}
                                onChange={setSort}
                                options={SORT_OPTIONS}
                            />
                        </div>

                        <ActiveFilterChips
                            chips={activeChips}
                            onRemove={removeFilter}
                            onClearAll={clearAll}
                        />

                        {loading ? (
                            <SkeletonProductGrid count={8} />
                        ) : products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                                    {products.map((product, i) => (
                                        <div
                                            key={`${product.product_id}-${i}`}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${Math.min(i, 7) * 50}ms`, animationFillMode: 'both' }}
                                        >
                                            <ProductCard
                                                product={product}
                                                priority={i < 4}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Infinite scroll sentinel */}
                                {hasMore && (
                                    <div ref={sentinelRef} className="mt-8">
                                        {loadingMore && (
                                            <SkeletonProductGrid count={4} />
                                        )}
                                    </div>
                                )}

                                {/* End of results */}
                                {!hasMore && products.length > ITEMS_PER_PAGE && (
                                    <div className="mt-12 text-center">
                                        <div className="w-12 h-px bg-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">You&apos;ve seen all {totalCount} products</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
                                <Search className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                                <p className="font-serif text-xl text-gray-700">No products found</p>
                                <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or search</p>
                                {activeChips.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="mt-5 rounded-xl bg-[#3d5c3a] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a2a] transition-colors cursor-pointer"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ BRAND SECTION ═══════ */}
            <section className="bg-gradient-to-br from-[#3d5c3a] via-[#4a6b47] to-[#5a7a57] py-16 px-6 mt-8">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
                            <Sparkles className="h-3.5 w-3.5 text-[#c8d8a0]" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">Vedashi Clinical Standard</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white mb-4 leading-tight">
                            Where Tradition Meets<br /><em>Clinical Rigor.</em>
                        </h2>
                        <p className="text-white/70 text-sm leading-relaxed mb-6">
                            Every formulation at Vedashi undergoes a double-blind purification process.
                            We combine the botanical manuscripts of Charaka Samhita with ISO-certified lab testing
                            to ensure your path to wellness is both sacred and safe.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: '100%', label: 'Organic Sourcing' },
                                { value: 'GMP', label: 'Certified Facility' },
                                { value: '500+', label: 'Herb Varieties' },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <p className="text-2xl font-bold text-white">{s.value}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:grid grid-cols-2 gap-3">
                        <div className="rounded-2xl overflow-hidden bg-white/10 aspect-[4/5]" />
                        <div className="rounded-2xl overflow-hidden bg-white/10 aspect-square mt-8" />
                    </div>
                </div>
            </section>

            {/* ═══════ NEWSLETTER ═══════ */}
            <section className="py-16 px-6 bg-[#FAF7F2]">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                        Join the Vedashi Circle
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Receive weekly Ayurvedic rituals, seasonal detox guides, and exclusive early access to limited harvest remedies.
                    </p>
                    <form className="flex gap-2 max-w-sm mx-auto" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed!'); }}>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/20 focus:border-[#3d5c3a]"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-[#3d5c3a] text-white text-sm font-bold hover:bg-[#2d4a2a] transition-colors cursor-pointer"
                        >
                            Subscribe
                        </button>
                    </form>
                    <p className="text-[10px] text-gray-400 mt-3">VEDASHI © 2026. PRIVACY POLICY. TERMS & CONDITIONS.</p>
                </div>
            </section>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] p-8"><SkeletonProductGrid count={8} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}

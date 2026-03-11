'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getCategories, formatVND, getFilterOptions, getBestSellers, getNewArrivals, getFilteredProducts, searchProducts } from '@/lib/api';
import { FilteredProduct, FilterMeta } from '@/types';
import ProductCard from '@/components/ProductCard';
import { SkeletonProductGrid } from '@/components/Skeleton';
import { SlidersHorizontal, Search, X, Leaf, Loader2 } from 'lucide-react';
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

const ITEMS_PER_PAGE = 24;

function ProductsContent() {
    const {
        filters,
        activeChips,
        setSearch,
        setBrands,
        setCountry,
        setRatings,
        setPriceRange,

        setInStock,
        setBestSellers,
        setNewArrivals,
        setSort,
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

    // Full 197-country list — merged with any countries already in the DB
    const displayCountryOptions = Array.from(
        new Set([...COUNTRIES.map(c => c.name), ...countryOptions])
    ).sort();

    // Track filter changes to reset
    const filtersKey = JSON.stringify(filters);

    // Load dynamic filter options once
    useEffect(() => {
        getFilterOptions().then(opts => {
            setBrandOptions(opts.brands);
            setCountryOptions(opts.countries);
            if (opts.maxPrice) setPriceMax(opts.maxPrice);
        });
    }, []);

    // Build query params (reusable)
    const buildParams = useCallback((page: number) => {

        const params: Record<string, unknown> = {
            page,
            limit: ITEMS_PER_PAGE,
        };

        if (filters.sort) params.sort = filters.sort;
        if (filters.category) params.category = filters.category;
        if (filters.sub_category) params.sub_category = filters.sub_category;
        if (filters.brands.length === 1) params.brand = filters.brands[0];

        if (filters.priceRange[0] !== 0) params.min_price = filters.priceRange[0];
        if (filters.priceRange[1] !== Infinity) params.max_price = filters.priceRange[1];



        if (filters.country) params.country = filters.country;

        if (filters.ratings.length > 0) {
            const ratingValues = filters.ratings.map(r => parseInt(r)).filter(n => !isNaN(n));
            if (ratingValues.length > 0) params.min_rating = Math.min(...ratingValues);
        }

        if (filters.inStock) params.availability = 'in_stock';

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
                const bsParams: Record<string, any> = {
                    limit: ITEMS_PER_PAGE,
                    page: 1,
                };
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
                const naParams: Record<string, any> = {
                    limit: ITEMS_PER_PAGE,
                };
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
        if (filters.search) return; // search doesn't paginate

        let cancelled = false;
        const nextPage = currentPage + 1;

        const fetchMore = async () => {
            setLoadingMore(true);

            if (filters.bestSellers) {
                const bsParams: Record<string, any> = {
                    limit: ITEMS_PER_PAGE,
                    page: nextPage,
                };
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
                const naParams: Record<string, any> = {
                    limit: ITEMS_PER_PAGE,
                };
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

    // Close mobile drawer on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    /* ─── Sidebar content (shared between desktop & mobile) ─── */
    const sidebarContent = (
        <div className="space-y-0">
            {/* Brands — dynamic from API */}
            {brandOptions.length > 0 && (
                <FilterSection title="Brand">
                    <CheckboxGroup
                        options={brandOptions}
                        selected={filters.brands}
                        onChange={setBrands}
                    />
                </FilterSection>
            )}

            {/* Price Range */}
            <FilterSection title="Price Range">
                <div className="mb-5 flex flex-wrap gap-2 text-xs">
                    <button
                        onClick={() => setPriceRange([0, 1000], priceMax)}
                        className={`rounded-full border px-3 py-1.5 transition-colors ${(filters.priceRange[0] === 0 && filters.priceRange[1] === 1000) ? 'bg-burgundy text-white border-burgundy shadow-sm' : 'border-light-border bg-white text-warm-gray hover:border-burgundy/50 hover:text-charcoal hover:bg-burgundy/5'}`}
                    >
                        Under ₹1,000
                    </button>
                    <button
                        onClick={() => setPriceRange([1000, 2500], priceMax)}
                        className={`rounded-full border px-3 py-1.5 transition-colors ${(filters.priceRange[0] === 1000 && filters.priceRange[1] === 2500) ? 'bg-burgundy text-white border-burgundy shadow-sm' : 'border-light-border bg-white text-warm-gray hover:border-burgundy/50 hover:text-charcoal hover:bg-burgundy/5'}`}
                    >
                        ₹1,000 – ₹2,500
                    </button>
                    <button
                        onClick={() => setPriceRange([2500, 5000], priceMax)}
                        className={`rounded-full border px-3 py-1.5 transition-colors ${(filters.priceRange[0] === 2500 && filters.priceRange[1] === 5000) ? 'bg-burgundy text-white border-burgundy shadow-sm' : 'border-light-border bg-white text-warm-gray hover:border-burgundy/50 hover:text-charcoal hover:bg-burgundy/5'}`}
                    >
                        ₹2,500 – ₹5,000
                    </button>
                    <button
                        onClick={() => setPriceRange([5000, Infinity], priceMax)}
                        className={`rounded-full border px-3 py-1.5 transition-colors ${(filters.priceRange[0] === 5000 && filters.priceRange[1] === Infinity) ? 'bg-burgundy text-white border-burgundy shadow-sm' : 'border-light-border bg-white text-warm-gray hover:border-burgundy/50 hover:text-charcoal hover:bg-burgundy/5'}`}
                    >
                        ₹5,000+
                    </button>
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



            {/* Country — single-select dropdown (always shown) */}
            <CountryDropdown
                options={displayCountryOptions}
                selected={filters.country}
                onChange={setCountry}
            />

            {/* Rating */}
            <FilterSection title="Rating" defaultOpen={false}>
                <CheckboxGroup
                    options={FILTER_CONFIGS.find(f => f.key === 'rating')?.staticOptions ?? []}
                    selected={filters.ratings}
                    onChange={setRatings}
                />
            </FilterSection>

            {/* Toggles */}
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

            {/* Clear All */}
            {activeChips.length > 0 && (
                <div className="pt-4 border-t border-light-border/60">
                    <button
                        onClick={clearAll}
                        className="w-full rounded-lg border border-burgundy/20 py-2.5 text-sm font-semibold text-burgundy hover:bg-burgundy/5 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="border-b border-light-border bg-white">
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-5 sm:py-8">
                    <div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wine-gold tracking-tight">
                            Shop Formulations
                        </h1>
                        <p className="mt-0.5 text-sm text-warm-gray">
                            Explore our curated collection of Ayurvedic formulations
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8">
                {/* Mobile Filter Button */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="mb-5 flex items-center gap-2 rounded-lg border border-light-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal shadow-sm hover:shadow-md transition-shadow lg:hidden"
                >
                    <SlidersHorizontal className="h-4 w-4 text-burgundy" />
                    Filters
                    {activeChips.length > 0 && (
                        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-burgundy text-[10px] font-bold text-white">
                            {activeChips.length}
                        </span>
                    )}
                </button>

                <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
                    {/* ─── Desktop Sidebar ─── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-6 rounded-xl border border-light-border bg-white px-5 py-4 shadow-sm">
                            <h2 className="font-serif text-base font-semibold text-charcoal mb-1">Filters</h2>
                            <p className="text-xs text-warm-gray mb-4 flex items-center gap-2">
                                <span className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    {totalCount} formulation{totalCount !== 1 ? 's' : ''} found
                                </span>
                                {loading && <Loader2 className="h-3 w-3 animate-spin text-burgundy" />}
                            </p>
                            {sidebarContent}
                        </div>
                    </aside>

                    {/* ─── Mobile Drawer ─── */}
                    {mobileOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/40 animate-overlay-fade-in"
                                onClick={() => setMobileOpen(false)}
                            />
                            {/* Drawer */}
                            <div className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
                                <div className="flex items-center justify-between border-b border-light-border px-5 py-4">
                                    <h2 className="font-serif text-lg font-semibold text-charcoal">Filters</h2>
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-full p-1.5 hover:bg-cream transition-colors"
                                    >
                                        <X className="h-5 w-5 text-warm-gray" />
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
                        {/* Sort bar + Active chips */}
                        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-warm-gray flex items-center gap-2">
                                <span className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    Showing <span className="font-semibold text-charcoal">{products.length}</span> of{' '}
                                    <span className="font-semibold text-charcoal">{totalCount}</span> formulations
                                </span>
                                {(loading || loadingMore) && <Loader2 className="h-4 w-4 animate-spin text-burgundy" />}
                            </p>
                            <SortDropdown
                                value={filters.sort}
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
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
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

                                {/* End of results indicator */}
                                {!hasMore && products.length > ITEMS_PER_PAGE && (
                                    <div className="mt-12 text-center">
                                        <p className="text-sm text-warm-gray">You&apos;ve seen all {totalCount} formulations</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-xl border border-light-border bg-white py-20 text-center shadow-sm">
                                <Leaf className="h-12 w-12 mx-auto text-warm-gray/30 mb-4" />
                                <p className="font-serif text-xl text-charcoal">No formulations found</p>
                                <p className="mt-2 text-sm text-warm-gray">Try adjusting your filters or search</p>
                                {activeChips.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="mt-4 rounded-lg bg-burgundy px-5 py-2 text-sm font-medium text-white hover:bg-burgundy-dark transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cream p-8"><SkeletonProductGrid count={8} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}

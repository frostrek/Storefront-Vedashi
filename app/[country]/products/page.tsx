'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCategories, getFilterOptions, getBestSellers, getNewArrivals, getFilteredProducts } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { FilteredProduct, FilterMeta } from '@/types';
import ProductCard from '@/components/ProductCard';
import { SkeletonProductGrid } from '@/components/Skeleton';
import SearchBar from '@/components/SearchBar';
import {
    SlidersHorizontal, X, Leaf, Loader2,
    Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
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
    const { formatPrice } = useCurrency();
    const {
        filters,
        activeChips,
        setSearch,
        setCategory,
        setSubCategory,
        setBrands,
        setCountry,
        setForm,
        setSpecialities,
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
    const gridRef = useRef<HTMLDivElement>(null);

    // Pagination state
    const [products, setProducts] = useState<FilteredProduct[]>([]);
    const [meta, setMeta] = useState<FilterMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [mobileOpen, setMobileOpen] = useState(false);

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

        if (filters.search) params.search = filters.search;
        if (filters.sort) params.sort = filters.sort;
        if (filters.category) params.category = filters.category;
        if (filters.sub_category) params.sub_category = filters.sub_category;
        if (filters.brands.length > 0) params.brand = filters.brands.join(',');
        if (filters.priceRange[0] !== 0) params.min_price = filters.priceRange[0];
        if (filters.priceRange[1] !== Infinity) params.max_price = filters.priceRange[1];
        if (filters.country) params.country = filters.country;
        if (filters.form.length > 0) params.form = filters.form.join(',');
        if (filters.specialities.length > 0) params.specialities = filters.specialities.join(',');
        if (filters.ratings.length > 0) {
            const ratingValues = filters.ratings.map(r => parseInt(r)).filter(n => !isNaN(n));
            if (ratingValues.length > 0) params.min_rating = Math.min(...ratingValues);
        }
        if (filters.inStock) params.availability = 'in_stock';
        if (filters.discountMin) params.discount_min = filters.discountMin;
        if (Object.keys(filters.attributes).length > 0) params.attributes = filters.attributes;
        return params;
    }, [filters]);

    // Fetch page (used for both initial load and page changes)
    const fetchPage = useCallback(async (page: number, cancelled: { value: boolean }) => {
        setLoading(true);
        setProducts([]);

        if (filters.bestSellers) {
            const bsParams: Record<string, any> = { limit: ITEMS_PER_PAGE, page };
            if (filters.category) bsParams.category = filters.category;
            if (filters.country) bsParams.country = filters.country;
            if (filters.priceRange[0] !== 0) bsParams.minPrice = filters.priceRange[0];
            if (filters.priceRange[1] !== Infinity) bsParams.maxPrice = filters.priceRange[1];
            const result = await getBestSellers(bsParams);
            if (!cancelled.value) {
                setProducts(result.data);
                setMeta(result.meta);
                setLoading(false);
            }
            return;
        }

        if (filters.newArrivals) {
            const naParams: Record<string, any> = { limit: ITEMS_PER_PAGE, page };
            if (filters.category) naParams.category = filters.category;
            if (filters.country) naParams.region = filters.country;
            if (filters.brands.length === 1) naParams.brand = filters.brands[0];
            if (filters.priceRange[0] !== 0) naParams.min_price = filters.priceRange[0];
            if (filters.priceRange[1] !== Infinity) naParams.max_price = filters.priceRange[1];
            if (filters.inStock) naParams.in_stock = true;
            const result = await getNewArrivals(naParams);
            if (!cancelled.value) {
                setProducts(result.data);
                setMeta(result.meta);
                setLoading(false);
            }
            return;
        }

        // All other cases (including search) go through filter endpoint
        const params = buildParams(page);
        const result = await getFilteredProducts(params as any);
        if (!cancelled.value) {
            setProducts(result.data);
            setMeta(result.meta);
            setLoading(false);
        }
    }, [filters, buildParams]);

    // Reset to page 1 whenever filters change
    useEffect(() => {
        const cancelled = { value: false };
        setCurrentPage(1);
        fetchPage(1, cancelled);
        return () => { cancelled.value = true; };
    }, [filtersKey]);

    // Handle manual page change
    const handlePageChange = (page: number) => {
        const cancelled = { value: false };
        setCurrentPage(page);
        fetchPage(page, cancelled);
        // Scroll product grid into view
        setTimeout(() => {
            gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const totalCount = meta?.total_count ?? products.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

    // Pagination page numbers with ellipsis
    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

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
    // (managed inside SearchBar component; we just call setSearch)

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
                    formatLabel={v => formatPrice(v)}
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

            <FilterSection title="Form" defaultOpen={false}>
                <CheckboxGroup
                    options={['Capsules', 'Tablets', 'Powder', 'Syrup', 'Oil', 'Churna']}
                    selected={filters.form}
                    onChange={setForm}
                />
            </FilterSection>

            <FilterSection title="Specialities" defaultOpen={false}>
                <CheckboxGroup
                    options={['Drug Free', 'Allergen Free', '100% Natural', 'Vegan', 'Ayurvedic', 'No Added Sugar']}
                    selected={filters.specialities}
                    onChange={setSpecialities}
                />
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
        <div className="min-h-screen bg-[#FDFCFB]" style={{ backgroundImage: "url('/botanical-page-bg.png')", backgroundAttachment: 'fixed', backgroundSize: '600px' }}>
            {/* ═══════ HERO SECTION ═══════ */}
            <section 
                className="relative overflow-hidden py-12 md:py-16 px-6 bg-cover bg-center border-b border-[#3d5c3a]/10"
                style={{ backgroundImage: "url('/ayurvedic-texture.png')" }}
            >
                <div className="absolute inset-0 bg-[#3d5c3a]/40 mix-blend-multiply" /> {/* Herbal depth overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e1a]/60 to-transparent" />

                <div className="max-w-xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-4 shadow-xl">
                        <Leaf className="h-3.5 w-3.5 text-[#c8d8a0]" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">Refine Collection</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3 italic tracking-tight drop-shadow-lg">
                        Ancient Remedies
                    </h1>
                    <p className="text-sm md:text-base text-white/80 mb-8 max-w-md mx-auto font-medium leading-relaxed">
                        Explore our curated collection of authentic Ayurvedic wellness products, 
                        harvested from the heart of the Himalayas.
                    </p>

                    {/* Advanced Search Bar */}
                    <SearchBar
                        value={filters.search}
                        onSearch={setSearch}
                        variant="hero"
                        className="max-w-md mx-auto"
                        placeholder="Search products, brands, or categories..."
                    />
                </div>
            </section>

            {/* ═══════ MAIN CONTENT ═══════ */}
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12 relative z-10">
                {/* Mobile Filter Button */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="mb-8 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all lg:hidden cursor-pointer"
                >
                    <SlidersHorizontal className="h-4 w-4 text-[#3d5c3a]" />
                    Filters
                    {activeChips.length > 0 && (
                        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3d5c3a] text-[10px] font-bold text-white">
                            {activeChips.length}
                        </span>
                    )}
                </button>

                <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-12 items-start">
                    {/* ─── Desktop Sidebar ─── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28 h-[calc(100vh-120px)] overflow-y-auto rounded-3xl border border-[#3d5c3a]/5 bg-white/90 backdrop-blur-md px-6 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] custom-scrollbar">
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
                                    {totalCount === 0 ? 'No products' : (
                                        <>Showing <span className="font-semibold text-gray-900">{startItem}–{endItem}</span> of{' '}
                                        <span className="font-semibold text-gray-900">{totalCount}</span> products</>
                                    )}
                                </span>
                                {loading && <Loader2 className="h-4 w-4 animate-spin text-[#3d5c3a]" />}
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
                                <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
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

                                {/* ── Pagination Controls ── */}
                                {totalPages > 1 && (
                                    <div className="mt-10 flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            {/* Prev */}
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#3d5c3a] hover:text-[#3d5c3a] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            {/* Page numbers */}
                                            {getPageNumbers().map((page, idx) =>
                                                page === '...' ? (
                                                    <span key={`ellipsis-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page as number)}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-all cursor-pointer shadow-sm ${
                                                            currentPage === page
                                                                ? 'bg-[#3d5c3a] border-[#3d5c3a] text-white shadow-md'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-[#3d5c3a] hover:text-[#3d5c3a]'
                                                        }`}
                                                        aria-label={`Page ${page}`}
                                                        aria-current={currentPage === page ? 'page' : undefined}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            )}

                                            {/* Next */}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#3d5c3a] hover:text-[#3d5c3a] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                                aria-label="Next page"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Page info */}
                                        <p className="text-xs text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
                                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-3xl">🌿</span>
                                </div>
                                <p className="font-serif text-xl text-gray-700">No products found</p>
                                <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or search
                                    {filters.search && <> for &ldquo;<strong>{filters.search}</strong>&rdquo;</>}
                                </p>
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

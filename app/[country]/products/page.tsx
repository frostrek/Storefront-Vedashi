'use client';

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCategories, getFilterOptions, getBestSellers, getNewArrivals, getFilteredProducts, subscribeNewsletter } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { FilteredProduct, FilterMeta, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { SkeletonProductGrid } from '@/components/Skeleton';
import SearchBar from '@/components/SearchBar';
import {
    SlidersHorizontal, X, Leaf, Loader2,
    Sparkles, ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { FILTER_CONFIGS, SORT_OPTIONS } from '@/lib/filterConfig';
import { trackEcommerce, EcommerceItem } from '@/lib/analytics/gtag';

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

interface FilterAttribute {
    attribute_id: string;
    attribute_name: string;
    attribute_slug: string;
    values: { value_name: string; value_slug: string }[];
}

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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isMounted, setIsMounted] = useState(false);

    // Newsletter State
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Ensure page starts at top when hero is removed
        window.scrollTo(0, 0);
        
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('vedashi_view_mode') as 'grid' | 'list';
            if (saved === 'grid' || saved === 'list') {
                setViewMode(saved);
            }
        }
    }, []);

    // Dynamic filter options (loaded from API)
    const [brandOptions, setBrandOptions] = useState<string[]>([]);
    const [countryOptions, setCountryOptions] = useState<string[]>([]);
    const [priceMax, setPriceMax] = useState<number>(5000);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterAttributes, setFilterAttributes] = useState<FilterAttribute[]>([]);

    // Resolve slug values → real display names for category/sub_category chips
    const resolvedChips = useMemo(() =>
        activeChips.map(chip => {
            if (chip.key === 'category') {
                const cat = categories.find(c => c.slug === chip.value);
                return cat ? { ...chip, value: cat.name } : chip;
            }
            if (chip.key === 'sub_category') {
                const subCat = categories
                    .flatMap(c => (c as any).children || [])
                    .find((s: any) => s.slug === chip.value);
                return subCat ? { ...chip, value: subCat.name } : chip;
            }
            return chip;
        }),
        [activeChips, categories]
    );

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
        const params: Record<string, string | number | boolean | string[]> = {
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
        if (filters.inStock) params.inStock = true;
        if (filters.bestSellers) params.bestSeller = true;
        if (filters.newArrivals) params.newArrival = true;
        if (filters.discountMin) params.discount_min = filters.discountMin;
        if (Object.keys(filters.attributes).length > 0) params.attributes = JSON.stringify(filters.attributes);
        return params;
    }, [filters]);

    // Fetch page (used for both initial load and page changes)
    const fetchPage = useCallback(async (page: number, cancelled: { value: boolean }) => {
        setLoading(true);
        setProducts([]);

        // All cases go through filter endpoint to support combining any filter with Best Sellers/New Arrivals
        const params = buildParams(page);
        const result = await getFilteredProducts(params);

        if (!cancelled.value) {
            setProducts(result.data);
            setMeta(result.meta);
            setLoading(false);
        }
    }, [buildParams]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail || !newsletterEmail.includes('@')) {
            toast.error('Please enter a valid email.');
            return;
        }
        setIsSubscribing(true);
        try {
            const res = await subscribeNewsletter(newsletterEmail);
            if (res.success) {
                toast.success(res.message || 'Successfully subscribed!');
                setNewsletterEmail('');
            } else {
                toast.error(res.message || 'Failed to subscribe.');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSubscribing(false);
        }
    };

    // Reset to page 1 whenever filters change
    useEffect(() => {
        const cancelled = { value: false };
        setCurrentPage(1);
        fetchPage(1, cancelled);
        return () => { cancelled.value = true; };
    }, [filtersKey]);

    // GA4: view_item_list
    // Fire whenever products change, deduplicated by hash
    const viewListHashRef = useRef<string>('');
    useEffect(() => {
        if (products.length > 0) {
            const currentHash = products.map(p => p.product_id).join(',');
            if (viewListHashRef.current === currentHash) return;
            viewListHashRef.current = currentHash;

            const gaItems: EcommerceItem[] = products.slice(0, 24).map((item, index) => ({
                item_id: item.product_id,
                item_name: item.product_name,
                price: Number(item.price ?? 0),
                quantity: 1,
                index: index + 1,
                item_list_name: 'Shop All Products Grid',
                item_category: item.category,
                item_brand: item.brand
            }));
            
            trackEcommerce('view_item_list', {
                currency: 'INR',
                value: gaItems.reduce((acc, curr) => acc + curr.price, 0),
                items: gaItems
            });
        }
    }, [products]);

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
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat: Category) => (
                                <option key={cat.category_id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>

                        {/* Subcategory */}
                        {filters.category && (categories.find((c: any) => c.slug === filters.category)?.children?.length ?? 0) > 0 && (
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3d5c3a] focus:outline-none focus:ring-1 focus:ring-[#3d5c3a] text-gray-700"
                                value={filters.sub_category}
                                onChange={(e) => setSubCategory(e.target.value)}
                            >
                                <option value="">All Subcategories</option>
                                {categories.find((c: Category) => c.slug === filters.category)?.children?.map((sub: Category) => (
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

            {filterAttributes.map((attr: FilterAttribute) => (
                <FilterSection key={attr.attribute_id} title={attr.attribute_name} defaultOpen={false}>
                    <CheckboxGroup
                        options={attr.values.map((v) => v.value_name)}
                        selected={filters.attributes[attr.attribute_slug] ? filters.attributes[attr.attribute_slug].map(slug => attr.values.find((v) => v.value_slug === slug)?.value_name || slug) : []}
                        onChange={(selectedNames) => {
                            const selectedSlugs = selectedNames.map(name => attr.values.find((v) => v.value_name === name)?.value_slug || name);
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
        <div className="min-h-screen bg-white">


            {/* ═══════ MAIN CONTENT ═══════ */}
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12 pt-16 sm:pt-20 relative z-10">
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

                <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-12">
                    {/* ─── Desktop Sidebar ─── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28 h-[calc(100vh-120px)] rounded-2xl border border-[#3d5c3a]/5 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="h-full overflow-y-auto overscroll-contain px-6 py-6 custom-scrollbar">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Filters</h2>
                                {sidebarContent}
                            </div>
                        </div>
                    </aside>

                    {/* ─── Mobile Drawer ─── */}
                    {mobileOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setMobileOpen(false)}
                            />
                            <div className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
                                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-full p-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <X className="h-5 w-5 text-gray-400" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 custom-scrollbar">
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
                            <div className="flex items-center gap-3">
                                <div className="flex items-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => { setViewMode('grid'); localStorage.setItem('vedashi_view_mode', 'grid'); }}
                                        className={`p-2 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#3d5c3a] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                        aria-label="Grid view"
                                        title="Grid view"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => { setViewMode('list'); localStorage.setItem('vedashi_view_mode', 'list'); }}
                                        className={`p-2 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#3d5c3a] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                        aria-label="List view"
                                        title="List view"
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                                <SortDropdown
                                    value={filters.sort || SORT_OPTIONS[0].value}
                                    onChange={setSort}
                                    options={SORT_OPTIONS}
                                />
                            </div>
                        </div>

                        <ActiveFilterChips
                            chips={resolvedChips}
                            onRemove={removeFilter}
                            onClearAll={clearAll}
                        />

                        {loading ? (
                            <SkeletonProductGrid count={8} />
                        ) : products.length > 0 ? (
                            <>
                                <div ref={gridRef} className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3' : 'flex flex-col gap-4'}>
                                    {products.map((product, i) => (
                                        <div
                                            key={`${product.product_id}-${i}`}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${Math.min(i, 7) * 50}ms`, animationFillMode: 'both' }}
                                        >
                                            <ProductCard
                                                product={product}
                                                priority={i < 4}
                                                layout={viewMode}
                                                listName="Shop All Products Grid"
                                                listIndex={i + 1}
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
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-all cursor-pointer shadow-sm ${currentPage === page
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
                                <p className="text-xl text-gray-700">No products found</p>
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



        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white p-8 pt-24"><SkeletonProductGrid count={8} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}

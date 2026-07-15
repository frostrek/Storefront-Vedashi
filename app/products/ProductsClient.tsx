'use client';

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCategories, getFilterOptions, getBestSellers, getNewArrivals, getFilteredProducts, subscribeNewsletter, getFormEnumOptions, getSpecialityEnumOptions } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { FilteredProduct, FilterMeta, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { getValidPrices } from '@/utils/discount';
import { SkeletonProductGrid } from '@/components/Skeleton';
import SearchBar from '@/components/SearchBar';
import {
    SlidersHorizontal, X, Leaf, Loader2,
    LayoutGrid, List, ChevronDown
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
import { RU_DICTIONARY } from '@/content/ru';

interface FilterAttribute {
    attribute_id: string;
    attribute_name: string;
    attribute_slug: string;
    values: { value_name: string; value_slug: string }[];
}

const ITEMS_PER_PAGE = 24;

function ProductsContent() {
    const { formatPrice, format, resolvePrice, countryCode } = useCurrency();
    const {
        filters,
        activeChips,
        setSearch,
        setCategory,
        setSubCategory,
        setSubSubCategory,
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
    } = useFilters(format);

    const searchParams = useSearchParams();

    const gridRef = useRef<HTMLDivElement>(null);
    // Sentinel ref for IntersectionObserver (infinite scroll trigger)
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Lazy-load / infinite scroll state
    const [products, setProducts] = useState<FilteredProduct[]>([]);
    const [meta, setMeta] = useState<FilterMeta | null>(null);
    // loading = true during the FIRST page fetch (shows full skeleton)
    const [loading, setLoading] = useState(true);
    // loadingMore = true while fetching subsequent pages (shows bottom spinner)
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('Category');
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
    const [formFilterOptions, setFormFilterOptions] = useState<string[]>([]);
    const [specialityFilterOptions, setSpecialityFilterOptions] = useState<string[]>([]);

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
            if (chip.key === 'sub_sub_category') {
                const subSubCat = categories
                    .flatMap(c => (c as any).children || [])
                    .flatMap((c: any) => c.children || [])
                    .find((s: any) => s.slug === chip.value);
                return subSubCat ? { ...chip, value: subSubCat.name } : chip;
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
            // NOTE: priceMax is now set dynamically by the scope-aware effect below
            if (opts.categories) setCategories(opts.categories);
            if (opts.attributes) setFilterAttributes(opts.attributes);
        });
        // Fetch dynamic form & speciality filter options
        getFormEnumOptions().then(setFormFilterOptions);
        getSpecialityEnumOptions().then(setSpecialityFilterOptions);
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
        if (filters.sub_sub_category) params.sub_sub_category = filters.sub_sub_category;
        if (filters.brands.length > 0) params.brand = filters.brands.join(',');
        if (filters.priceRange[0] !== 0) params.min_price = filters.priceRange[0];
        if (filters.priceRange[1] !== Infinity) params.max_price = filters.priceRange[1];
        params.storefront_country = countryCode;
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
    }, [filters, countryCode]);

    // Fetch page — appends to list for page > 1, resets for page 1
    const fetchPage = useCallback(async (
        page: number,
        cancelled: { value: boolean },
        isFirstPage: boolean
    ) => {
        if (isFirstPage) {
            setLoading(true);
            setProducts([]);
        } else {
            setLoadingMore(true);
        }

        const params = buildParams(page);
        const result = await getFilteredProducts(params);

        if (!cancelled.value) {

            const incoming = result.data ?? [];
            const totalCount = result.meta?.total_count ?? incoming.length;
            const loadedSoFar = isFirstPage ? incoming.length : (currentPage - 1) * ITEMS_PER_PAGE + incoming.length;

            setProducts(prev => isFirstPage ? incoming : [...prev, ...incoming]);
            setMeta(result.meta);
            setHasMore(incoming.length === ITEMS_PER_PAGE && loadedSoFar < totalCount);

            if (isFirstPage) setLoading(false);
            else setLoadingMore(false);
        }
    }, [buildParams, currentPage]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail || !newsletterEmail.includes('@')) {
            toast.error(RU_DICTIONARY.footer.validEmail);
            return;
        }
        setIsSubscribing(true);
        try {
            const res = await subscribeNewsletter(newsletterEmail);
            if (res.success) {
                toast.success(res.message || RU_DICTIONARY.footer.subscribeSuccess);
                setNewsletterEmail('');
            } else {
                toast.error(res.message || RU_DICTIONARY.footer.subscribeFailed);
            }
        } catch (error) {
            toast.error(RU_DICTIONARY.toast.serverError);
        } finally {
            setIsSubscribing(false);
        }
    };

    // Reset to page 1 whenever filters change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const cancelled = { value: false };
        setCurrentPage(1);
        setHasMore(true);
        fetchPage(1, cancelled, true);
        return () => { cancelled.value = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtersKey]);

    // GA4: view_item_list
    // Fire whenever products change, deduplicated by hash
    const viewListHashRef = useRef<string>('');
    useEffect(() => {
        if (products.length > 0) {
            const currentHash = products.map(p => p.product_id).join(',');
            if (viewListHashRef.current === currentHash) return;
            viewListHashRef.current = currentHash;

            const gaItems: EcommerceItem[] = products.slice(0, 24).map((item, index) => {
                const { displayPrice } = getValidPrices(item.price, item.original_price ?? item.price);
                return {
                    item_id: item.product_id,
                    item_name: item.product_name,
                    price: displayPrice,
                    quantity: 1,
                    index: index + 1,
                    item_list_name: 'Shop All Products Grid',
                    item_category: item.category,
                    item_brand: item.brand
                };
            });
            trackEcommerce('view_item_list', {
                currency: 'INR',
                value: gaItems.reduce((acc, curr) => acc + curr.price, 0),
                items: gaItems
            });
        }
    }, [products]);

    // Infinite scroll: load next page when sentinel enters viewport
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
                    const nextPage = currentPage + 1;
                    const cancelled = { value: false };
                    setCurrentPage(nextPage);
                    fetchPage(nextPage, cancelled, false);
                }
            },
            // Trigger 300 px before the sentinel actually enters the screen
            { rootMargin: '300px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, currentPage, fetchPage]);

    const totalCount = meta?.total_count ?? products.length;
    const loadedCount = products.length;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        document.body.style.overflow = (mobileOpen || sortOpen) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen, sortOpen]);

    /* ─── Search bar state ─── */
    // (managed inside SearchBar component; we just call setSearch)

    /* ─── Sidebar content (shared between desktop & mobile) ─── */
    // Compute the slider max from LOADED products using the exact same
    // resolvePrice(price, country_prices) logic the product cards use.
    // This guarantees the slider matches the highest visible price for ANY country.
    //   • US  → resolvePrice uses product_variants.price directly
    //   • RU/KR → resolvePrice uses admin-set product_country_prices.price_inr
    const lastKnownMaxRef = useRef<number>(0);

    const localPriceMax = useMemo(() => {
        // We only want to re-evaluate the maximum boundary if the user isn't currently filtering by price.
        // If they are filtering by price, we lock the boundary so they don't get trapped.
        const isPriceFilterActive = filters.priceRange && (filters.priceRange[0] !== 0 || filters.priceRange[1] !== Infinity);

        if (products.length > 0 && !isPriceFilterActive) {
            let max = 0;
            for (const p of products) {
                const localPrice = resolvePrice(p.price, (p as any).country_prices);
                if (localPrice > max) max = localPrice;
            }
            if (max > 0) {
                // Round up nicely to give the slider some breathing room
                let rounded = Math.ceil(max / 1000) * 1000;
                if (max <= 100) rounded = Math.ceil(max / 10) * 10;
                else if (max <= 1000) rounded = Math.ceil(max / 100) * 100;
                else if (max <= 5000) rounded = Math.ceil(max / 500) * 500;
                
                lastKnownMaxRef.current = rounded;
                return rounded;
            }
        }
        
        // If filters yield 0 products, OR if a price filter is currently active, 
        // retain the last known max price so the slider doesn't collapse!
        if (lastKnownMaxRef.current > 0) {
            return lastKnownMaxRef.current;
        }

        // Ultimate fallback before any products have ever loaded
        return Math.max(resolvePrice(priceMax), 1);
    }, [products, resolvePrice, priceMax, filters.priceRange]);
    const localStep = useMemo(() => localPriceMax / 100, [localPriceMax]);

    const priceButtons = useMemo(() => {
        const getNiceNumber = (num: number) => {
            if (num <= 10) return Number(num.toFixed(1));
            if (num <= 100) return Math.round(num / 5) * 5;
            if (num <= 1000) return Math.round(num / 50) * 50;
            if (num <= 10000) return Math.round(num / 500) * 500;
            return Math.round(num / 1000) * 1000;
        };
        const q1 = Math.max(getNiceNumber(localPriceMax * 0.25), 0.1);
        const q2 = Math.max(getNiceNumber(localPriceMax * 0.5), q1 + 0.1);
        const q3 = Math.max(getNiceNumber(localPriceMax * 0.75), q2 + 0.1);
        return [
            { label: `Under ${format(q1)}`, range: [0, q1] as [number, number] },
            { label: `${format(q1)} – ${format(q2)}`, range: [q1, q2] as [number, number] },
            { label: `${format(q2)} – ${format(q3)}`, range: [q2, q3] as [number, number] },
            { label: `${format(q3)}+`, range: [q3, Infinity] as [number, number] },
        ];
    }, [localPriceMax, format]);

    const sidebarContent = (
        <div className="space-y-0">
            {categories.length > 0 && (
                <FilterSection title={RU_DICTIONARY.plp.category} defaultOpen={true}>
                    <div className="space-y-3 pt-1">
                        <select
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] font-medium focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                            value={filters.category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                            }}
                        >
                            <option value="">{RU_DICTIONARY.plp.allCategories}</option>
                            {categories.map((cat: Category) => (
                                <option key={cat.category_id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>

                        {/* Subcategory */}
                        {filters.category && (categories.find((c: any) => c.slug === filters.category)?.children?.length ?? 0) > 0 && (
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] font-medium focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                value={filters.sub_category}
                                onChange={(e) => setSubCategory(e.target.value)}
                            >
                                <option value="">{RU_DICTIONARY.plp.allSubcategories}</option>
                                {categories.find((c: Category) => c.slug === filters.category)?.children?.map((sub: Category) => (
                                    <option key={sub.category_id} value={sub.slug}>{sub.name}</option>
                                ))}
                            </select>
                        )}
                        
                        {/* Sub Subcategory */}
                        {filters.sub_category && (categories.find((c: any) => c.slug === filters.category)?.children?.find((s: any) => s.slug === filters.sub_category)?.children?.length ?? 0) > 0 && (
                            <select
                                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] font-medium focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                value={filters.sub_sub_category}
                                onChange={(e) => setSubSubCategory(e.target.value)}
                            >
                                <option value="">{RU_DICTIONARY.plp.allTypes}</option>
                                {categories.find((c: any) => c.slug === filters.category)?.children?.find((s: any) => s.slug === filters.sub_category)?.children?.map((sub: Category) => (
                                    <option key={sub.category_id} value={sub.slug}>{sub.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </FilterSection>
            )}

            {brandOptions.length > 0 && (
                <FilterSection title={RU_DICTIONARY.plp.brand} scrollable scrollHeight="220px">
                    <CheckboxGroup
                        options={brandOptions}
                        selected={filters.brands}
                        onChange={setBrands}
                        maxVisible={brandOptions.length}
                        searchable={true}
                        placeholder="Search brands..."
                    />
                </FilterSection>
            )}

            <FilterSection title={RU_DICTIONARY.plp.priceRange}>
                <div className="mb-5 flex flex-wrap gap-2 text-xs">
                    {priceButtons.map(p => (
                        <button
                            key={p.label}
                            onClick={() => setPriceRange(p.range, localPriceMax)}
                            className={`rounded-full border px-3 py-1.5 transition-colors cursor-pointer ${(filters.priceRange[0] === p.range[0] && filters.priceRange[1] === p.range[1])
                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-800'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <RangeSlider
                    min={0}
                    max={localPriceMax}
                    step={localStep}
                    value={[filters.priceRange[0] ?? 0, filters.priceRange[1] === Infinity ? localPriceMax : filters.priceRange[1]]}
                    onChange={(val) => setPriceRange(val, localPriceMax)}
                    formatLabel={v => format(v)}
                />
            </FilterSection>

            <CountryDropdown
                options={displayCountryOptions}
                selected={filters.country}
                onChange={setCountry}
            />

            <FilterSection title={RU_DICTIONARY.plp.rating} defaultOpen={false}>
                <CheckboxGroup
                    options={FILTER_CONFIGS.find(f => f.key === 'rating')?.staticOptions ?? []}
                    selected={filters.ratings}
                    onChange={setRatings}
                />
            </FilterSection>

            <FilterSection title={RU_DICTIONARY.plp.discount} defaultOpen={false}>
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                    {[10, 20, 30, 40, 50].map(pct => (
                        <label key={pct} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="discount"
                                className="h-[15px] w-[15px] rounded-full border-gray-300 text-gray-800 focus:ring-gray-800 cursor-pointer"
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

            <FilterSection title={RU_DICTIONARY.plp.form} defaultOpen={false}>
                <CheckboxGroup
                    options={formFilterOptions}
                    selected={filters.form}
                    onChange={setForm}
                />
            </FilterSection>

            <FilterSection title={RU_DICTIONARY.plp.specialities} defaultOpen={false}>
                <CheckboxGroup
                    options={specialityFilterOptions}
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

            <FilterSection title={RU_DICTIONARY.plp.availability}>
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
                        className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer shadow-sm"
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
            <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-2 sm:pt-4 relative z-10">


                <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
                    {/* ─── Desktop Sidebar ─── */}
                    <aside className="hidden lg:block relative">
                        <div className="sticky top-32 h-[calc(100vh-120px)] rounded-none border border-gray-100 border-l-0 bg-white shadow-[8px_0_30px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="h-full overflow-y-auto overscroll-auto px-7 pt-6 no-scrollbar pb-24">
                                <h2 className="text-2xl font-serif font-black text-gray-900 mb-3 tracking-wide pl-1">{RU_DICTIONARY.plp.filters}</h2>
                                {sidebarContent}
                            </div>
                        </div>
                    </aside>

                    {/* ─── Mobile Drawer ─── */}
                    {mobileOpen && (
                        <div className="fixed top-[100px] bottom-0 left-0 right-0 z-[100] lg:hidden">
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setMobileOpen(false)}
                            />
                            <div className="absolute inset-0 w-full bg-white flex flex-col overflow-hidden animate-in fade-in duration-300">
                                <div className="flex-none flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-white relative z-[110]">
                                    <h2 className="text-xl font-bold text-gray-900">{RU_DICTIONARY.plp.filters}</h2>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={clearAll}
                                            className="text-[13px] font-bold text-[#91C934] hover:underline cursor-pointer"
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            onClick={() => setMobileOpen(false)}
                                            className="rounded-full p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <X className="h-6 w-6 text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 flex overflow-hidden">
                                    {/* Left Sidebar: Headings */}
                                    <div className="w-[120px] bg-gray-50 border-r border-gray-100 overflow-y-auto no-scrollbar">
                                        {[
                                            'Category', 'Brand', 'Price Range', 'Country', 'Rating', 'Discount', 'Form', 'Specialities',
                                            ...filterAttributes.map(a => a.attribute_name),
                                            'Availability'
                                        ].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveFilterTab(tab)}
                                                className={`w-full px-4 py-4 text-left text-[13px] font-bold transition-all border-l-4 ${activeFilterTab === tab
                                                    ? 'bg-white text-[#91C934] border-[#91C934]'
                                                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right Content: Filter Options */}
                                    <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar bg-white">
                                        {activeFilterTab === 'Category' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.category}</h3>
                                                <div className="space-y-3">
                                                    <select
                                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] font-medium focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                                        value={filters.category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                    >
                                                        <option value="">{RU_DICTIONARY.plp.allCategories}</option>
                                                        {categories.map((cat: Category) => (
                                                            <option key={cat.category_id} value={cat.slug}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                    {filters.category && (categories.find((c: any) => c.slug === filters.category)?.children?.length ?? 0) > 0 && (
                                                        <select
                                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] font-medium focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                                            value={filters.sub_category}
                                                            onChange={(e) => setSubCategory(e.target.value)}
                                                        >
                                                            <option value="">{RU_DICTIONARY.plp.allSubcategories}</option>
                                                            {categories.find((c: Category) => c.slug === filters.category)?.children?.map((sub: Category) => (
                                                                <option key={sub.category_id} value={sub.slug}>{sub.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    {filters.sub_category && (categories.find((c: any) => c.slug === filters.category)?.children?.find((s: any) => s.slug === filters.sub_category)?.children?.length ?? 0) > 0 && (
                                                        <select
                                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] font-medium focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                                            value={filters.sub_sub_category}
                                                            onChange={(e) => setSubSubCategory(e.target.value)}
                                                        >
                                                            <option value="">{RU_DICTIONARY.plp.allTypes}</option>
                                                            {categories.find((c: any) => c.slug === filters.category)?.children?.find((s: any) => s.slug === filters.sub_category)?.children?.map((sub: Category) => (
                                                                <option key={sub.category_id} value={sub.slug}>{sub.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {activeFilterTab === 'Brand' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.brand}</h3>
                                                <CheckboxGroup
                                                    options={brandOptions}
                                                    selected={filters.brands}
                                                    onChange={setBrands}
                                                    maxVisible={brandOptions.length}
                                                    searchable={true}
                                                    placeholder="Search brands..."
                                                />
                                            </div>
                                        )}
                                        {activeFilterTab === 'Price Range' && (
                                            <div className="space-y-6">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.priceRange}</h3>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    {priceButtons.map(p => (
                                                        <button
                                                            key={p.label}
                                                            onClick={() => setPriceRange(p.range, localPriceMax)}
                                                            className={`rounded-full border px-3 py-1.5 transition-colors cursor-pointer ${(filters.priceRange[0] === p.range[0] && filters.priceRange[1] === p.range[1])
                                                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-800'
                                                                }`}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <RangeSlider
                                                    min={0}
                                                    max={localPriceMax}
                                                    step={localStep}
                                                    value={[filters.priceRange[0] ?? 0, filters.priceRange[1] === Infinity ? localPriceMax : filters.priceRange[1]]}
                                                    onChange={(val) => setPriceRange(val, localPriceMax)}
                                                    formatLabel={v => format(v)}
                                                />
                                            </div>
                                        )}
                                        {activeFilterTab === 'Country' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.country}</h3>
                                                <div className="space-y-3">
                                                    {displayCountryOptions.map((opt) => (
                                                        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                            <input
                                                                type="radio"
                                                                name="mobile-country"
                                                                className="h-4 w-4 rounded-full border-gray-300 text-[#3d5c3a] focus:ring-[#3d5c3a] cursor-pointer"
                                                                checked={filters.country === opt}
                                                                onChange={() => setCountry(opt)}
                                                            />
                                                            <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {activeFilterTab === 'Rating' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.rating}</h3>
                                                <CheckboxGroup
                                                    options={FILTER_CONFIGS.find(f => f.key === 'rating')?.staticOptions ?? []}
                                                    selected={filters.ratings}
                                                    onChange={setRatings}
                                                />
                                            </div>
                                        )}
                                        {activeFilterTab === 'Discount' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.discount}</h3>
                                                <div className="flex flex-col gap-3 text-[13px] text-gray-700">
                                                    {[10, 20, 30, 40, 50].map(pct => (
                                                        <label key={pct} className="flex items-center gap-3 cursor-pointer group">
                                                            <input
                                                                type="radio"
                                                                name="mobile-discount"
                                                                className="h-4 w-4 rounded-full border-gray-300 text-[#3d5c3a] focus:ring-[#3d5c3a] cursor-pointer"
                                                                checked={filters.discountMin === pct}
                                                                onChange={() => setDiscountMin(pct)}
                                                            />
                                                            <span className="group-hover:text-gray-900 transition-colors">{pct}% {RU_DICTIONARY.plp.andAbove}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {activeFilterTab === 'Form' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.form}</h3>
                                                <CheckboxGroup
                                                    options={formFilterOptions}
                                                    selected={filters.form}
                                                    onChange={setForm}
                                                />
                                            </div>
                                        )}
                                        {activeFilterTab === 'Specialities' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.specialities}</h3>
                                                <CheckboxGroup
                                                    options={specialityFilterOptions}
                                                    selected={filters.specialities}
                                                    onChange={setSpecialities}
                                                />
                                            </div>
                                        )}
                                        {filterAttributes.map((attr) => activeFilterTab === attr.attribute_name && (
                                            <div key={attr.attribute_id} className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{attr.attribute_name}</h3>
                                                <CheckboxGroup
                                                    options={attr.values.map((v) => v.value_name)}
                                                    selected={filters.attributes[attr.attribute_slug] ? filters.attributes[attr.attribute_slug].map(slug => attr.values.find((v) => v.value_slug === slug)?.value_name || slug) : []}
                                                    onChange={(selectedNames) => {
                                                        const selectedSlugs = selectedNames.map(name => attr.values.find((v) => v.value_name === name)?.value_slug || name);
                                                        // @ts-ignore
                                                        setAttribute(attr.attribute_slug, selectedSlugs);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        {activeFilterTab === 'Availability' && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-gray-900">{RU_DICTIONARY.plp.availability}</h3>
                                                <div className="space-y-4">
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
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Buttons */}
                                <div className="flex-none border-t border-gray-100 flex bg-white pb-safe">
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="flex-1 h-14 flex items-center justify-center text-[14px] font-bold text-gray-800 border-r border-gray-100 active:bg-gray-50 transition-colors"
                                    >
                                        {RU_DICTIONARY.plp.cancel}
                                    </button>
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="flex-1 h-14 flex items-center justify-center text-[14px] font-bold text-[#91C934] active:bg-gray-50 transition-colors"
                                    >
                                        {RU_DICTIONARY.plp.applyFilters}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Product Grid ─── */}
                    <div className="min-w-0">
                        {/* Sort bar + count (Desktop only) */}
                        <div className="mb-4 hidden lg:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <span className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    {totalCount === 0 ? 'No products' : (
                                        <>{RU_DICTIONARY.plp.showing} <span className="font-semibold text-gray-900">{loadedCount}</span> {RU_DICTIONARY.plp.of}{' '}
                                            <span className="font-semibold text-gray-900">{totalCount}</span> {RU_DICTIONARY.plp.products}</>
                                    )}
                                </span>
                                {(loading || loadingMore) && <Loader2 className="h-4 w-4 animate-spin text-[#3d5c3a]" />}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => { setViewMode('grid'); localStorage.setItem('vedashi_view_mode', 'grid'); }}
                                        className={`p-2 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#91C934] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                        aria-label={RU_DICTIONARY.plp.gridView}
                                        title={RU_DICTIONARY.plp.gridView}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => { setViewMode('list'); localStorage.setItem('vedashi_view_mode', 'list'); }}
                                        className={`p-2 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#91C934] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                        aria-label={RU_DICTIONARY.plp.listView}
                                        title={RU_DICTIONARY.plp.listView}
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

                        {/* Mobile Count */}
                        <div className="lg:hidden mb-4 flex items-center justify-between">
                            <p className="text-[13px] text-gray-500 flex items-center gap-2">
                                <span className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                    {totalCount === 0 ? 'No products' : (
                                        <>{RU_DICTIONARY.plp.showing} <span className="font-bold text-gray-900">{loadedCount}</span> {RU_DICTIONARY.plp.of} <span className="font-bold text-gray-900">{totalCount}</span></>
                                    )}
                                </span>
                                {(loading || loadingMore) && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3d5c3a]" />}
                            </p>
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
                                <div ref={gridRef} className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-4'}>
                                    {products.map((product, i) => (
                                        <div
                                            key={`${product.product_id}-${i}`}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${Math.min(i % 24, 7) * 50}ms`, animationFillMode: 'both' }}
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

                                {/* ── Infinite Scroll Sentinel + Loading State ── */}
                                <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-3 pb-6">
                                    {loadingMore && (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#3d5c3a]" />
                                            <p className="text-xs text-gray-400 font-medium">{RU_DICTIONARY.plp.loadingMore}</p>
                                        </div>
                                    )}
                                    {!hasMore && !loadingMore && (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex items-center gap-3 w-full max-w-xs">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest whitespace-nowrap">{RU_DICTIONARY.plp.allCaughtUp}</span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {RU_DICTIONARY.plp.showingAll} <span className="font-bold text-gray-600">{loadedCount}</span> {RU_DICTIONARY.plp.products}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
                                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-3xl">🌿</span>
                                </div>
                                <p className="text-xl text-gray-700">{RU_DICTIONARY.plp.noProductsFound}</p>
                                <p className="mt-2 text-sm text-gray-400">{RU_DICTIONARY.plp.tryAdjustingFilters}
                                    {filters.search && <> {RU_DICTIONARY.plp.for} &ldquo;<strong>{filters.search}</strong>&rdquo;</>}
                                </p>
                                {activeChips.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="mt-5 rounded-xl bg-[#91C934] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a2a] transition-colors cursor-pointer"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* ── Mobile Bottom Sticky Bar ── */}
            {!mobileOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] pb-safe animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="flex h-14">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2.5 text-[14px] font-bold text-gray-800 border-r border-gray-100 active:bg-gray-50 transition-colors"
                        >
                            <SlidersHorizontal className="h-4 w-4 text-[#91C934]" />
                            Filters
                            {activeChips.length > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#91C934] text-[10px] font-black text-white shadow-sm">
                                    {activeChips.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setSortOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2.5 text-[14px] font-bold text-gray-800 active:bg-gray-50 transition-colors"
                        >
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">{RU_DICTIONARY.plp.sortBy}</span>
                                <span className="truncate max-w-[120px]">
                                    {SORT_OPTIONS.find(o => o.value === (filters.sort || SORT_OPTIONS[0].value))?.label}
                                </span>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Mobile Sort Bottom Sheet ── */}
            {sortOpen && (
                <div className="fixed inset-0 z-[1000] lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 animate-in fade-in duration-300"
                        onClick={() => setSortOpen(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white overflow-hidden animate-in slide-in-from-bottom duration-500 ease-out shadow-2xl">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{RU_DICTIONARY.plp.sortBy}</h3>
                            <button
                                onClick={() => setSortOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="px-3 py-4 space-y-1">
                            {SORT_OPTIONS.map((option) => {
                                const isSelected = (filters.sort || SORT_OPTIONS[0].value) === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSort(option.value);
                                            setSortOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[15px] font-bold transition-all ${isSelected
                                            ? 'bg-[#91C934]/5 text-[#91C934]'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {option.label}
                                        {isSelected && (
                                            <div className="h-5 w-5 rounded-full bg-[#91C934] flex items-center justify-center shadow-md">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="h-10 bg-white" /> {/* Extra padding for home indicator */}
                    </div>
                </div>
            )}

        </div>
    );
}

export default function ProductsClientPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white p-8 pt-24"><SkeletonProductGrid count={8} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}

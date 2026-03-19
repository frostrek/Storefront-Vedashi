'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { FILTER_CONFIGS } from '@/lib/filterConfig';

export interface FilterState {
    search: string;
    category: string;
    sub_category: string;
    brands: string[];
    country: string;
    form: string[];
    specialities: string[];
    ratings: string[];
    priceRange: [number, number];
    alcoholRange: [number, number];
    inStock: boolean;
    bestSellers: boolean;
    newArrivals: boolean;
    sort: string;
    discountMin: number | null;
    attributes: Record<string, string[]>;
}

const DEFAULTS: FilterState = {
    search: '',
    category: '',
    sub_category: '',
    brands: [],
    country: '',
    form: [],
    specialities: [],
    ratings: [],
    priceRange: [0, Infinity],
    alcoholRange: [0, 100],
    inStock: false,
    bestSellers: false,
    newArrivals: false,
    sort: '',
    discountMin: null,
    attributes: {},
};

function parseArray(val: string | null): string[] {
    if (!val) return [];
    return val.split(',').filter(Boolean);
}

function parseRange(val: string | null, fallback: [number, number]): [number, number] {
    if (!val) return fallback;
    const parts = val.split('-').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]];
    }
    return fallback;
}

export function useFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Read current state from URL
    const filters: FilterState = useMemo(() => {
        const attributes: Record<string, string[]> = {};
        searchParams.forEach((val, key) => {
            if (key.startsWith('attr_')) {
                const attrKey = key.replace('attr_', '');
                attributes[attrKey] = val.split(',').filter(Boolean);
            }
        });

        return {
            search: searchParams.get('search') || DEFAULTS.search,
            category: searchParams.get('category') || DEFAULTS.category,
            sub_category: searchParams.get('sub_category') || DEFAULTS.sub_category,
            brands: parseArray(searchParams.get('brand')),
            country: searchParams.get('country') || DEFAULTS.country,
            form: parseArray(searchParams.get('form')),
            specialities: parseArray(searchParams.get('specialities')),
            ratings: parseArray(searchParams.get('rating')),
            priceRange: parseRange(searchParams.get('price'), DEFAULTS.priceRange),
            alcoholRange: parseRange(searchParams.get('alcohol'), DEFAULTS.alcoholRange),
            inStock: searchParams.get('inStock') === 'true',
            bestSellers: searchParams.get('bestSeller') === 'true',
            newArrivals: searchParams.get('newArrival') === 'true',
            sort: searchParams.get('sort') || DEFAULTS.sort,
            discountMin: searchParams.get('discount_min') ? Number(searchParams.get('discount_min')) : null,
            attributes,
        };
    }, [searchParams]);

    // Push updates to URL (shallow — no full reload)
    const setParam = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'false') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        // Reset page on filter  change
        params.delete('page');
        const qs = params.toString();
        router.replace(`${pathname}${qs ? '?' + qs : ''}`, { scroll: false });
    }, [searchParams, router, pathname]);

    // Setter  helpers
    const setSearch = useCallback((val: string) => setParam({ search: val || null }), [setParam]);
    const setCategory = useCallback((val: string) => setParam({ category: val || null, sub_category: null }), [setParam]);
    const setSubCategory = useCallback((val: string) => setParam({ sub_category: val || null }), [setParam]);
    const setBrands = useCallback((val: string[]) => setParam({ brand: val.length ? val.join(',') : null }), [setParam]);
    const setCountry = useCallback((val: string) => setParam({ country: val || null }), [setParam]);
    const setForm = useCallback((val: string[]) => setParam({ form: val.length ? val.join(',') : null }), [setParam]);
    const setSpecialities = useCallback((val: string[]) => setParam({ specialities: val.length ? val.join(',') : null }), [setParam]);
    const setRatings = useCallback((val: string[]) => setParam({ rating: val.length ? val.join(',') : null }), [setParam]);
    const setPriceRange = useCallback((val: [number, number], maxPriceInStore?: number) => {
        const pMax = maxPriceInStore ?? Infinity;
        const isDefault = val[0] === 0 && (val[1] === pMax || val[1] === Infinity);
        setParam({ price: isDefault ? null : `${val[0]}-${val[1]}` });
    }, [setParam]);
    const setAlcoholRange = useCallback((val: [number, number]) => {
        const alcConfig = FILTER_CONFIGS.find(f => f.key === 'alcohol');
        const isDefault = val[0] === (alcConfig?.min ?? 0) && val[1] === (alcConfig?.max ?? 60);
        setParam({ alcohol: isDefault ? null : `${val[0]}-${val[1]}` });
    }, [setParam]);
    const setInStock = useCallback((val: boolean) => setParam({ inStock: val ? 'true' : null }), [setParam]);
    const setBestSellers = useCallback((val: boolean) => setParam({ bestSeller: val ? 'true' : null }), [setParam]);
    const setNewArrivals = useCallback((val: boolean) => setParam({ newArrival: val ? 'true' : null }), [setParam]);
    const setSort = useCallback((val: string) => setParam({ sort: val || null }), [setParam]);
    const setDiscountMin = useCallback((val: number | null) => setParam({ discount_min: val ? String(val) : null }), [setParam]);
    const setAttribute = useCallback((key: string, val: string[]) => setParam({ [`attr_${key}`]: val.length ? val.join(',') : null }), [setParam]);

    const clearAll = useCallback(() => {
        router.replace(pathname, { scroll: false });
    }, [router, pathname]);

    // Remove a single chip
    const removeFilter = useCallback((key: string, value: string) => {
        if (key.startsWith('attr_')) {
            const attrKey = key.replace('attr_', '');
            const current = filters.attributes[attrKey] || [];
            setAttribute(attrKey, current.filter(v => v !== value));
            return;
        }

        switch (key) {
            case 'brand': setBrands(filters.brands.filter(b => b !== value)); break;
            case 'country': setCountry(''); break;
            case 'form': setForm(filters.form.filter(f => f !== value)); break;
            case 'specialities': setSpecialities(filters.specialities.filter(s => s !== value)); break;
            case 'rating': setRatings(filters.ratings.filter(r => r !== value)); break;
            case 'category': setParam({ category: null, sub_category: null }); break;
            case 'sub_category': setSubCategory(''); break;
            case 'search': setSearch(''); break;
            case 'price': setPriceRange(DEFAULTS.priceRange); break;
            case 'alcohol': setAlcoholRange(DEFAULTS.alcoholRange); break;
            case 'inStock': setInStock(false); break;
            case 'bestSellers': setBestSellers(false); break;
            case 'newArrivals': setNewArrivals(false); break;
            case 'discount_min': setDiscountMin(null); break;
            case 'sort': setSort(''); break;
        }
    }, [filters, setBrands, setCountry, setRatings, setCategory, setSubCategory, setSearch, setPriceRange, setAlcoholRange, setInStock, setBestSellers, setNewArrivals, setSort, setDiscountMin, setAttribute, setParam]);

    // Build chips from active filters
    const activeChips = useMemo(() => {
        const chips: { key: string; label: string; value: string }[] = [];
        if (filters.search) chips.push({ key: 'search', label: 'Search', value: filters.search });
        if (filters.category) chips.push({ key: 'category', label: 'Category', value: filters.category });
        if (filters.sub_category) chips.push({ key: 'sub_category', label: 'Subcategory', value: filters.sub_category });
        filters.brands.forEach(b => chips.push({ key: 'brand', label: 'Brand', value: b }));
        if (filters.country) chips.push({ key: 'country', label: 'Country', value: filters.country });
        filters.form.forEach(f => chips.push({ key: 'form', label: 'Form', value: f }));
        filters.specialities.forEach(s => chips.push({ key: 'specialities', label: 'Speciality', value: s }));
        filters.ratings.forEach(r => chips.push({ key: 'rating', label: 'Rating', value: r }));
        const pMax = filters.priceRange[1] === Infinity ? 'Max' : `$${filters.priceRange[1]}`;
        if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== Infinity) {
            chips.push({ key: 'price', label: 'Price', value: `$${filters.priceRange[0]} – ${pMax}` });
        }
        const alcConfig = FILTER_CONFIGS.find(f => f.key === 'alcohol');
        if (filters.alcoholRange[0] !== (alcConfig?.min ?? 0) || filters.alcoholRange[1] !== (alcConfig?.max ?? 100)) {
            chips.push({ key: 'alcohol', label: 'Alcohol', value: `${filters.alcoholRange[0]}% – ${filters.alcoholRange[1]}%` });
        }
        if (filters.inStock) chips.push({ key: 'inStock', label: 'Status', value: 'In Stock' });
        if (filters.bestSellers) chips.push({ key: 'bestSellers', label: 'Collection', value: 'Best Sellers' });
        if (filters.newArrivals) chips.push({ key: 'newArrivals', label: 'Collection', value: 'New Arrivals' });
        if (filters.discountMin) chips.push({ key: 'discount_min', label: 'Discount', value: `${filters.discountMin}% & above` });
        
        Object.entries(filters.attributes).forEach(([key, values]) => {
            values.forEach(v => chips.push({ key: `attr_${key}`, label: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: v }));
        });

        return chips;
    }, [filters]);

    return {
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
        setAlcoholRange,
        setInStock,
        setBestSellers,
        setNewArrivals,
        setSort,
        setDiscountMin,
        setAttribute,
        removeFilter,
        clearAll,
    };
}

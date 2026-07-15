/**
 * Centralized filter configuration.
 * Adding a new filter = adding one entry here. Zero UI changes needed.
 */

import { RU_DICTIONARY } from '@/content/ru';

export type FilterType = 'checkbox' | 'range' | 'toggle' | 'rating';

export interface FilterConfig {
    key: string;
    label: string;
    type: FilterType;
    urlParam: string;
    /** For range filters */
    min?: number;
    max?: number;
    step?: number;
    formatLabel?: (v: number) => string;
    /** For checkbox filters — static options (used as fallback if API returns nothing) */
    staticOptions?: string[];
    /** Default value */
    defaultValue?: string | string[] | [number, number] | boolean;
}

export const FILTER_CONFIGS: FilterConfig[] = [
    {
        key: 'brand',
        label: 'Brand',
        type: 'checkbox',
        urlParam: 'brand',
        staticOptions: [],
        defaultValue: [],
    },
    {
        key: 'price',
        label: 'Price Range',
        type: 'range',
        urlParam: 'price',
        min: 0,
        max: 500,
        step: 5,
        formatLabel: (v: number) => `₹${v}`,
        defaultValue: [0, 500],
    },

    {
        key: 'country',
        label: 'Country',
        type: 'checkbox',
        urlParam: 'country',
        staticOptions: [],
        defaultValue: [],
    },
    {
        key: 'rating',
        label: 'Rating',
        type: 'checkbox',
        urlParam: 'rating',
        staticOptions: ['4★ ' + RU_DICTIONARY.plp.andAbove, '3★ ' + RU_DICTIONARY.plp.andAbove, '2★ ' + RU_DICTIONARY.plp.andAbove],
        defaultValue: [],
    },
    {
        key: 'inStock',
        label: 'In Stock Only',
        type: 'toggle',
        urlParam: 'inStock',
        defaultValue: false,
    },
    {
        key: 'bestSellers',
        label: 'Best Sellers',
        type: 'toggle',
        urlParam: 'bestSeller',
        defaultValue: false,
    },
    {
        key: 'newArrivals',
        label: 'New Arrivals',
        type: 'toggle',
        urlParam: 'newArrival',
        defaultValue: false,
    },
];

/** Sort options (mapped to backend sort values) */
export const SORT_OPTIONS = [
    { label: RU_DICTIONARY.plp.sort.featured, value: '' },
    { label: RU_DICTIONARY.plp.sort.priceLowHigh, value: 'price_asc' },
    { label: RU_DICTIONARY.plp.sort.priceHighLow, value: 'price_desc' },
    { label: RU_DICTIONARY.plp.sort.newest, value: 'newest' },
    { label: RU_DICTIONARY.plp.sort.bestSelling, value: 'best_selling' },
    { label: RU_DICTIONARY.plp.sort.highestRated, value: 'rating_desc' },
    { label: RU_DICTIONARY.plp.sort.highestDiscount, value: 'discount_desc' },
    { label: RU_DICTIONARY.plp.sort.nameAZ, value: 'name_asc' },
    { label: RU_DICTIONARY.plp.sort.nameZA, value: 'name_desc' },
];

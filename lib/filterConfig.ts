/**
 * Centralized filter configuration.
 * Adding a new filter = adding one entry here. Zero UI changes needed.
 */


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
        staticOptions: ['4★ & above', '3★ & above', '2★ & above'],
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
        urlParam: 'bestSellers',
        defaultValue: false,
    },
    {
        key: 'newArrivals',
        label: 'New Arrivals',
        type: 'toggle',
        urlParam: 'newArrivals',
        defaultValue: false,
    },
];

/** Sort options (mapped to backend sort values) */
export const SORT_OPTIONS = [
    { label: 'Featured', value: '' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'newest' },
    { label: 'Best Selling', value: 'best_selling' },
    { label: 'Highest Rated', value: 'rating_desc' },
    { label: 'Highest Discount', value: 'discount_desc' },
    { label: 'Name: A–Z', value: 'name_asc' },
    { label: 'Name: Z–A', value: 'name_desc' },
];

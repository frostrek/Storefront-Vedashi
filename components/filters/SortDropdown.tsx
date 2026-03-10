'use client';

import { ChevronDown } from 'lucide-react';

interface SortOption {
    label: string;
    value: string;
}

interface SortDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options?: SortOption[];
}

const DEFAULT_OPTIONS: SortOption[] = [
    { label: 'Default', value: '' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'newest' },
    { label: 'Name: A–Z', value: 'name_asc' },
    { label: 'Name: Z–A', value: 'name_desc' },
];

export default function SortDropdown({ value, onChange, options = DEFAULT_OPTIONS }: SortDropdownProps) {
    return (
        <div className="relative inline-flex items-center gap-2">
            <span className="text-xs font-medium text-warm-gray hidden sm:inline">Sort by</span>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="appearance-none rounded-lg border border-light-border bg-white pl-3 pr-8 py-2 text-sm text-charcoal font-medium cursor-pointer hover:border-warm-gray/50 focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy/20 transition-all"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warm-gray pointer-events-none" />
            </div>
        </div>
    );
}

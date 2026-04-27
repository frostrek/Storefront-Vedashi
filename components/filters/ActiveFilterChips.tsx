'use client';

import { X } from 'lucide-react';

interface FilterChip {
    key: string;
    label: string;
    value: string;
}

interface ActiveFilterChipsProps {
    chips: FilterChip[];
    onRemove: (key: string, value: string) => void;
    onClearAll: () => void;
}

export default function ActiveFilterChips({ chips, onRemove, onClearAll }: ActiveFilterChipsProps) {
    if (chips.length === 0) return null;

    const formatValue = (key: string, value: string) => {
        if (key === 'price') return value;
        if (key === 'discount_min') return value;
        // category/sub_category values are already resolved to real DB names — display as-is
        if (key === 'category' || key === 'sub_category') return value;

        // For other slug-based values, convert hyphens and titlecase
        return value
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-5">
            {chips.map((chip, i) => (
                <span
                    key={`${chip.key}-${chip.value}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 animate-fade-in shadow-sm"
                >
                    <span className="text-gray-500 font-medium">{chip.label}:</span>
                    {formatValue(chip.key, chip.value)}
                    <button
                        onClick={() => onRemove(chip.key, chip.value)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 transition-colors cursor-pointer text-gray-500 hover:text-gray-900"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <button
                onClick={onClearAll}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors ml-2"
            >
                Clear all
            </button>
        </div>
    );
}

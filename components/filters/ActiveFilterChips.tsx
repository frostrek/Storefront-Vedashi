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
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#3d5c3a]/5 border border-[#3d5c3a]/10 px-3 py-1.5 text-xs font-medium text-[#3d5c3a] animate-fade-in"
                >
                    <span className="text-[#3d5c3a]/60">{chip.label}:</span>
                    {formatValue(chip.key, chip.value)}
                    <button
                        onClick={() => onRemove(chip.key, chip.value)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-[#3d5c3a]/10 transition-colors cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <button
                onClick={onClearAll}
                className="text-xs font-semibold text-warm-gray hover:text-herbal-green transition-colors ml-1"
            >
                Clear all
            </button>
        </div>
    );
}

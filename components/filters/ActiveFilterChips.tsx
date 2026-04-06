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

    return (
        <div className="flex flex-wrap items-center gap-2 mb-5">
            {chips.map((chip, i) => (
                <span
                    key={`${chip.key}-${chip.value}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-herbal-green/8 border border-herbal-green/15 px-3 py-1.5 text-xs font-medium text-herbal-green animate-fade-in"
                >
                    <span className="text-herbal-green/50">{chip.label}:</span>
                    {chip.value}
                    <button
                        onClick={() => onRemove(chip.key, chip.value)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-herbal-green/15 transition-colors"
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

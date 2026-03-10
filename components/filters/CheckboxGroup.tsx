'use client';

import { useState } from 'react';

interface CheckboxGroupProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    maxVisible?: number;
}

export default function CheckboxGroup({ options, selected, onChange, maxVisible = 5 }: CheckboxGroupProps) {
    const [showAll, setShowAll] = useState(false);
    const visibleOptions = showAll ? options : options.slice(0, maxVisible);
    const hasMore = options.length > maxVisible;

    const toggle = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter(v => v !== value)
                : [...selected, value]
        );
    };

    return (
        <div className="space-y-2">
            {visibleOptions.map(option => (
                <label
                    key={option}
                    className="flex items-center gap-3 cursor-pointer group py-0.5"
                >
                    <div className="relative flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={selected.includes(option)}
                            onChange={() => toggle(option)}
                            className="peer sr-only"
                        />
                        <div className="h-[18px] w-[18px] rounded border-[1.5px] border-warm-gray/40 bg-white transition-all duration-200 peer-checked:border-burgundy peer-checked:bg-burgundy group-hover:border-warm-gray/70" />
                        <svg
                            className="absolute top-[3px] left-[3px] h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="2 6 5 9 10 3" />
                        </svg>
                    </div>
                    <span className="text-sm text-charcoal/70 group-hover:text-charcoal transition-colors leading-none">
                        {option}
                    </span>
                </label>
            ))}
            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-1 text-xs font-medium text-burgundy hover:text-burgundy-dark transition-colors"
                >
                    {showAll ? 'Show less' : `+ ${options.length - maxVisible} more`}
                </button>
            )}
        </div>
    );
}

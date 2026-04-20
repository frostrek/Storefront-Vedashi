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
                        <div className="h-[15px] w-[15px] rounded-[4px] border border-gray-300/80 bg-white transition-all duration-200 peer-checked:border-[#3d5c3a] peer-checked:bg-white group-hover:border-gray-400" />
                        <svg
                            className="absolute top-[2px] left-[2px] h-[11px] w-[11px] text-[#3d5c3a] opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
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
                    <span className="text-[13px] font-medium text-gray-500 group-hover:text-gray-800 transition-colors leading-none tracking-wide pt-0.5">
                        {option}
                    </span>
                </label>
            ))}
            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center"
                >
                    {showAll ? '- show less' : `+ ${options.length - maxVisible} more`}
                </button>
            )}
        </div>
    );
}

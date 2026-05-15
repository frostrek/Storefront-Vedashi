'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface CheckboxGroupProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    maxVisible?: number;
    searchable?: boolean;
    placeholder?: string;
}

export default function CheckboxGroup({ 
    options, 
    selected, 
    onChange, 
    maxVisible = 5, 
    searchable = false,
    placeholder = "Search..."
}: CheckboxGroupProps) {
    const [showAll, setShowAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchQuery) return options;
        return options.filter(opt => 
            opt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchable, searchQuery]);

    const visibleOptions = (showAll || (searchable && searchQuery)) 
        ? filteredOptions 
        : filteredOptions.slice(0, maxVisible);
    
    const hasMore = !searchQuery && filteredOptions.length > maxVisible;

    const toggle = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter(v => v !== value)
                : [...selected, value]
        );
    };

    return (
        <div className="space-y-3">
            {searchable && (
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholder}
                        className="block w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#91C934] focus:border-[#91C934] transition-all"
                    />
                </div>
            )}

            <div className="space-y-2">
                {visibleOptions.length > 0 ? (
                    visibleOptions.map(option => (
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
                                <div className="h-[15px] w-[15px] rounded-[4px] border border-gray-300/80 bg-white transition-all duration-200 peer-checked:border-[#91C934] peer-checked:bg-white group-hover:border-gray-400" />
                                <svg
                                    className="absolute top-[2px] left-[2px] h-[11px] w-[11px] text-[#91C934] opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
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
                    ))
                ) : (
                    <p className="text-[11px] text-gray-400 italic py-1">No matches found</p>
                )}
            </div>

            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center"
                >
                    {showAll ? '- show less' : `+ ${filteredOptions.length - maxVisible} more`}
                </button>
            )}
        </div>
    );
}

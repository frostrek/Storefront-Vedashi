'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { getSearchSuggestions, SearchSuggestion } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface SearchBarProps {
    /** Current search value (from URL / filter state) */
    value: string;
    /** Called when user commits a search (Enter or suggestion click) */
    onSearch: (query: string) => void;
    /** Visual variant */
    variant?: 'hero' | 'compact';
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function SearchBar({
    value,
    onSearch,
    variant = 'hero',
    placeholder = 'Search products, brands, or categories...',
    className = '',
    autoFocus = false,
}: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value to local (e.g., on clearAll)
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const debouncedInput = useDebounce(inputValue, 300);

    // Fetch suggestions whenever debounced input changes
    useEffect(() => {
        if (debouncedInput.trim().length < 2) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getSearchSuggestions(debouncedInput).then(results => {
            if (!cancelled) {
                setSuggestions(results);
                setSuggestionsOpen(results.length > 0);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [debouncedInput]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setSuggestionsOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const commitSearch = useCallback((q: string) => {
        setSuggestionsOpen(false);
        setActiveIndex(-1);
        onSearch(q.trim());
        inputRef.current?.blur();
    }, [onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!suggestionsOpen) {
            if (e.key === 'Enter') commitSearch(inputValue);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                const s = suggestions[activeIndex];
                setInputValue(s.product_name);
                commitSearch(s.product_name);
            } else {
                commitSearch(inputValue);
            }
        } else if (e.key === 'Escape') {
            setSuggestionsOpen(false);
            setActiveIndex(-1);
        }
    };

    const handleSuggestionClick = (s: SearchSuggestion) => {
        setInputValue(s.product_name);
        commitSearch(s.product_name);
    };

    const handleClear = () => {
        setInputValue('');
        setSuggestions([]);
        setSuggestionsOpen(false);
        onSearch('');
        inputRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        commitSearch(inputValue);
    };

    const isHero = variant === 'hero';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                {/* Search icon */}
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${isHero ? 'h-4 w-4 text-white/60' : 'h-4 w-4 text-gray-400'}`} />

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setSuggestionsOpen(false); }}
                    onFocus={() => { if (suggestions.length > 0) setSuggestionsOpen(true); }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    spellCheck={false}
                    className={
                        isHero
                            ? 'w-full px-5 py-3 pl-12 pr-20 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all'
                            : 'w-full px-4 py-2.5 pl-10 pr-16 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/20 focus:border-[#3d5c3a] transition-all'
                    }
                    aria-label="Search products"
                    aria-autocomplete="list"
                    aria-expanded={suggestionsOpen}
                    aria-controls="search-suggestions"
                    role="combobox"
                />

                {/* Right side: loader / clear / submit */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {loading && <Loader2 className={`h-4 w-4 animate-spin ${isHero ? 'text-white/60' : 'text-[#3d5c3a]'}`} />}
                    {inputValue && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className={`p-1 rounded-full transition-colors cursor-pointer ${isHero ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            aria-label="Clear search"
                        >
                            <X className={`h-3.5 w-3.5 ${isHero ? 'text-white/60' : 'text-gray-400'}`} />
                        </button>
                    )}
                    {inputValue && (
                        <button
                            type="submit"
                            className={`text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer transition-colors ${isHero ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#3d5c3a] text-white hover:bg-[#2d4a2a]'}`}
                            aria-label="Search"
                        >
                            Go
                        </button>
                    )}
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {suggestionsOpen && suggestions.length > 0 && (
                <div
                    id="search-suggestions"
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                    <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-[#3d5c3a]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Suggestions</span>
                    </div>
                    <ul className="max-h-80 overflow-y-auto">
                        {suggestions.map((s, i) => (
                            <li
                                key={s.product_id}
                                role="option"
                                aria-selected={i === activeIndex}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${i === activeIndex ? 'bg-[#3d5c3a]/5' : 'hover:bg-gray-50'}`}
                                onMouseEnter={() => setActiveIndex(i)}
                                onMouseDown={e => e.preventDefault()} // Prevent blur before click
                                onClick={() => handleSuggestionClick(s)}
                            >
                                {/* Thumbnail */}
                                <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    {s.thumbnail_url ? (
                                        <img
                                            src={s.thumbnail_url}
                                            alt={s.product_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Search className="h-4 w-4 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{s.product_name}</p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {s.brand && <span>{s.brand}</span>}
                                        {s.brand && s.category && <span className="mx-1">·</span>}
                                        {s.category && <span>{s.category}</span>}
                                    </p>
                                </div>
                                {/* Price */}
                                {s.price != null && (
                                    <span className="text-sm font-bold text-[#3d5c3a] flex-shrink-0">
                                        ₹{Number(s.price).toLocaleString('en-IN')}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
                        <button
                            onClick={() => commitSearch(inputValue)}
                            className="w-full text-xs font-semibold text-[#3d5c3a] hover:text-[#2d4a2a] transition-colors cursor-pointer text-center"
                        >
                            See all results for &ldquo;{inputValue}&rdquo; →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

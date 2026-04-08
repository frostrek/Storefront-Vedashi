'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { searchAutocomplete, type SearchSuggestion } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';

interface SearchAutocompleteProps {
    /** Called when the sea rch overlay should close (e.g. mobile) */
    onClose?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Additional wrap per classes */
    className?: string;
} 

export default function SearchAutocomplete({
    onClose,
    placeholder = 'Search products…',
    className = '',
}: SearchAutocompleteProps) {
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // ── Debounced fetch ────────────────────────────────────────
    const fetchSuggestions = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const results = await searchAutocomplete(term);
            setSuggestions(results);
            if (results.length === 0) {
                import('@/lib/analytics/gtag').then(({ trackEvent }) => {
                    trackEvent('zero_results_search', { search_term: term });
                });
            }
        } catch {
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(query);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchSuggestions]);

    // ── Click outside to close ─────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Static Storefront Pages ──
    const storePages = [
        { title: 'Home', path: '/' },
        { title: 'All Products', path: '/products' },
        { title: 'Categories', path: '/categories' },
        { title: 'About Us', path: '/about' },
        { title: 'Contact Support', path: '/contact' },
    ];

    const matchedPages = query.trim().length >= 2
        ? storePages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
        : [];

    const totalItems = matchedPages.length + suggestions.length;
    const isShowingViewAll = suggestions.length > 0;
    const maxIndex = isShowingViewAll ? totalItems : totalItems - 1;

    // ── Navigate to product, page, or search page ─────────────────────
    const goToProduct = (id: string) => {
        setIsOpen(false);
        setQuery('');
        onClose?.();
        router.push(`/products/${id}`);
    };

    const goToPage = (path: string) => {
        setIsOpen(false);
        setQuery('');
        onClose?.();
        router.push(path);
    };

    const goToSearch = () => {
        if (!query.trim()) return;
        setIsOpen(false);
        onClose?.();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    };

    // ── Keyboard navigation ────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen && e.key !== 'Enter') return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => prev < maxIndex ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => prev > 0 ? prev - 1 : maxIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0) {
                    if (activeIndex < matchedPages.length) {
                        goToPage(matchedPages[activeIndex].path);
                    } else if (activeIndex < totalItems) {
                        goToProduct(suggestions[activeIndex - matchedPages.length].product_id);
                    } else if (isShowingViewAll) {
                        goToSearch();
                    }
                } else {
                    goToSearch();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setActiveIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };



    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* ─── Search Input ─── */}
            <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setActiveIndex(-1);
                        if (e.target.value.trim().length >= 2 && !isOpen) {
                            setIsOpen(true);
                        }
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0 || query.trim().length >= 2) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="
            w-full pl-12 pr-10 py-2.5 rounded-full
            bg-gray-100 border border-gray-200
            text-base text-gray-800 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[#4b0f1a]/30 focus:border-[#4b0f1a]/40
            transition-all duration-200
          "
                />
                {/* Clear / Loading indicator */}
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-4 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <X className="h-5 w-5" />
                        )}
                    </button>
                )}
            </div>

            {/* ─── Dropdown Panel ─── */}
            {isOpen && query.trim().length >= 2 && (
                <div className="
          absolute top-full left-0 right-0 mt-1.5 z-[300]
          bg-white rounded-xl shadow-2xl border border-gray-100
          max-h-[420px] overflow-y-auto
          animate-in fade-in slide-in-from-top-1 duration-200
        ">
                    {/* Pages Section */}
                    {matchedPages.length > 0 && (
                        <div className="py-1">
                            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                                Pages
                            </p>
                            {matchedPages.map((page, index) => (
                                <button
                                    key={page.path}
                                    onClick={() => goToPage(page.path)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left
                    transition-colors duration-100
                    ${activeIndex === index ? 'bg-[#fdf6ee] text-[#4b0f1a]' : 'hover:bg-gray-50 text-gray-700'}
                  `}
                                >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Search className="h-3.5 w-3.5 opacity-40" />
                                    </div>
                                    <span className="text-sm font-medium">{page.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Products Section */}
                    {(suggestions.length > 0 || isLoading) && (
                        <div className="py-1 border-t border-gray-100">
                            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                                Products
                            </p>
                            {isLoading && suggestions.length === 0 && (
                                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching...
                                </div>
                            )}
                            {suggestions.map((item, index) => {
                                const globalIndex = index + matchedPages.length;
                                return (
                                    <button
                                        key={item.product_id}
                                        onClick={() => goToProduct(item.product_id)}
                                        onMouseEnter={() => setActiveIndex(globalIndex)}
                                        className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left
                      transition-colors duration-100 border-b border-gray-50 last:border-b-0
                      ${activeIndex === globalIndex ? 'bg-[#fdf6ee]' : 'hover:bg-gray-50'}
                    `}
                                    >
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                            {item.thumbnail_url ? (
                                                <img
                                                    src={item.thumbnail_url}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Search className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {[item.brand, item.category].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        {item.price != null && (
                                            <span className="flex-shrink-0 text-sm font-semibold text-[#4b0f1a]">
                                                {formatPrice(item.price)}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && matchedPages.length === 0 && suggestions.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                            No results found for &ldquo;{query}&rdquo;
                        </div>
                    )}

                    {/* View All Results Link */}
                    {isShowingViewAll && (
                        <button
                            onClick={goToSearch}
                            onMouseEnter={() => setActiveIndex(totalItems)}
                            className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100
                text-sm font-medium transition-colors duration-100
                ${activeIndex === totalItems
                                    ? 'bg-[#4b0f1a] text-white'
                                    : 'bg-[#fdf6ee] text-[#4b0f1a] hover:bg-[#4b0f1a] hover:text-white'
                                }
                rounded-b-xl
              `}
                        >
                            <Search className="h-3.5 w-3.5" />
                            View all results for &ldquo;{query}&rdquo;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

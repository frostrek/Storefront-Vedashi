'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { RU_DICTIONARY } from '@/content/ru';
import { searchAutocomplete, type SearchSuggestion } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { buildPath, getCountryFromPathname } from '@/lib/currency';

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
    placeholder = `${RU_DICTIONARY.common.search}...`,
    className = '',
}: SearchAutocompleteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const country = (params.country as string) || 'us';
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
 
    // ── Scroll lock when open (mobile) ────────────────────────
    useEffect(() => {
        if (isOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // ── Static Storefront Pages ──
    const storePages = [
        { title: RU_DICTIONARY.search.pageTitles.home, path: buildPath(country, '/') },
        { title: RU_DICTIONARY.search.pageTitles.allProducts, path: buildPath(country, `/products`) },
        { title: RU_DICTIONARY.search.pageTitles.categories, path: buildPath(country, `/categories`) },
        { title: RU_DICTIONARY.search.pageTitles.aboutUs, path: buildPath(country, `/about`) },
        { title: RU_DICTIONARY.search.pageTitles.contactSupport, path: buildPath(country, `/contact`) },
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
        router.push(buildPath(country, `/products/${id}`));
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
        router.push(buildPath(country, `/search?q=${encodeURIComponent(query.trim())}`));
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
                        const val = e.target.value;
                        setQuery(val);
                        setActiveIndex(-1);
                        if (val.trim().length >= 2 && !isOpen) {
                            setIsOpen(true);
                        }
                        // If they clear the search string manually while on the search page, send them back to home
                        if (val.trim().length === 0 && pathname.endsWith('/search')) {
                            router.push('/');
                        }
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0 || query.trim().length >= 2) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="
            w-full pl-11 pr-10 py-[10px] rounded-full
            bg-gray-100 border border-gray-300
            text-sm text-gray-800 placeholder-gray-00
            focus:outline-none focus:ring-2 focus:ring-[#e6e3e4]/30 focus:border-[#4b0f1a]/40
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
                            if (pathname.endsWith('/search')) {
                                router.push('/');
                            }
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
          fixed md:absolute top-[56px] md:top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 
          w-[96vw] md:w-full z-[300]
          bg-white rounded-b-2xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] border border-gray-100
          max-h-[55vh] md:max-h-[420px] overflow-y-auto
          animate-in fade-in slide-in-from-top-1 duration-200
        ">
                    {/* Pages Section */}
                    {matchedPages.length > 0 && (
                        <div className="py-1">
                            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                                {RU_DICTIONARY.search.pages}
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
                                {RU_DICTIONARY.search.products}
                            </p>
                            {isLoading && suggestions.length === 0 && (
                                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {RU_DICTIONARY.search.searching}
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
                      w-full flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 text-left
                      transition-colors duration-100 border-b border-gray-50 last:border-b-0
                      ${activeIndex === globalIndex ? 'bg-[#fdf6ee]' : 'hover:bg-gray-50'}
                    `}
                                    >
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 overflow-hidden">
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
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight mb-0.5">
                                                {item.product_name}
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 truncate uppercase tracking-wider font-medium">
                                                {[item.brand, item.category].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
 
                                        {/* Price */}
                                        {item.price != null && (
                                            <span className="flex-shrink-0 text-[13px] sm:text-sm font-black text-[#4b0f1a] bg-gray-50 px-1.5 py-0.5 rounded-md">
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
                            {RU_DICTIONARY.search.noResults} &ldquo;{query}&rdquo;
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
                            {RU_DICTIONARY.search.viewAllResults} &ldquo;{query}&rdquo;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

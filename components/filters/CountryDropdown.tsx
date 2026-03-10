'use client';

import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { COUNTRIES, getFlagByName } from '@/lib/countries';

interface CountryDropdownProps {
    options: string[];
    selected: string;
    onChange: (value: string) => void;
}

export default function CountryDropdown({ options, selected, onChange }: CountryDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [listOpen, setListOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close list on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setListOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus input when list opens
    useEffect(() => {
        if (listOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [listOpen]);

    const filtered = search
        ? options.filter(c => c.toLowerCase().includes(search.toLowerCase()))
        : options;

    return (
        <div className="py-4 border-b border-light-border/60" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="flex w-full items-center justify-between group"
                aria-expanded={open}
            >
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/70 group-hover:text-burgundy transition-colors">
                    Country
                </span>
                {open
                    ? <ChevronUp className="h-4 w-4 text-warm-gray/60 group-hover:text-burgundy transition-colors" />
                    : <ChevronDown className="h-4 w-4 text-warm-gray/60 group-hover:text-burgundy transition-colors" />
                }
            </button>

            {open && (
                <div className="mt-3 animate-fade-in relative" style={{ animation: 'fadeInDown 0.18s ease' }}>
                    {/* Trigger — shows selected country or search input */}
                    <div
                        className={`
                            relative flex items-center w-full rounded-lg border px-3.5 py-2.5 text-sm cursor-pointer
                            bg-white transition-all duration-200 ease-in-out
                            ${selected
                                ? 'border-burgundy/50 ring-1 ring-burgundy/10'
                                : 'border-light-border'
                            }
                            hover:border-burgundy/30
                            focus-within:border-burgundy focus-within:ring-2 focus-within:ring-burgundy/10
                        `}
                        onClick={() => { setListOpen(true); setSearch(''); }}
                    >
                        {listOpen ? (
                            <>
                                <Search className="h-4 w-4 text-warm-gray/50 mr-2 flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-transparent outline-none text-charcoal placeholder:text-warm-gray/50 text-sm"
                                    placeholder="Type to search..."
                                    onClick={e => e.stopPropagation()}
                                />
                            </>
                        ) : (
                            <>
                                {selected ? (
                                    <span className="flex items-center gap-2 text-charcoal font-medium flex-1 truncate">
                                        <span className="text-base leading-none">{getFlagByName(selected)}</span>
                                        {selected}
                                    </span>
                                ) : (
                                    <span className="text-warm-gray/70 flex-1">🌍 All Countries</span>
                                )}
                            </>
                        )}
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {selected && !listOpen && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onChange(''); }}
                                    className="p-0.5 rounded hover:bg-cream transition-colors"
                                >
                                    <X className="h-3.5 w-3.5 text-warm-gray/60 hover:text-burgundy" />
                                </button>
                            )}
                            <ChevronDown className={`h-4 w-4 text-warm-gray/60 transition-transform duration-200 ${listOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* Dropdown list */}
                    {listOpen && (
                        <div
                            className="absolute z-50 mt-1 w-full rounded-xl border border-light-border bg-white shadow-xl overflow-hidden"
                            style={{ maxHeight: '260px' }}
                        >
                            <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
                                {/* "All Countries" option */}
                                <button
                                    type="button"
                                    onClick={() => { onChange(''); setListOpen(false); setSearch(''); }}
                                    className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-burgundy/5 ${!selected ? 'bg-burgundy/[0.06] text-burgundy font-medium' : 'text-charcoal'
                                        }`}
                                >
                                    <span className="text-base leading-none">🌍</span>
                                    All Countries
                                </button>
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-5 text-sm text-warm-gray/60 text-center">
                                        No countries found
                                    </div>
                                ) : (
                                    filtered.map(country => (
                                        <button
                                            key={country}
                                            type="button"
                                            onClick={() => { onChange(country); setListOpen(false); setSearch(''); }}
                                            className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-burgundy/5 ${selected === country
                                                    ? 'bg-burgundy/[0.06] text-burgundy font-medium'
                                                    : 'text-charcoal'
                                                }`}
                                        >
                                            <span className="text-base leading-none flex-shrink-0">{getFlagByName(country)}</span>
                                            <span className="truncate">{country}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Active country badge (shown when list is closed) */}
                    {selected && !listOpen && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-base leading-none">{getFlagByName(selected)}</span>
                            <span className="text-xs font-medium text-burgundy">{selected}</span>
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="ml-auto text-[11px] text-warm-gray/60 hover:text-burgundy transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

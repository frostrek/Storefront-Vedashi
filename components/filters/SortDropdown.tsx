'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SortOption {
    label: string;
    value: string;
}

interface SortDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options?: SortOption[];
}

const DEFAULT_OPTIONS: SortOption[] = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'newest' },
    { label: 'Best Selling', value: 'best_selling' },
    { label: 'Highest Rated', value: 'rating_desc' },
    { label: 'Highest Discount', value: 'discount_desc' },
    { label: 'Name: A–Z', value: 'name_asc' },
    { label: 'Name: Z–A', value: 'name_desc' },
];

export default function SortDropdown({ value, onChange, options = DEFAULT_OPTIONS }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard accessibility
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-flex items-center gap-2" ref={containerRef}>
            <span className="text-sm text-gray-500 font-semibold sm:inline-block">
                Sort by:
            </span>

            <div className="relative min-w-[200px]">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    className={`
                        w-full flex items-center justify-between gap-3 px-4 py-2.5
                        bg-cream/50 backdrop-blur-sm border rounded-xl 
                        text-sm font-medium transition-all duration-300
                        ${isOpen
                            ? 'border-herbal-green ring-4 ring-herbal-green/5 shadow-sm'
                            : 'border-light-border hover:border-herbal-green/40 hover:bg-cream'
                        }
                        text-charcoal group
                    `}
                >
                    <span className="truncate group-hover:text-herbal-green transition-colors">
                        {selectedOption.label}
                    </span>
                    <ChevronDown
                        className={`h-4 w-4 text-warm-gray transition-transform duration-300 ${isOpen ? 'rotate-180 text-herbal-green' : 'group-hover:text-herbal-green'}`}
                    />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            role="listbox"
                            className="
                                absolute z-50 w-full mt-0 py-2
                                bg-white border border-light-border/60 
                                rounded-2xl shadow-xl shadow-herbal-green/5
                                backdrop-blur-xl overflow-hidden
                            "
                        >
                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                {options.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <li
                                            key={option.value}
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                relative flex items-center justify-between px-4 py-2.5 
                                                cursor-pointer text-sm transition-colors
                                                ${isSelected
                                                    ? 'bg-herbal-green/5 text-herbal-green font-semibold'
                                                    : 'text-charcoal hover:bg-cream hover:text-herbal-green'
                                                }
                                            `}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </motion.div>
                                            )}
                                        </li>
                                    );
                                })}
                            </div>
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(61, 92, 58, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(61, 92, 58, 0.2);
                }
            `}</style>
        </div>
    );
}

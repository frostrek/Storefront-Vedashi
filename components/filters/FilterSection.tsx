'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSectionProps {
    title: string;
    defaultOpen?: boolean;
    scrollable?: boolean;
    scrollHeight?: string;
    children: React.ReactNode;
}

export default function FilterSection({
    title,
    defaultOpen = true,
    scrollable = false,
    scrollHeight = '220px',
    children,
}: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-light-border/60 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-3 text-left group"
            >
                <span className="text-[11.5px] font-bold uppercase tracking-[0.15em] text-gray-700 group-hover:text-gray-900 transition-colors">
                    {title}
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 pb-5' : 'max-h-0 opacity-0 overflow-hidden'}`}
            >
                {scrollable ? (
                    <>
                        <style>{`
                            .filter-brand-scroll::-webkit-scrollbar {
                                width: 3px;
                            }
                            .filter-brand-scroll::-webkit-scrollbar-track {
                                background: transparent;
                                margin: 4px 0;
                            }
                            .filter-brand-scroll::-webkit-scrollbar-thumb {
                                background: #e5e7eb;
                                border-radius: 999px;
                            }
                            .filter-brand-scroll:hover::-webkit-scrollbar-thumb {
                                background: #9ca3af;
                            }
                            .filter-brand-scroll {
                                scrollbar-width: thin;
                                scrollbar-color: #e5e7eb transparent;
                            }
                        `}</style>
                        <div
                            className="filter-brand-scroll overflow-y-auto pr-2"
                            style={{ maxHeight: scrollHeight }}
                        >
                            {children}
                        </div>
                    </>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

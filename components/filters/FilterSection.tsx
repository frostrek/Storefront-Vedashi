'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export default function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-light-border/60 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-4 text-left group"
            >
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/70 group-hover:text-charcoal transition-colors">
                    {title}
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 text-warm-gray transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 pb-5' : 'max-h-0 opacity-0'}`}
            >
                {children}
            </div>
        </div>
    );
}

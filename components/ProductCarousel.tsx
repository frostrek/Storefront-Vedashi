'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
    title: string;
    icon?: React.ReactNode;
    products: Product[];
    loading?: boolean;
    idPrefix: string;
}

export default function ProductCarousel({ title, icon, products, loading = false, idPrefix }: ProductCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const threshold = 4;
        setCanScrollLeft(el.scrollLeft > threshold);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        // Initial check after render
        const timer = setTimeout(updateScrollButtons, 100);

        el.addEventListener('scroll', updateScrollButtons, { passive: true });
        window.addEventListener('resize', updateScrollButtons);

        return () => {
            clearTimeout(timer);
            el.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [products, updateScrollButtons]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;

        // Scroll by roughly one card width + gap
        const cardWidth = el.querySelector<HTMLElement>('[data-carousel-card]')?.clientWidth || 280;
        const scrollAmount = cardWidth + 16; // card + gap

        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    // Hide section if 0 products
    if (!loading && products.length === 0) return null;

    return (
        <div className="mt-16 border-t border-gray-100 pt-16" id={`${idPrefix}-section`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3" id={`${idPrefix}-heading`}>
                    {icon}
                    {title}
                </h2>

                {/* Desktop arrow controls */}
                {!loading && products.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className={`
                                w-10 h-10 rounded-full border-2 flex items-center justify-center
                                transition-all duration-200
                                ${canScrollLeft
                                    ? 'border-[#3d5c3a]/20 text-[#3d5c3a] hover:bg-[#3d5c3a] hover:text-white hover:border-[#3d5c3a] cursor-pointer shadow-sm hover:shadow-md'
                                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                                }
                            `}
                            aria-label="Scroll left"
                            id={`${idPrefix}-scroll-left`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className={`
                                w-10 h-10 rounded-full border-2 flex items-center justify-center
                                transition-all duration-200
                                ${canScrollRight
                                    ? 'border-[#3d5c3a]/20 text-[#3d5c3a] hover:bg-[#3d5c3a] hover:text-white hover:border-[#3d5c3a] cursor-pointer shadow-sm hover:shadow-md'
                                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                                }
                            `}
                            aria-label="Scroll right"
                            id={`${idPrefix}-scroll-right`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Scroll container */}
            {loading ? (
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 overflow-hidden rounded-xl border border-light-border bg-white"
                            style={{
                                width: 'calc((100% - 48px) / 4)',
                                minWidth: '220px',
                            }}
                        >
                            <div style={{ aspectRatio: '1/1' }} className="animate-shimmer" />
                            <div className="space-y-3 p-4">
                                <div className="h-4 w-3/4 rounded animate-shimmer" />
                                <div className="h-3 w-1/2 rounded animate-shimmer" />
                                <div className="h-5 w-1/3 rounded animate-shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="relative">
                    {/* Left gradient fade */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FDFCFB] to-transparent z-10 pointer-events-none" />
                    )}

                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                        style={{
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        {products.map(p => (
                            <div
                                key={p.product_id}
                                data-carousel-card
                                className="flex-shrink-0"
                                style={{
                                    scrollSnapAlign: 'start',
                                    width: 'var(--similar-card-width, calc((100% - 48px) / 4))',
                                    minWidth: '220px',
                                }}
                            >
                                <ProductCard product={p} />
                            </div>
                        ))}
                    </div>

                    {/* Right gradient fade */}
                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FDFCFB] to-transparent z-10 pointer-events-none" />
                    )}
                </div>
            )}
        </div>
    );
}

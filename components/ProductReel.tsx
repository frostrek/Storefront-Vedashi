'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { FilteredProduct } from '@/types';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface ProductReelProps {
    products: any[];
    title?: string;
    subtitle?: string;
    loading?: boolean;
    viewAllLink?: string;
    viewAllText?: string;
}

export default function ProductReel({ products, title, subtitle, loading, viewAllLink, viewAllText }: ProductReelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        const ref = scrollRef.current;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    checkScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        if (ref) {
            ref.addEventListener('scroll', handleScroll, { passive: true });
            checkScroll();
            // Also check on resize
            window.addEventListener('resize', handleScroll, { passive: true });
        }
        return () => {
            if (ref) ref.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [products]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!loading && products.length === 0) return null;

    return (
        <div className="relative group/reel py-8">
            <div className="flex flex-row items-end justify-between mb-8 px-4 sm:px-6 lg:px-8 relative">
                <div className="text-left">
                    {title && <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{title}</h2>}
                    {subtitle && <p className="text-gray-500 font-medium italic">{subtitle}</p>}
                </div>

                {viewAllLink && (
                    <div className="flex-shrink-0 hidden sm:block pb-1">
                        <Link href={viewAllLink} className="group flex items-center gap-2 text-sm font-bold text-[#FF0000] hover:text-[#CC0000] transition-colors">
                            {viewAllText || 'Explore All'}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Mobile View All Link */}
            {viewAllLink && (
                <div className="sm:hidden px-4 mb-6">
                    <Link href={viewAllLink} className="group flex items-center gap-2 text-sm font-bold text-[#FF0000] hover:text-[#CC0000] transition-colors">
                        {viewAllText || 'Explore All'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            )}

            <div className="relative px-4 sm:px-6 lg:px-8">
                {/* Navigation Arrows */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 shadow-xl border border-gray-100 text-[#91CA35] hover:bg-[#91CA35] hover:text-white transition-all duration-300 backdrop-blur-sm group-hover/reel:scale-110"
                        aria-label="Scroll left"
                        suppressHydrationWarning
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                )}
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 shadow-xl border border-gray-100 text-[#91CA35] hover:bg-[#91CA35] hover:text-white transition-all duration-300 backdrop-blur-sm group-hover/reel:scale-110"
                        aria-label="Scroll right"
                        suppressHydrationWarning
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                )}

                {/* The Reel Container */}
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto hide-scrollbar gap-6 pb-8 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="min-w-[200px] sm:min-w-[240px] aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
                        ))
                    ) : (
                        products.map((product, i) => (
                            <div
                                key={product.product_id}
                                className="min-w-[200px] sm:min-w-[240px] snap-center"
                            >
                                <ProductCard
                                    product={product}
                                    listName={title || 'Product Reel'}
                                    listIndex={i + 1}
                                />
                            </div>
                        ))
                    )}
                    {/* Spacer for right padding in scroll */}
                    <div className="min-w-[20px] h-full" />
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { getProductDetails, getProduct } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Clock } from 'lucide-react';

interface RecentlyViewedProductsProps {
    /** Current product ID to exclude from the list */
    currentProductId: string;
}

/**
 * Displays a grid of recently viewed products (stored in localStorage).
 * Fetches full product data from the API for each stored ID.
 * Excludes the current product and shows up to 8 items.
 */
export default function RecentlyViewedProducts({ currentProductId }: RecentlyViewedProductsProps) {
    const { getProductIds } = useRecentlyViewed();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchRecent() {
            const ids = getProductIds(currentProductId).slice(0, 8);
            if (ids.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                const results = await Promise.all(ids.map(async (id) => {
                    let data = await getProductDetails(id);
                    if (!data) {
                        const simple = await getProduct(id);
                        if (simple) data = simple as any;
                    }
                    return data;
                }));
                if (!cancelled) {
                    const validProducts = results.filter((p): p is Product => p != null);
                    const uniqueProducts = Array.from(
                        new Map(validProducts.map(p => [p.product_id, p])).values()
                    );
                    setProducts(uniqueProducts);
                }
            } catch (err) {
                console.error('[RecentlyViewed] Failed to fetch:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchRecent();
        return () => { cancelled = true; };
    }, [currentProductId, getProductIds]);

    // Don't render anything if no recently viewed products or still loading with nothing
    if (!loading && products.length === 0) return null;
    if (loading) return null; // Avoid layout shift — only show when data is ready

    return (
        <div className="mt-16 border-t border-light-border pt-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-3xl font-bold text-charcoal flex items-center gap-3">
                    <Clock className="h-6 w-6 text-burgundy" />
                    Recently Viewed
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((p) => (
                    <ProductCard key={p.product_id} product={p} />
                ))}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { getProductDetails, getProduct } from '@/lib/api';
import { Product } from '@/types';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Clock } from 'lucide-react';
import ProductCarousel from '@/components/ProductCarousel';

interface RecentlyViewedProductsProps {
    /** Current product ID to exclude from the list */
    currentProductId: string;
}

/**
 * Displays a grid of recently viewed products (stored in localStorage).
 * Fetches full product data from the API for each stored ID.
 * Excludes the current product and shows up to 12 items.
 */
export default function RecentlyViewedProducts({ currentProductId }: RecentlyViewedProductsProps) {
    const { getProductIds } = useRecentlyViewed();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchRecent() {
            const ids = getProductIds(currentProductId).slice(0, 12);
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

    return (
        <ProductCarousel
            title="Recently Viewed"
            icon={<Clock className="h-6 w-6 text-burgundy" />}
            products={products}
            loading={loading}
            idPrefix="recently-viewed"
        />
    );
}

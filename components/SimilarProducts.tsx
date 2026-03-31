'use client';

import { useState, useEffect } from 'react';
import { getSimilarProducts } from '@/lib/api';
import { Product } from '@/types';
import { Sparkles } from 'lucide-react';
import ProductCarousel from '@/components/ProductCarousel';

interface SimilarProductsProps {
    productId: string;
}

export default function SimilarProducts({ productId }: SimilarProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getSimilarProducts(productId, 12)
            .then(data => {
                if (!cancelled) {
                    setProducts(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [productId]);

    return (
        <ProductCarousel
            title="Similar Products"
            icon={<Sparkles className="h-6 w-6 text-[#3d5c3a]" />}
            products={products}
            loading={loading}
            idPrefix="similar-products"
        />
    );
}


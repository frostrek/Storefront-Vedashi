'use client';

import { useState, useEffect } from 'react';
import { RU_DICTIONARY } from '@/content/ru';

import { getSimilarProducts } from '@/lib/api';
import { Product } from '@/types';
import { Sparkles } from 'lucide-react';
import ProductReel from '@/components/ProductReel';

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
        <ProductReel
            title={RU_DICTIONARY.productPage.similarProducts}
            products={products}
            loading={loading}
        />
    );
}


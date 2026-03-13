'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, Package } from 'lucide-react';
import { getCollectionBySlug, StorefrontCollectionDetail } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { SkeletonProductGrid } from '@/components/Skeleton';

export default function CollectionPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [collection, setCollection] = useState<StorefrontCollectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        getCollectionBySlug(slug, LIMIT, 0).then(data => {
            setCollection(data);
            setOffset(LIMIT);
            setLoading(false);
        });
    }, [slug]);

    const loadMore = async () => {
        if (!collection || loadingMore) return;
        setLoadingMore(true);
        const next = await getCollectionBySlug(slug, LIMIT, offset);
        if (next && next.products.length > 0) {
            setCollection(prev => prev ? {
                ...prev,
                products: [...prev.products, ...next.products],
            } : prev);
            setOffset(prev => prev + LIMIT);
        }
        setLoadingMore(false);
    };

    if (loading) {
        return (
            <div className="bg-cream min-h-screen">
                <div className="mx-auto max-w-7xl px-4 py-12">
                    {/* Skeleton hero */}
                    <div className="animate-pulse mb-12">
                        <div className="h-6 w-32 bg-cream-dark rounded mb-6" />
                        <div className="h-10 w-64 bg-cream-dark rounded mb-3" />
                        <div className="h-5 w-96 bg-cream-dark/60 rounded" />
                    </div>
                    <SkeletonProductGrid count={8} />
                </div>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="bg-cream min-h-screen">
                <div className="mx-auto max-w-7xl px-4 py-20 text-center">
                    <Layers className="mx-auto h-16 w-16 text-warm-gray/30 mb-4" />
                    <h1 className="font-serif text-2xl font-bold text-charcoal">Collection Not Found</h1>
                    <p className="mt-2 text-warm-gray">This collection may have ended or does not exist.</p>
                    <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-burgundy hover:text-burgundy-dark transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const hasMore = collection.products.length < collection.total_products;

    return (
        <div className="bg-cream min-h-screen">
            {/* Hero */}
            <section className="relative overflow-hidden">
                {collection.image_url ? (
                    <div className="absolute inset-0">
                        <img src={collection.image_url} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-cream" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-cream" />
                )}

                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
                    <Link
                        href="/"
                        className={`inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${collection.image_url ? 'text-white/80 hover:text-white' : 'text-burgundy hover:text-burgundy-dark'
                            }`}
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>

                    <h1 className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-bold ${collection.image_url ? 'text-white' : 'text-vedic-gold'
                        }`}>
                        {collection.name}
                    </h1>

                    {collection.description && (
                        <p className={`mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg ${collection.image_url ? 'text-white/80' : 'text-warm-gray'
                            }`}>
                            {collection.description}
                        </p>
                    )}

                    <div className={`mt-4 flex items-center gap-2 text-sm ${collection.image_url ? 'text-white/60' : 'text-warm-gray'
                        }`}>
                        <Package className="h-4 w-4" />
                        {collection.total_products} product{collection.total_products !== 1 ? 's' : ''}
                    </div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
                {collection.products.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                            {collection.products.map(product => (
                                <ProductCard key={product.product_id} product={product} />
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="mt-10 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="rounded-xl bg-burgundy px-8 py-3 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Loading...
                                        </span>
                                    ) : (
                                        `Load More (${collection.total_products - collection.products.length} remaining)`
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-2xl border border-light-border bg-white py-20 text-center">
                        <Package className="mx-auto h-12 w-12 text-warm-gray/30 mb-3" />
                        <p className="font-serif text-lg text-charcoal">No products in this collection yet</p>
                        <p className="mt-2 text-sm text-warm-gray">Check back soon for new additions</p>
                    </div>
                )}
            </section>
        </div>
    );
}

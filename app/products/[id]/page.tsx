'use client';

import { useState, useEffect, use, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getProduct, getProductDetails, getRelatedProducts, formatVND } from '@/lib/api';
import { Product, ProductWithDetails } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { SkeletonLine, SkeletonReviewSection, SkeletonProductRow } from '@/components/Skeleton';
import { Heart, ShoppingCart, Minus, Plus, Star, Truck, RotateCcw, ChevronRight, AlertTriangle, Sparkles, Info } from 'lucide-react';
import ProductImageGallery from '@/components/gallery/ProductImageGallery';
import LazySection from '@/components/lazy/LazySection';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

// Dynamic imports for below-fold sections
const ReviewSection = dynamic(
    () => import('@/components/reviews/ReviewSection'),
    { ssr: false }
);

const RecentlyViewedProducts = dynamic(
    () => import('@/components/RecentlyViewedProducts'),
    { ssr: false }
);

interface Props {
    params: Promise<{ id: string }>;
}

/** Lazy-loaded related products section with deferred API call */
function LazyRelatedProducts({ productId, type, title, icon }: {
    productId: string;
    type: string;
    title: string;
    icon?: React.ReactNode;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getRelatedProducts(productId, type, 4).then(data => {
            if (!cancelled) {
                setProducts(data);
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [productId, type]);

    if (!loading && products.length === 0) return null;

    return (
        <div className="mt-16 border-t border-light-border pt-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-3xl font-bold text-charcoal flex items-center gap-3">
                    {icon}
                    {title}
                </h2>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-light-border bg-white">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(p => (
                        <ProductCard key={p.product_id} product={p} />
                    ))}
                </div>
            )}
        </div>
    );
}


function ProductDetailContent({ params }: Props) {
    const { id } = use(params);

    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);


    // ✅ Variant state
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<number | null>(null);
    const [localQty, setLocalQty] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        setLocalQty(null);
    }, [selectedVariant?.variant_id]);

    const { addItem, items, updateQuantity, removeItem, loading: cartLoading } = useCart();
    const { isInWishlist, toggleItem } = useWishlist();
    const { addProduct: trackRecentlyViewed } = useRecentlyViewed();

    // Only fetch product details and variants (above-fold data)
    // Related products and reviews are deferred to their lazy sections
    useEffect(() => {
        const load = async () => {
            setLoading(true);

            let data = await getProductDetails(id);
            if (!data) {
                const simple = await getProduct(id);
                if (simple) data = simple as ProductWithDetails;
            }

            setProduct(data);

            // ✅ store variants with size/pack defaults
            if (data?.variants?.length) {
                const vs = data.variants;
                setVariants(vs);

                // Pick the default variant (is_default=true), falling back to first
                const defaultV = vs.find((v: any) => v.is_default === true) || vs[0];
                const firstSize = defaultV?.size_label ?? null;
                const firstPack = defaultV?.pack_quantity ?? 1;
                setSelectedSize(firstSize);
                setSelectedPack(firstPack);
                setSelectedVariant(defaultV);
            }

            setLoading(false);

            // Track this product as recently viewed
            if (data) trackRecentlyViewed(id);
        };

        load();
    }, [id]);

    // ── Express checkout: auto-trigger Buy Now after login redirect ──
    useEffect(() => {
        if (searchParams.get('buyNow') === 'true' && isAuthenticated && product && !loading) {
            // Clear the buyNow param from URL without reload
            const url = new URL(window.location.href);
            url.searchParams.delete('buyNow');
            window.history.replaceState({}, '', url.pathname);

            // Store the Buy Now item and redirect to checkout
            const timer = setTimeout(() => {
                const buyNowItem = {
                    product_id: product.product_id,
                    product_name: product.product_name,
                    variant_id: selectedVariant?.variant_id || null,
                    size_label: selectedVariant?.size_label || '',
                    quantity: displayQuantity ?? 1,
                    unit_price: Number(selectedVariant?.price ?? product.price ?? 0),
                    image_url: (product as any).thumbnail_url || '',
                };
                sessionStorage.setItem('ksp_buy_now_item', JSON.stringify(buyNowItem));
                router.push('/checkout?buyNow=true');
            }, 300);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, isAuthenticated, product, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-cream">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="grid gap-10 lg:grid-cols-2">
                        <div className="aspect-square rounded-2xl animate-shimmer" />
                        <div className="space-y-4">
                            <SkeletonLine className="h-6 w-1/3" />
                            <SkeletonLine className="h-8 w-2/3" />
                            <SkeletonLine className="h-6 w-1/4" />
                            <SkeletonLine className="h-20 w-full" />
                            <SkeletonLine className="h-12 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!loading && !product) return notFound();
    if (!product) return null;

    const wishlisted = isInWishlist(product.product_id);

    const displayPrice = selectedVariant?.price ?? product.price ??
        Math.floor(Math.random() * 500000 + 100000);

    const isOnSale = selectedVariant?.is_on_sale ?? product.is_on_sale ?? false;
    const originalPrice = selectedVariant?.original_price ?? product.original_price ?? displayPrice;
    const discountPercent = selectedVariant?.discount_percentage ?? product.discount_percentage ?? 0;

    // Stock availability
    const stockQty = selectedVariant?.stock_quantity ?? product.stock_quantity ?? null;
    const isOutOfStock = stockQty !== null && stockQty <= 0;
    const maxQty = stockQty !== null && stockQty > 0 ? stockQty : 99;

    // Scheduled availability
    const isComingSoon = product.is_coming_soon ?? false;
    const isExpired = product.is_availability_expired ?? false;
    const isUnavailable = isComingSoon || isExpired || isOutOfStock;



    const cartItem = product ? items.find(i =>
        i.product_id === product.product_id &&
        (selectedVariant?.variant_id ? i.variant_id === selectedVariant.variant_id : true)
    ) : undefined;

    const displayQuantity = localQty !== null ? localQty : (cartItem ? cartItem.quantity : quantity);
    const isModified = cartItem ? (displayQuantity !== cartItem.quantity) : true;

    const handleMinus = async () => {
        const current = displayQuantity;
        if (cartItem && current === cartItem.quantity) {
            // Dynamic decrease directly in cart
            if (cartItem.quantity > 1) {
                setLocalQty(null);
                await updateQuantity(cartItem.cart_item_id, cartItem.quantity - 1);
            } else {
                setLocalQty(null);
                await removeItem(cartItem.cart_item_id);
            }
        } else {
            // Local decrease
            const next = Math.max(1, current - 1);
            if (cartItem && next === cartItem.quantity) {
                setLocalQty(null); // Re-synced
            } else {
                setLocalQty(next);
            }
            if (!cartItem) setQuantity(next); // Fallback for pure local state
        }
    };

    const handlePlus = async () => {
        const current = displayQuantity;
        const next = Math.min(maxQty, current + 1);
        setLocalQty(next);
        if (!cartItem) setQuantity(next); // Fallback for pure local state
    };

    const handleAddToCart = async () => {
        if (!product || isOutOfStock) return;

        if (cartItem) {
            if (!isModified) return; // do nothing if not modified

            await updateQuantity(cartItem.cart_item_id, displayQuantity);
            toast.success(`Cart updated to ${displayQuantity} x ${product.product_name}!`);
            setLocalQty(null);
        } else {
            await addItem(
                product.product_id,
                selectedVariant?.variant_id || null,
                displayQuantity
            );
            toast.success(`Added ${displayQuantity} x ${product.product_name} to cart!`);
            setLocalQty(null);
        }
    };

    const handleBuyNow = async () => {
        if (!product || isUnavailable) return;

        // If user is NOT signed in, redirect to login with a return URL
        if (!isAuthenticated) {
            const returnUrl = `/product/${product.slug || product.product_id}?buyNow=true`;
            router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // User IS signed in — store the single item and go straight to checkout
        const buyNowItem = {
            product_id: product.product_id,
            product_name: product.product_name,
            variant_id: selectedVariant?.variant_id || null,
            size_label: selectedVariant?.size_label || '',
            quantity: displayQuantity,
            unit_price: Number(selectedVariant?.price ?? product.price ?? 0),
            image_url: (product as any).thumbnail_url || '',
        };
        sessionStorage.setItem('ksp_buy_now_item', JSON.stringify(buyNowItem));
        router.push('/checkout?buyNow=true');
    };

    return (
        <div className="min-h-screen bg-cream">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateProductJsonLd(product as any)) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateBreadcrumbJsonLd([
                        { name: 'Home', url: '/' },
                        { name: 'Shop', url: '/products' },
                        { name: product.category || 'Category', url: `/categories/${encodeURIComponent((product.category || '').toLowerCase().replace(/\s+/g, '-'))}` },
                        { name: product.product_name, url: `/product/${product.slug || product.product_id}` },
                    ]))
                }}
            />
            {/* Breadcrumb */}
            <div className="border-b border-light-border bg-white">
                <div className="mx-auto max-w-7xl px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-warm-gray">
                        <Link href="/">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href="/products">Shop</Link>
                        <ChevronRight className="h-3 w-3" />
                        {product.category && (
                            <>
                                <Link href={`/categories/${encodeURIComponent(product.category.toLowerCase().replace(/\s+/g, '-'))}`} className="hover:text-charcoal transition-colors">
                                    {product.category}
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                            </>
                        )}
                        <span className="text-charcoal font-medium">{product.product_name}</span>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-10">
                {/* ═══ ABOVE THE FOLD — loads immediately ═══ */}
                <div className="grid gap-10 lg:grid-cols-2">
                    {/* IMAGE GALLERY */}
                    <div>
                        <ProductImageGallery
                            assets={product.assets}
                            productName={product.product_name}
                            variantId={selectedVariant?.variant_id}
                            fallbackImages={product.images}
                            brand={product.brand || undefined}
                            category={product.category || undefined}
                        />
                    </div>

                    {/* DETAILS */}
                    <div className="space-y-6">
                        <h1 className="font-serif text-3xl font-bold">
                            {product.product_name}
                        </h1>

                        {product.brand && (
                            <Link
                                href={`/products?brands=${encodeURIComponent(product.brand)}`}
                                className="text-warm-gray hover:text-burgundy transition-colors hover:underline inline-block"
                            >
                                {product.brand}
                            </Link>
                        )}

                        {/* Product metadata tags */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                            {product.category && (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-warm-gray/60 font-medium">Category:</span>
                                    <span className="text-charcoal">{product.category}</span>
                                </span>
                            )}
                            {product.country_of_origin && (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-warm-gray/60 font-medium">Country of Origin:</span>
                                    <span className="text-burgundy/80 font-semibold">{product.country_of_origin}</span>
                                </span>
                            )}

                        </div>

                        {/* PRICE */}
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-burgundy">
                                {formatVND(displayPrice)}
                            </p>
                            {isOnSale && originalPrice && (
                                <>
                                    <p className="text-lg text-warm-gray/60 line-through decoration-burgundy/40">
                                        {formatVND(originalPrice)}
                                    </p>
                                    <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-200 uppercase tracking-wide">
                                        {discountPercent}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* ✅ VARIANT SELECTORS: Size + Pack */}
                        {variants.length > 0 && (() => {
                            const uniqueSizes = [...new Set(variants.map((v: any) => v.size_label as string))].filter(Boolean);
                            const uniquePacks = [...new Set(variants.map((v: any) => (v.pack_quantity ?? 1) as number))].sort((a, b) => a - b);

                            const handleSizeSelect = (size: string) => {
                                setSelectedSize(size);
                                const match = variants.find((v: any) => v.size_label === size && (v.pack_quantity ?? 1) === (selectedPack ?? 1));
                                if (match) setSelectedVariant(match);
                                else {
                                    // fallback: find any variant with this size
                                    const fallback = variants.find((v: any) => v.size_label === size);
                                    if (fallback) {
                                        setSelectedPack(fallback.pack_quantity ?? 1);
                                        setSelectedVariant(fallback);
                                    }
                                }
                            };

                            const handlePackSelect = (pack: number) => {
                                setSelectedPack(pack);
                                const match = variants.find((v: any) => v.size_label === selectedSize && (v.pack_quantity ?? 1) === pack);
                                if (match) setSelectedVariant(match);
                                else {
                                    // fallback: find any variant with this pack
                                    const fallback = variants.find((v: any) => (v.pack_quantity ?? 1) === pack);
                                    if (fallback) {
                                        setSelectedSize(fallback.size_label);
                                        setSelectedVariant(fallback);
                                    }
                                }
                            };

                            const hasCombo = (size: string, pack: number) =>
                                variants.some((v: any) => v.size_label === size && (v.pack_quantity ?? 1) === pack);

                            return (
                                <div className="space-y-4">
                                    {/* Choose Size */}
                                    {uniqueSizes.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Choose Size:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniqueSizes.map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => handleSizeSelect(size)}
                                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                            ${selectedSize === size
                                                                ? 'bg-burgundy text-white border-burgundy'
                                                                : 'border-light-border hover:border-burgundy'
                                                            }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Choose Pack — only show if more than 1 unique pack */}
                                    {uniquePacks.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Choose Pack:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniquePacks.map((pack) => {
                                                    const available = hasCombo(selectedSize!, pack);
                                                    return (
                                                        <button
                                                            key={pack}
                                                            onClick={() => available && handlePackSelect(pack)}
                                                            disabled={!available}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedPack === pack
                                                                    ? 'bg-burgundy text-white border-burgundy'
                                                                    : available
                                                                        ? 'border-light-border hover:border-burgundy'
                                                                        : 'border-light-border opacity-40 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Pack of {pack}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* STOCK AVAILABILITY BADGE */}
                        {isComingSoon ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                🕒 Coming Soon
                            </div>
                        ) : isExpired ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                <AlertTriangle size={12} /> Availability Ended
                            </div>
                        ) : stockQty !== null && (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isOutOfStock
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : stockQty <= 5
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}>
                                {isOutOfStock ? (
                                    <><AlertTriangle size={12} /> Out of Stock</>
                                ) : stockQty <= 5 ? (
                                    <><AlertTriangle size={12} /> Only {stockQty} left</>
                                ) : (
                                    <>✓ In Stock</>
                                )}
                            </div>
                        )}

                        {/* QUANTITY + CART */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-4">
                                <div className={`flex border rounded-lg ${cartLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <button onClick={handleMinus} className="px-3 hover:bg-black/5 rounded-l-lg transition-colors" disabled={isUnavailable || (displayQuantity <= 1 && !cartItem)}>
                                        <Minus size={16} />
                                    </button>
                                    <span className="px-4 py-2 flex items-center justify-center min-w-[3rem] font-medium text-charcoal">{displayQuantity}</span>
                                    <button onClick={handlePlus} className="px-3 hover:bg-black/5 rounded-r-lg transition-colors" disabled={isUnavailable || displayQuantity >= maxQty}>
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={isUnavailable || (!isModified && !!cartItem) || cartLoading}
                                    className={`flex-1 rounded-lg py-3 flex justify-center items-center gap-2 transition-all font-semibold ${isUnavailable
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : cartItem && !isModified
                                            ? 'bg-emerald-600 text-white cursor-default shadow-md shadow-emerald-600/20'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                                        }`}
                                >
                                    <ShoppingCart size={18} />
                                    {isComingSoon ? 'Coming Soon' : isExpired ? 'No Longer Available' : isOutOfStock ? 'Out of Stock' : cartItem ? (isModified ? 'Update Cart' : 'In Cart') : 'Add to Cart'}
                                </button>

                                <button
                                    onClick={() => toggleItem(product)}
                                    className={`border rounded-lg px-3 flex items-center justify-center transition-colors ${wishlisted ? 'border-burgundy bg-burgundy/5' : 'hover:bg-black/5'}`}
                                >
                                    <Heart className={wishlisted ? "fill-current text-burgundy" : "text-charcoal"} size={20} />
                                </button>
                            </div>

                            <button
                                onClick={handleBuyNow}
                                disabled={isUnavailable || cartLoading}
                                className={`w-full rounded-lg py-3 flex justify-center items-center font-semibold transition-all shadow-md ${isUnavailable
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-burgundy text-white hover:bg-burgundy/90 shadow-burgundy/20 hover:shadow-lg hover:-translate-y-0.5'
                                    }`}
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* SHIPPING */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs">
                                <Truck size={16} /> Free shipping over ₹5000
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <RotateCcw size={16} /> 7-day returns
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ BELOW THE FOLD — lazy loaded ═══ */}

                {/* INTENDED USE & DESCRIPTION (simple text, no dynamic import needed) */}
                {(product.description || product.intended_use) && (
                    <LazySection
                        minHeight="100px"
                        rootMargin="200px"
                        skeleton={
                            <section className="mt-16 border-t border-neutral-100 pt-10">
                                <div className="space-y-6">
                                    <div className="h-6 w-40 rounded animate-shimmer" />
                                    <div className="h-4 w-full rounded animate-shimmer" />
                                    <div className="h-4 w-3/4 rounded animate-shimmer" />
                                </div>
                            </section>
                        }
                    >
                        <section className="mt-16 border-t border-neutral-100 pt-10">
                            <div className="space-y-12">
                                {product.intended_use && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <Info className="h-6 w-6 text-[#C5A46D] flex-shrink-0" strokeWidth={1} />
                                            <h2 className="font-serif text-2xl font-bold text-neutral-800">Intended Use</h2>
                                        </div>
                                        <p className="text-[15px] text-neutral-600 leading-[1.85] whitespace-pre-line pl-9">
                                            {product.intended_use}
                                        </p>
                                    </div>
                                )}
                                {product.description && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <Info className="h-6 w-6 text-[#C5A46D] flex-shrink-0" strokeWidth={1} />
                                            <h2 className="font-serif text-2xl font-bold text-neutral-800">Description</h2>
                                        </div>
                                        <p className="text-[15px] text-neutral-600 leading-[1.85] whitespace-pre-line pl-9">
                                            {product.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </LazySection>
                )}

                {/* REVIEWS SECTION — lazy loaded + dynamic import */}
                <LazySection
                    minHeight="300px"
                    rootMargin="300px"
                    skeleton={<SkeletonReviewSection />}
                >
                    <ReviewSection productId={product.product_id} />
                </LazySection>

                {/* PERFECT PAIRINGS — lazy loaded with deferred API call */}
                <LazySection
                    minHeight="400px"
                    rootMargin="400px"
                    skeleton={<SkeletonProductRow title="Perfect Pairings" />}
                >
                    <LazyRelatedProducts
                        productId={product.product_id}
                        type="pairs_with"
                        title="Perfect Pairings"
                        icon={<Sparkles className="h-6 w-6 text-burgundy" />}
                    />
                </LazySection>

                {/* YOU MAY ALSO LIKE — lazy loaded with deferred API call */}
                <LazySection
                    minHeight="400px"
                    rootMargin="400px"
                    skeleton={<SkeletonProductRow title="You May Also Like" />}
                >
                    <LazyRelatedProducts
                        productId={product.product_id}
                        type="similar"
                        title="You May Also Like"
                    />
                </LazySection>

                {/* RECENTLY VIEWED — lazy loaded + dynamic import */}
                <LazySection
                    minHeight="200px"
                    rootMargin="400px"
                >
                    <RecentlyViewedProducts currentProductId={id} />
                </LazySection>
            </div>
        </div>
    );
}

export default function ProductDetailPage({ params }: Props) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cream animate-pulse" />}>
            <ProductDetailContent params={params} />
        </Suspense>
    );
}

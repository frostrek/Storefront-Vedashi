'use client';

import { useState, useEffect, use, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getProduct, getProductDetails, getRelatedProducts } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
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
import { CheckCircle2, FlaskConical, Leaf as LeafIcon, ShieldCheck } from 'lucide-react';
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
        <div className="mt-16 border-t border-gray-100 pt-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
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
    const { formatPrice } = useCurrency();
    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageQuantity, setPageQuantity] = useState(1);

    // ✅ Variant state
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
    const [selectedStrength, setSelectedStrength] = useState<string | null>(null);
    const [selectedVolume, setSelectedVolume] = useState<number | null>(null);
    const [selectedCount, setSelectedCount] = useState<string | null>(null);
    const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<number | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

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

                const requestedVariantId = searchParams.get('variant');
                const matchedVariant = requestedVariantId 
                    ? vs.find((v: any) => v.variant_id === requestedVariantId)
                    : null;

                // Pick requested variant, or default (is_default=true), falling back to first
                const targetV = matchedVariant || vs.find((v: any) => v.is_default === true) || vs[0];
                
                setSelectedWeight(targetV?.weight_g ?? null);
                setSelectedStrength(targetV?.strength ? `${targetV.strength} ${targetV.strength_unit || ''}`.trim() : null);
                setSelectedVolume(targetV?.volume_ml ?? null);
                setSelectedCount(targetV?.units_count ? `${targetV.units_count} ${targetV.form_factor || 'Units'}` : null);
                setSelectedFlavor(targetV?.flavor ?? null);
                setSelectedPack(targetV?.pack_quantity ?? 1);
                setSelectedVariant(targetV);
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
                    quantity: 1, // Default to 1 on express redirect
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
            <div className="min-h-screen bg-[#FDFCFB]" style={{ backgroundImage: "url('/botanical-page-bg.png')", backgroundAttachment: 'fixed', backgroundSize: '600px' }}>
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

    // Variant Activity
    const isVariantInactive = selectedVariant?.status === 'Inactive' || selectedVariant?.is_active === false;

    // Stock availability
    const stockQty = selectedVariant?.stock_quantity ?? product.stock_quantity ?? null;
    const isOutOfStock = stockQty !== null && stockQty <= 0;
    const maxQty = stockQty !== null && stockQty > 0 ? stockQty : 99;

    // Scheduled availability
    const isComingSoon = product.is_coming_soon ?? false;
    const isExpired = product.is_availability_expired ?? false;
    const isUnavailable = isComingSoon || isExpired || isOutOfStock || isVariantInactive;

    const handleMinus = () => {
        setPageQuantity(prev => Math.max(1, prev - 1));
    };

    const handlePlus = () => {
        setPageQuantity(prev => Math.min(maxQty, prev + 1));
    };

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!product || isOutOfStock) return;

        // Trigger Butterfly Animation
        const rect = e.currentTarget.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        
        window.dispatchEvent(new CustomEvent('add-to-cart-butterfly', {
            detail: { startX, startY }
        }));

        await addItem(
            product.product_id,
            selectedVariant?.variant_id || null,
            pageQuantity
        );
        toast.success(`Added ${pageQuantity} x ${product.product_name} to cart!`);
        setPageQuantity(1); // Reset counter to 1 after process
    };

    const handleBuyNow = async () => {
        if (!product || isUnavailable) return;

        // If user is NOT signed in, redirect to login with a return URL
        if (!isAuthenticated) {
            const returnUrl = `/products/${product.slug || product.product_id}?buyNow=true`;
            router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // User IS signed in — store the single item and go straight to checkout
        const buyNowItem = {
            product_id: product.product_id,
            product_name: product.product_name,
            variant_id: selectedVariant?.variant_id || null,
            size_label: selectedVariant?.size_label || '',
            quantity: pageQuantity,
            unit_price: Number(selectedVariant?.price ?? product.price ?? 0),
            image_url: (product as any).thumbnail_url || '',
        };
        sessionStorage.setItem('ksp_buy_now_item', JSON.stringify(buyNowItem));
        router.push('/checkout?buyNow=true');
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-16" style={{ backgroundImage: "url('/botanical-page-bg.png')", backgroundAttachment: 'fixed', backgroundSize: '600px' }}>
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
                        { name: product.product_name, url: `/products/${product.slug || product.product_id}` },
                    ]))
                }}
            />
            {/* Breadcrumb */}
            <div className="border-b border-light-border bg-white">
                <div className="mx-auto max-w-7xl px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href="/products">Shop</Link>
                        <ChevronRight className="h-3 w-3" />
                        {product.category && (
                            <>
                                <Link href={`/categories/${encodeURIComponent(product.category.toLowerCase().replace(/\s+/g, '-'))}`} className="hover:text-gray-900 transition-colors">
                                    {product.category}
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                            </>
                        )}
                        <span className="text-gray-900 font-medium">{product.product_name}</span>
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
                    <div className="space-y-6 pt-4 lg:pt-8 pr-4">
                        {/* Vedashi Badges */}
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3d5c3a]/10 text-[#3d5c3a]">
                                Tridoshic
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200 text-gray-600">
                                CERTIFIED ORGANIC
                            </span>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 italic tracking-tight leading-[1.1]">
                            {product.product_name}
                        </h1>

                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex text-[#C5A46D]">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">(32 Verified Reviews)</span>
                        </div>

                        {/* PRICE */}
                        <div className="flex items-end gap-3 mt-4">
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(displayPrice)} <span className="text-sm font-normal text-gray-500">/ set</span>
                            </p>
                            {isOnSale && originalPrice && (
                                <>
                                    <p className="text-base text-gray-400 line-through mb-0.5">
                                        {formatPrice(originalPrice)}
                                    </p>
                                    <span className="bg-[#3d5c3a]/10 text-[#3d5c3a] text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide mb-1">
                                        {discountPercent}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="text-[15px] leading-relaxed text-gray-600">
                            A high-potency infusion of Ashwagandha and Saffron designed to restore vital energy (Ojas) and deeply nourish the dermal layers.
                        </p>

                        {/* ✅ VARIANT SELECTORS: Weight, Strength, Volume, Count, Flavor, Pack */}
                        {variants.length > 0 && (() => {
                            const uniqueWeights = [...new Set(variants.map((v: any) => v.weight_g as number))].filter(Boolean).sort((a, b) => a - b);
                            const uniqueStrengths = [...new Set(variants.map((v: any) => v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null))].filter(Boolean);
                            const uniqueVolumes = [...new Set(variants.map((v: any) => v.volume_ml as number))].filter(Boolean).sort((a, b) => a - b);
                            const uniqueCounts = [...new Set(variants.map((v: any) => v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null))].filter(Boolean);
                            const uniqueFlavors = [...new Set(variants.map((v: any) => v.flavor as string))].filter(Boolean);
                            const uniquePacks = [...new Set(variants.map((v: any) => (v.pack_quantity ?? 1) as number))].filter(Boolean).sort((a, b) => a - b);

                            const formatVolume = (ml: number) => {
                                return ml >= 999 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`;
                            };

                            const formatWeight = (g: number) => {
                                return g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : g % 100 === 0 ? 1 : 2)} kg` : `${Math.round(g)} g`;
                            };

                            const updateSelection = (updates: any) => {
                                const newW = updates.weight !== undefined ? updates.weight : selectedWeight;
                                const newS = updates.strength !== undefined ? updates.strength : selectedStrength;
                                const newV = updates.volume !== undefined ? updates.volume : selectedVolume;
                                const newC = updates.count !== undefined ? updates.count : selectedCount;
                                const newF = updates.flavor !== undefined ? updates.flavor : selectedFlavor;
                                const newP = updates.pack !== undefined ? updates.pack : selectedPack;

                                // Try to find an exact match first
                                let match = variants.find((v: any) => 
                                    (v.weight_g || null) === newW &&
                                    (v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null) === newS &&
                                    (v.volume_ml || null) === newV &&
                                    (v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null) === newC &&
                                    (v.flavor || null) === newF &&
                                    (v.pack_quantity ?? 1) === newP
                                );

                                // If no exact match, fallback to finding the first variant that matches the MOST RECENTLY updated dimension
                                if (!match) {
                                    if (updates.weight !== undefined) match = variants.find((v: any) => v.weight_g === newW);
                                    else if (updates.strength !== undefined) match = variants.find((v: any) => (v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null) === newS);
                                    else if (updates.volume !== undefined) match = variants.find((v: any) => v.volume_ml === newV);
                                    else if (updates.count !== undefined) match = variants.find((v: any) => (v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null) === newC);
                                    else if (updates.flavor !== undefined) match = variants.find((v: any) => v.flavor === newF);
                                    else if (updates.pack !== undefined) match = variants.find((v: any) => (v.pack_quantity ?? 1) === newP);
                                }

                                if (match) {
                                    setSelectedWeight(match.weight_g || null);
                                    setSelectedStrength(match.strength ? `${match.strength} ${match.strength_unit || ''}`.trim() : null);
                                    setSelectedVolume(match.volume_ml || null);
                                    setSelectedCount(match.units_count ? `${match.units_count} ${match.form_factor || 'Units'}` : null);
                                    setSelectedFlavor(match.flavor || null);
                                    setSelectedPack(match.pack_quantity ?? 1);
                                    setSelectedVariant(match);
                                } else {
                                    // Update state anyway to show what user clicked, but wait... variant must exist. 
                                    // With the above fallback, we always find at least some variant.
                                }
                            };

                            const checkAvailable = (dimension: string, value: any) => {
                                return variants.some((v: any) => {
                                    if (dimension === 'weight') return v.weight_g === value && (v.pack_quantity ?? 1) === (selectedPack ?? 1);
                                    if (dimension === 'strength') return (v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null) === value && (v.pack_quantity ?? 1) === (selectedPack ?? 1);
                                    if (dimension === 'volume') return v.volume_ml === value && (v.pack_quantity ?? 1) === (selectedPack ?? 1);
                                    if (dimension === 'count') return (v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null) === value && (v.pack_quantity ?? 1) === (selectedPack ?? 1);
                                    if (dimension === 'flavor') return v.flavor === value && (v.pack_quantity ?? 1) === (selectedPack ?? 1);
                                    if (dimension === 'pack') return (v.pack_quantity ?? 1) === value; // For pack, we typically don't restrict based on other dimensions, but we could check against all. Let's just return true if it exists.
                                    return true;
                                });
                            };

                            const isOptionActive = (dimension: string, value: any) => {
                                return variants.some((v: any) => {
                                    let match = false;
                                    if (dimension === 'weight') match = v.weight_g === value;
                                    if (dimension === 'strength') match = (v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null) === value;
                                    if (dimension === 'volume') match = v.volume_ml === value;
                                    if (dimension === 'count') match = (v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null) === value;
                                    if (dimension === 'flavor') match = v.flavor === value;
                                    if (dimension === 'pack') match = (v.pack_quantity ?? 1) === value;

                                    return match && v.status !== 'Inactive' && v.is_active !== false;
                                });
                            };

                            const hasSingleWeight = uniqueWeights.length === 1;
                            const hasSingleStrength = uniqueStrengths.length === 1;
                            const hasSingleVolume = uniqueVolumes.length === 1;
                            const hasSingleCount = uniqueCounts.length === 1;
                            const hasSingleFlavor = uniqueFlavors.length === 1;
                            const hasSinglePack = uniquePacks.length === 1 && uniquePacks[0] > 1; // Only show single pack if it's not a generic size of 1

                            return (
                                <div className="space-y-4">
                                    {/* ✅ SINGLE-ATTRIBUTES AS KEY-VALUE PAIRS */}
                                    {(hasSingleWeight || hasSingleStrength || hasSingleVolume || hasSingleCount || hasSingleFlavor || hasSinglePack) && (
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 pb-4 border-b border-gray-100">
                                            {hasSingleWeight && (
                                                <div className="flex items-baseline">
                                                    <span className="text-sm text-gray-500 mr-2">Weight:</span>
                                                    <span className="text-sm font-medium text-gray-900">{formatWeight(uniqueWeights[0])}</span>
                                                </div>
                                            )}
                                            {hasSingleStrength && (
                                                <div className="flex items-baseline">
                                                    <span className="text-sm text-gray-500 mr-2">Strength:</span>
                                                    <span className="text-sm font-medium text-gray-900">{uniqueStrengths[0]}</span>
                                                </div>
                                            )}
                                            {hasSingleVolume && (
                                                <div className="flex items-baseline">
                                                    <span className="text-sm text-gray-500 mr-2">Volume:</span>
                                                    <span className="text-sm font-medium text-gray-900">{formatVolume(uniqueVolumes[0])}</span>
                                                </div>
                                            )}
                                            {hasSingleCount && (
                                                <div className="flex items-baseline">
                                                    <span className="text-sm text-gray-500 mr-2">Count:</span>
                                                    <span className="text-sm font-medium text-gray-900">{uniqueCounts[0]}</span>
                                                </div>
                                            )}
                                            {hasSingleFlavor && (
                                                <div className="flex items-baseline">
                                                    <span className="text-sm text-gray-500 mr-2">Flavour:</span>
                                                    <span className="text-sm font-medium text-gray-900 capitalize">{uniqueFlavors[0]}</span>
                                                </div>
                                            )}
                                            {hasSinglePack && (
                                                <div className="flex items-baseline">
                                                    <span className="text-sm text-gray-500 mr-2">Pack:</span>
                                                    <span className="text-sm font-medium text-gray-900">Pack of {uniquePacks[0]}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Choose Weight */}
                                    {uniqueWeights.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Choose Weight:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniqueWeights.map((w) => {
                                                    const active = isOptionActive('weight', w);
                                                    return (
                                                        <button
                                                            key={w}
                                                            onClick={() => active && updateSelection({ weight: w })}
                                                            disabled={!active}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedWeight === w
                                                                    ? 'bg-[#3d5c3a] text-white border-[#3d5c3a]'
                                                                    : !active
                                                                        ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    : 'border-gray-200 text-gray-700 hover:border-[#3d5c3a]'
                                                                }`}
                                                        >
                                                            {formatWeight(w)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* By Strength */}
                                    {uniqueStrengths.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">By Strength:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniqueStrengths.map((str) => {
                                                    const active = isOptionActive('strength', str);
                                                    return (
                                                        <button
                                                            key={str}
                                                            onClick={() => active && updateSelection({ strength: str })}
                                                            disabled={!active}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedStrength === str
                                                                    ? 'bg-[#3d5c3a] text-white border-[#3d5c3a]'
                                                                    : !active
                                                                        ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    : 'border-gray-200 text-gray-700 hover:border-[#3d5c3a]'
                                                                }`}
                                                        >
                                                            {str}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Choose Volume */}
                                    {uniqueVolumes.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Choose Volume:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniqueVolumes.map((vol) => {
                                                    const active = isOptionActive('volume', vol);
                                                    return (
                                                        <button
                                                            key={vol}
                                                            onClick={() => active && updateSelection({ volume: vol })}
                                                            disabled={!active}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedVolume === vol
                                                                    ? 'bg-[#3d5c3a] text-white border-[#3d5c3a]'
                                                                    : !active
                                                                        ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    : 'border-gray-200 text-gray-700 hover:border-[#3d5c3a]'
                                                                }`}
                                                        >
                                                            {formatVolume(vol)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* By Count */}
                                    {uniqueCounts.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">By Count:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniqueCounts.map((countStr) => {
                                                    const active = isOptionActive('count', countStr);
                                                    return (
                                                        <button
                                                            key={countStr}
                                                            onClick={() => active && updateSelection({ count: countStr })}
                                                            disabled={!active}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedCount === countStr
                                                                    ? 'bg-[#3d5c3a] text-white border-[#3d5c3a]'
                                                                    : !active
                                                                        ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    : 'border-gray-200 text-gray-700 hover:border-[#3d5c3a]'
                                                                }`}
                                                        >
                                                            {countStr}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* By Flavor */}
                                    {uniqueFlavors.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">By Flavour:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniqueFlavors.map((flav) => {
                                                    const active = isOptionActive('flavor', flav);
                                                    return (
                                                        <button
                                                            key={flav}
                                                            onClick={() => active && updateSelection({ flavor: flav })}
                                                            disabled={!active}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedFlavor === flav
                                                                    ? 'bg-[#3d5c3a] text-white border-[#3d5c3a]'
                                                                    : !active
                                                                        ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    : 'border-gray-200 text-gray-700 hover:border-[#3d5c3a]'
                                                                }`}
                                                        >
                                                            {flav}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Choose Pack */}
                                    {uniquePacks.length > 1 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Choose Pack:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {uniquePacks.map((pack) => {
                                                    const active = isOptionActive('pack', pack);
                                                    return (
                                                        <button
                                                            key={pack}
                                                            onClick={() => active && updateSelection({ pack })}
                                                            disabled={!active}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                                                ${selectedPack === pack
                                                                    ? 'bg-[#3d5c3a] text-white border-[#3d5c3a]'
                                                                    : !active
                                                                        ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    : 'border-gray-200 text-gray-700 hover:border-[#3d5c3a]'
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

                        {/* STOCK AVAILABILITY BADGE & QUANTITY COUNTER */}
                        <div className="flex items-center flex-wrap gap-4">
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

                            {!isUnavailable && (
                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                    <button
                                        onClick={handleMinus}
                                        disabled={pageQuantity <= 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-600"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm font-bold text-gray-900 w-6 text-center select-none">
                                        {pageQuantity}
                                    </span>
                                    <button
                                        onClick={handlePlus}
                                        disabled={pageQuantity >= maxQty}
                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-600"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* QUANTITY + CART */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            {/* Static Subscription Toggle UI (Visual Only) */}
                            <div className="flex lg:grid lg:grid-cols-2 gap-3 mb-4">
                                <button className="flex-[1] lg:flex-none py-3 px-4 rounded-xl border-2 border-[#3d5c3a] bg-[#3d5c3a]/5 text-left transition-colors relative">
                                    <span className="block text-xs font-bold text-[#3d5c3a] uppercase tracking-wider mb-0.5">Monthly</span>
                                    <span className="block text-[11px] text-gray-600">Auto-ships every 30 days</span>
                                    <span className="absolute top-0 right-0 bg-[#3d5c3a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-[10px]">SAVE 15%</span>
                                </button>
                                <button className="flex-[1] lg:flex-none py-3 px-4 rounded-xl border border-gray-200 bg-white text-left hover:border-gray-300 transition-colors">
                                    <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-0.5">One-time</span>
                                    <span className="block text-[11px] text-gray-500">Standard purchase</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={(e) => handleAddToCart(e)}
                                    disabled={isUnavailable || cartLoading}
                                    className={`w-full rounded-xl py-4 flex justify-center items-center gap-2 transition-all font-semibold ${isUnavailable
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-[#7a8f69] hover:bg-[#6b805a] text-white shadow-sm'
                                        }`}
                                >
                                    <ShoppingCart size={18} />
                                    {isComingSoon ? 'Coming Soon' : isExpired ? 'Unavailable' : isVariantInactive ? 'Option Unavailable' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </button>

                                <button
                                    onClick={handleBuyNow}
                                    disabled={isUnavailable || cartLoading}
                                    className={`w-full rounded-xl py-4 flex justify-center items-center font-semibold transition-all border ${isUnavailable
                                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50 shadow-sm'
                                        }`}
                                >
                                    Buy It Now
                                </button>
                            </div>
                        </div>

                        {/* TRUST BADGES */}
                        <div className="grid grid-cols-3 gap-2 pt-6 pb-2">
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="h-10 w-10 min-w-10 rounded-full bg-[#3d5c3a]/10 text-[#3d5c3a] flex items-center justify-center">
                                    <FlaskConical size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">Lab Certified</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="h-10 w-10 min-w-10 rounded-full bg-[#3d5c3a]/10 text-[#3d5c3a] flex items-center justify-center">
                                    <LeafIcon size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">100% Organic</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="h-10 w-10 min-w-10 rounded-full bg-[#3d5c3a]/10 text-[#3d5c3a] flex items-center justify-center">
                                    <ShieldCheck size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">Clinical Defended</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ BELOW THE FOLD — lazy loaded ═══ */}

                {/* NEW: ANCIENT ROOTS SECTION */}
                <LazySection
                    minHeight="600px"
                    rootMargin="200px"
                    skeleton={<div className="h-[600px] w-full rounded-2xl bg-gray-100 animate-pulse mt-16" />}
                >
                    <section className="mt-16 bg-[#3d5c3a] rounded-3xl overflow-hidden text-[#FAF7F2]">
                        <div className="grid lg:grid-cols-2">
                            {/* Left Content */}
                            <div className="p-8 lg:p-16 flex flex-col justify-center">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold tracking-wider mb-8 w-max">
                                    Clinical Transparency
                                </span>
                                <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                    Ancient Roots.<br />Proven Science.
                                </h2>
                                <p className="text-white/80 text-[15px] leading-relaxed mb-8 max-w-md">
                                    We utilize chromatographic fingerprinting to ensure every drop of our Rejuvenating Elixir contains the precise concentration of bioactive alkaloids described in the Charaka Samhita.
                                </p>
                                
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 strokeWidth={3} className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold tracking-wide">Heavy Metal Tested & Free</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 strokeWidth={3} className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold tracking-wide">Standardized 5% WithanolIDES</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 strokeWidth={3} className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold tracking-wide">Ethically Wild-Harvested Ingredients</span>
                                    </li>
                                </ul>

                                <button className="bg-white text-[#3d5c3a] px-6 py-3.5 rounded-xl font-bold text-sm w-max hover:bg-gray-50 transition-colors shadow-lg">
                                    Download Certificate of Analysis (PDF)
                                </button>
                            </div>

                            {/* Right Grid Collage */}
                            <div className="p-8 lg:p-12 lg:pl-0 grid grid-cols-2 gap-4 h-[500px] lg:h-auto">
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="bg-black/20 rounded-2xl h-[55%] bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1611078519632-132d7515dbbf?q=80&w=800&auto=format&fit=crop')"}} />
                                    <div className="bg-black/20 rounded-2xl h-[45%] bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop')"}} />
                                </div>
                                <div className="space-y-4 flex flex-col pt-12">
                                    <div className="bg-black/20 rounded-2xl h-[45%] bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1563241527-310ca0fa8f12?q=80&w=800&auto=format&fit=crop')"}} />
                                    <div className="bg-[#8b997c] rounded-2xl h-[40%] flex flex-col justify-center p-6 text-[#1a2e18]">
                                        <div className="text-5xl font-bold mb-2">24+</div>
                                        <div className="text-xs font-bold uppercase tracking-wider leading-relaxed">CLINICAL TRIALS<br />COMPLETED IN 2022</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </LazySection>

                {/* INTENDED USE & DESCRIPTION */}
                {(product.description || product.intended_use) && (
                    <LazySection
                        minHeight="100px"
                        rootMargin="200px"
                        skeleton={
                            <section className="mt-16 border-t border-gray-100 pt-10">
                                <div className="space-y-6">
                                    <div className="h-6 w-40 rounded animate-shimmer" />
                                    <div className="h-4 w-full rounded animate-shimmer" />
                                    <div className="h-4 w-3/4 rounded animate-shimmer" />
                                </div>
                            </section>
                        }
                    >
                        <section className="mt-16 pt-10">
                            <div className={`grid gap-10 ${product.intended_use ? 'lg:grid-cols-[1fr_2fr]' : 'lg:grid-cols-1 max-w-4xl mx-auto'}`}>
                                {product.intended_use && (
                                    <div className="bg-gray-50 p-8 rounded-2xl h-max border border-gray-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Info className="h-5 w-5 text-[#3d5c3a] flex-shrink-0" strokeWidth={2} />
                                            <h2 className="text-xl font-bold text-gray-900">Intended Use</h2>
                                        </div>
                                        <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
                                            {product.intended_use}
                                        </p>
                                    </div>
                                )}
                                {product.description && (
                                    <div className="pt-4 lg:pt-0">
                                        <h2 className={`text-3xl font-bold text-gray-900 mb-6 ${product.intended_use ? 'hidden lg:block' : ''}`}>Description</h2>
                                        <div className="text-[15px] text-gray-600 leading-[1.85] whitespace-pre-line">
                                            {isDescriptionExpanded || product.description.split(/\s+/).length <= 100
                                                ? product.description
                                                : product.description.split(/\s+/).slice(0, 100).join(' ') + '...'}
                                        </div>
                                        {product.description.split(/\s+/).length > 100 && (
                                            <button 
                                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                className="mt-6 text-[#3d5c3a] font-bold text-sm tracking-wide hover:underline flex items-center gap-2"
                                            >
                                                {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </LazySection>
                )}

                {/* REVIEWS SECTION — lazy loaded + dynamic import */}
               <div className="relative isolate w-full mt-24 pt-16 pb-16 overflow-hidden">
                    {/* Shadow Background Illustration (Absolute positioned) */}
                    <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.03] flex justify-center items-center">
                        {/* A massive placeholder SVG for the "shadow leaves" effect */}
                        <svg viewBox="0 0 1000 1000" className="w-[150%] max-w-none transform min-w-[1200px]" preserveAspectRatio="xMidYMid slice">
                             <path fill="currentColor" d="M374.4,-331.1C470.9,-201.5,524.8,-42.9,493.4,87.9C462.1,218.7,345.5,321.7,211.5,410.6C77.4,499.5,-74.2,574.4,-190.2,525C-306.2,475.6,-386.5,301.9,-438.4,124.7C-490.3,-52.5,-513.7,-233.1,-437.4,-352C-361," />
                             <path fill="currentColor" transform="translate(400, 200) scale(0.8) rotate(45)" d="M434.3,-463.8C545,-387.8,604,-221.9,642.3,-45.8C680.7,130.3,698.3,316.5,614.9,451.3C531.5,586.2,347,669.7,157.9,681C-31.1,692.3,-224.8,631.3,-375.3,533C-525.8,434.8,-633.2,299.3,-667,144C-700.8,-11.3,-661.1,-186.4,-575.4,-322.6C-489.6,-458.8,-357.7,-556,-212.8,-575.3C-67.9,-594.7,89,-536.2,234.3,-480.1" />
                        </svg>
                    </div>

                    <div className="mx-auto max-w-7xl px-4 space-y-24">
                        {/* REVIEWS SECTION — lazy loaded + dynamic import */}
                        <LazySection
                            minHeight="300px"
                            rootMargin="300px"
                            skeleton={<SkeletonReviewSection />}
                        >
                            <ReviewSection productId={product.product_id} />
                        </LazySection>

                        {/* YOU MAY ALSO LIKE — lazy loaded with deferred API call */}
                        <LazySection
                            minHeight="400px"
                            rootMargin="400px"
                            skeleton={<SkeletonProductRow title="Complete Your Healing" />}
                        >
                            <LazyRelatedProducts
                                productId={product.product_id}
                                type="similar"
                                title="Complete Your Healing"
                                icon={<LeafIcon className="h-6 w-6 text-[#3d5c3a]" />}
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

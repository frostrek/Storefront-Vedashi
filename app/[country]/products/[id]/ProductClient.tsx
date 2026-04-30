'use client';

import { useState, useEffect, use, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getProduct, getProductDetails, getBestSellers, trackProductView, requestRestockNotification, getRatingSummary } from '@/lib/api';
import { trackEcommerce } from '@/lib/analytics/gtag';

import { useCurrency } from '@/context/CurrencyContext';
import { Product, ProductWithDetails, ProductVariant } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { SkeletonLine, SkeletonReviewSection, SkeletonProductRow } from '@/components/Skeleton';
import { Heart, ShoppingCart, Minus, Plus, Star, Truck, RotateCcw, ChevronRight, AlertTriangle, Sparkles, Info, Package, Award, BadgeCheck, Clock, Globe, Trash2, Share2, Tag } from 'lucide-react';
import ProductImageGallery from '@/components/gallery/ProductImageGallery';
import LazySection from '@/components/lazy/LazySection';
import toast from 'react-hot-toast';
import { getValidPrices } from '@/utils/discount';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { CheckCircle2, FlaskConical, Leaf as LeafIcon, ShieldCheck } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';


// Dynamic imports for below-fold sections
const ReviewSection = dynamic(
    () => import('@/components/reviews/ReviewSection'),
    { ssr: false }
);

const ProductReel = dynamic(
    () => import('@/components/ProductReel'),
    { ssr: false }
);

const RecentlyViewedProducts = dynamic(
    () => import('@/components/RecentlyViewedProducts'),
    { ssr: false }
);

const SimilarProducts = dynamic(
    () => import('@/components/SimilarProducts'),
    { ssr: false }
);



interface Props {
    id: string;
    country: string;
    initialProduct: ProductWithDetails | null;
}



/** Lazy-loaded best sellers section with deferred API call */
function LazyBestSellers({ title, icon }: {
    title: string;
    icon?: React.ReactNode;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getBestSellers({ limit: 12 }).then(res => {
            if (!cancelled) {
                if (res && res.data) {
                    setProducts(res.data as Product[]);
                } else if (Array.isArray(res)) {
                    setProducts(res as Product[]);
                }
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    return (
        <ProductReel
            title={title}
            products={products}
            loading={loading}
        />
    );
}


function ProductDetailContent({ id, country, initialProduct }: Props) {
    const { formatPrice } = useCurrency();
    const [product, setProduct] = useState<ProductWithDetails | null>(initialProduct);
    const [loading, setLoading] = useState(!initialProduct);
    const [pageQuantity, setPageQuantity] = useState(1);

    // ✅ Variant state
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
    const [selectedStrength, setSelectedStrength] = useState<string | null>(null);
    const [selectedVolume, setSelectedVolume] = useState<number | null>(null);
    const [selectedCount, setSelectedCount] = useState<string | null>(null);
    const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<number | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [ratingSummary, setRatingSummary] = useState<any>(null);
    const [activeInfoTab, setActiveInfoTab] = useState<'description' | 'howToUse' | 'specifications'>('description');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

    const { addItem, items, updateQuantity, removeItem, loading: cartLoading } = useCart();
    const { isInWishlist, toggleItem } = useWishlist();
    const { addProduct: trackRecentlyViewed } = useRecentlyViewed();

    // Restock Notification
    const [restockEmail, setRestockEmail] = useState('');
    const [isRestockNotifying, setIsRestockNotifying] = useState(false);

    const handleRestockNotify = async () => {
        if (!restockEmail || !/\S+@\S+\.\S+/.test(restockEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }
        setIsRestockNotifying(true);
        try {
            const res = await requestRestockNotification(
                product?.product_id as string,
                restockEmail,
                selectedVariant?.variant_id
            );

            if (res.success) {
                toast.success('You will be notified when this is back in stock!');
                setRestockEmail('');
            } else {
                toast.error(res.message || 'Failed to set notification.');
            }
        } catch {
            toast.error('Failed to set notification. Please try again.');
        } finally {
            setIsRestockNotifying(false);
        }
    };

    const handleShare = () => {
        const shareData = {
            title: product?.product_name || 'Vedashi Wellness',
            text: `Check out ${product?.product_name} on Vedashi — Premium Ayurvedic Wellness.`,
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            navigator.share(shareData).catch((err) => {
                console.log('Share failed:', err);
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    // Only fetch product details and variants (above-fold data)
    // Related products and reviews are deferred to their lazy sections
    useEffect(() => {
        window.scrollTo(0, 0);
        // Also scroll on next tick just in case
        setTimeout(() => window.scrollTo(0, 0), 0);
        const load = async () => {
            if (!initialProduct) {
                setLoading(true);

                let data = await getProductDetails(id);
                if (!data) {
                    const simple = await getProduct(id);
                    if (simple) data = simple as ProductWithDetails;
                }

                setProduct(data);
                initializeVariants(data);
            } else {
                initializeVariants(initialProduct);
            }
        };

        const initializeVariants = (data: any) => {

            // ✅ store variants with size/pack defaults
            if (data?.variants?.length) {
                const vs = data.variants.map((v: any) => {
                    let opts: any = {};
                    if (typeof v.options === 'string') {
                        try { opts = JSON.parse(v.options); } catch (e) { }
                    } else if (typeof v.options === 'object' && v.options !== null) {
                        opts = v.options;
                    }
                    return {
                        ...v,
                        options: opts,
                        weight_g: v.weight_g ?? (opts['Weight'] ? parseFloat(opts['Weight']) : null),
                        volume_ml: v.volume_ml ?? (opts['Volume'] ? parseFloat(opts['Volume']) : null),
                        units_count: v.units_count ?? (opts['Count'] ? parseInt(opts['Count'], 10) : null),
                        strength: v.strength ?? (opts['Strength'] || null),
                        flavor: v.flavor ?? (opts['Flavor'] || null),
                        pack_quantity: v.pack_quantity ?? (opts['Pack'] && String(opts['Pack']).toLowerCase() !== 'single' ? parseInt(opts['Pack'].replace(/\D/g, '') || '1', 10) : 1),
                    };
                });
                setVariants(vs);

                const requestedVariantId = searchParams.get('variant');
                const matchedVariant = requestedVariantId
                    ? vs.find((v: ProductVariant) => v.variant_id === requestedVariantId)
                    : null;

                // Pick requested variant, or default (is_default=true), falling back to first
                const targetV = matchedVariant || vs.find((v: ProductVariant) => v.is_default === true) || vs[0];
                setSelectedWeight(targetV?.weight_g ?? null);
                setSelectedStrength(targetV?.strength ? `${targetV.strength} ${targetV.strength_unit || ''}`.trim() : null);
                setSelectedVolume(targetV?.volume_ml ?? null);
                setSelectedCount(targetV?.units_count ? `${targetV.units_count} ${targetV.form_factor || 'Units'}` : null);
                setSelectedFlavor(targetV?.flavor ?? null);
                setSelectedPack(targetV?.pack_quantity ?? 1);
                setSelectedVariant(targetV);
            }

            // Set initial active tab based on availability
            if (data) {
                if (data.description) {
                    setActiveInfoTab('description');
                } else if (data.intended_use) {
                    setActiveInfoTab('howToUse');
                } else {
                    setActiveInfoTab('specifications');
                }
            }

            setLoading(false);

            // Track this product as recently viewed
            if (data) {
                trackRecentlyViewed(id);
                trackProductView(data.product_id);

                // GA4: view_item event
                const viewPrice = Number(data.variants?.find((v: ProductVariant) => v.is_default)?.price ?? data.price ?? 0);
                trackEcommerce('view_item', {
                    currency: 'INR',
                    value: viewPrice,
                    items: [{
                        item_id: data.product_id,
                        item_name: data.product_name,
                        price: viewPrice,
                        quantity: 1,
                        item_category: data.category || undefined,
                        item_brand: data.brand || undefined,
                    }],
                });
            }
        };

        load();
    }, [id]);

    useEffect(() => {
        if (product?.product_id) {
            getRatingSummary(product.product_id).then(res => {
                if (res.success && res.data) {
                    setRatingSummary(res.data);
                }
            });
        }
    }, [product?.product_id]);

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
                    image_url: product.thumbnail_url || '',
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

            <div className="min-h-screen bg-[#FDFCFB]">
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

    const { displayPrice, originalPrice } = getValidPrices(
        selectedVariant?.price ?? product.price,
        selectedVariant?.sale_price ?? selectedVariant?.original_price ?? product.original_price ?? selectedVariant?.price ?? product.price
    );
    const isOnSale = selectedVariant?.is_on_sale ?? product.is_on_sale ?? false;
    const isDiscounted = originalPrice > displayPrice;
    const calculatedDiscountPercent = isDiscounted ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
    const discountPercent = calculatedDiscountPercent > 0 ? calculatedDiscountPercent : (selectedVariant?.discount_percentage ?? product.discount_percentage ?? 0);

    // Variant Activity
    const isVariantInactive = selectedVariant?.status === 'Inactive' || selectedVariant?.is_active === false;

    // Stock availability
    const stockQty = selectedVariant?.stock_quantity ?? product.stock_quantity ?? null;
    const isOutOfStock = stockQty !== null && stockQty <= 0;

    // Account for items already in cart for this product/variant
    const existingCartItem = items.find(i =>
        selectedVariant
            ? String(i.variant_id) === String(selectedVariant.variant_id)
            : String(i.product_id) === String(product.product_id)
    );
    const existingCartQty = existingCartItem?.quantity ?? 0;
    const effectiveMaxQty = stockQty !== null && stockQty > 0 ? Math.max(1, stockQty - existingCartQty) : 99;
    const maxQty = stockQty !== null && stockQty > 0 ? stockQty : 99;

    // Scheduled availability
    const isComingSoon = product.is_coming_soon ?? false;
    const isExpired = product.is_availability_expired ?? false;
    const isUnavailable = isComingSoon || isExpired || isOutOfStock || isVariantInactive;

    const handleMinus = () => {
        setPageQuantity(prev => Math.max(1, prev - 1));
    };

    const handlePlus = () => {
        if (pageQuantity >= effectiveMaxQty) {
            toast('Maximum stock reached', { icon: '⚠️' });
            return;
        }
        setPageQuantity(prev => Math.min(effectiveMaxQty, prev + 1));
    };

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!product || isOutOfStock) return;


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
            image_url: product.thumbnail_url || '',
        };
        sessionStorage.setItem('ksp_buy_now_item', JSON.stringify(buyNowItem));
        sessionStorage.removeItem('vedashi_checkout_draft');
        router.push('/checkout?buyNow=true');
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] pb-16">
            {/* Breadcrumb */}
            <div className="border-b border-light-border bg-white py-1">
                <div className="mx-auto max-w-[1440px] px-4 py-1">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href="/products">Shop</Link>
                        <ChevronRight className="h-3 w-3" />
                        {product.category && (
                            <>
                                <Link href={`/products?category=${encodeURIComponent(product.category.toLowerCase().replace(/\s+/g, '-'))}`} className="hover:text-gray-900 transition-colors">
                                    {product.category}
                                </Link>
                                <ChevronRight className="h-3 w-3" />
                            </>
                        )}
                        <span className="text-gray-900 font-medium">{product.product_name}</span>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-[1420px] px-4 py-4">
                {/* ═══ ABOVE THE FOLD — loads immediately ═══ */}
                <div className="grid gap-2 lg:grid-cols-[50%_1fr] items-start">
                    {/* IMAGE GALLERY */}
                    <div className="w-full max-w-[700px] mx-auto lg:mx-0">
                        <ProductImageGallery
                            assets={product.assets}
                            productName={product.product_name}
                            variantId={selectedVariant?.variant_id}
                            defaultVariantId={product.variants?.find((v: ProductVariant) => v.is_default)?.variant_id || product.variants?.[0]?.variant_id}
                            fallbackImages={product.images}
                            brand={product.brand || undefined}
                            category={product.category || undefined}
                        />
                    </div>

                    {/* DETAILS */}
                    <div className="space-y-1.5 pt-0 pr-0 lg:pr-4">
                        {/* Product Badges */}
                        <div className="flex flex-wrap gap-2">
                            {product.is_best_seller && (
                                <span className="inline-flex items-center justify-center bg-[#91C934] text-white text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider leading-none">
                                    Bestseller
                                </span>
                            )}
                            {product.is_new_arrival && (
                                <span className="inline-flex items-center justify-center bg-[#91C934] text-white text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider leading-none">
                                    New Arrival
                                </span>
                            )}
                        </div>

                        {/* Title + Share */}
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                                <h1 className="text-2xl lg:text-[28px] font-bold !font-sans text-black leading-snug">
                                    {selectedVariant?.variant_name ?? variants?.[0]?.variant_name ?? product.product_name}
                                </h1>
                                {product.brand && (
                                    <div className="mt-1">
                                        <Link
                                            href={`/products?brand=${encodeURIComponent(product.brand)}`}
                                            className="text-sm font-semibold underline text-gray-500 hover:text-gray-700 transition-all"
                                        >
                                            {product.brand}
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleShare}
                                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#91C934] hover:border-[#91C934] hover:shadow-md transition-all group flex-shrink-0 mt-1"
                                title="Share product"
                            >
                                <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* Short description under title */}
                        {product.short_description && (
                            <p className="text-sm text-gray-500 leading-relaxed -mt-1">
                                {product.short_description}
                            </p>
                        )}

                        {/* Rating + Reviews row */}
                        {(Number(ratingSummary?.average_rating || product.avg_rating || 0) > 0 || (Number(ratingSummary?.total_reviews || product.review_count || 0) > 0)) ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => {
                                            const rating = Number(ratingSummary?.average_rating || product.avg_rating || 0);
                                            const fill = Math.min(1, Math.max(0, rating - i));
                                            return (
                                                <svg key={i} className="w-4 h-4" viewBox="0 0 24 24">
                                                    <defs>
                                                        <linearGradient id={`star-fill-${i}`}>
                                                            <stop offset={`${fill * 100}%`} stopColor="#FFD801" />
                                                            <stop offset={`${fill * 100}%`} stopColor="#E5E7EB" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path fill={`url(#star-fill-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            );
                                        })}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 ml-1">{Number(ratingSummary?.average_rating || product.avg_rating || 0).toFixed(1)}</span>
                                </div>
                                {(ratingSummary?.total_reviews || Number(product.review_count || 0)) > 0 && (
                                    <span className="text-sm text-gray-500">({Number(ratingSummary?.total_reviews || product.review_count || 0).toLocaleString()} review{(ratingSummary?.total_reviews || Number(product.review_count || 0)) !== 1 ? 's' : ''})</span>
                                )}
                                {Number((product as any).total_sold || 0) > 0 && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <span className="text-green-600">●</span> {(product as any).total_sold}+ bought this month
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No reviews yet</p>
                        )}


                        {/* Divider */}
                        <hr className="border-gray-100" />



                        {/* PRICE BLOCK */}
                        <div className="p-4 rounded-xl bg-[#F8F9FA] shadow-[inset_0_0_0_1px_#E9ECEF] space-y-1">
                            <div className="flex flex-col gap-1">
                                {isDiscounted && (
                                    <>
                                        <div className="text-[#1e3a8a] text-[13px] leading-none mb-1">
                                            <span className="font-black">WOW!</span> <span className="font-semibold">Limited Time Offer</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-[#C1262D] text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                                                {discountPercent}% OFF
                                            </span>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="text-gray-500">MRP</span>
                                                <span className="text-gray-400 line-through">
                                                    {formatPrice(originalPrice, (selectedVariant as any)?.country_prices || (product as any).country_prices)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-extrabold text-[#C1262D]">
                                        {formatPrice(displayPrice, (selectedVariant as any)?.country_prices || (product as any).country_prices)}
                                    </p>
                                    <span className="text-sm text-gray-500">
                                        {selectedVariant?.size_label && selectedVariant.size_label.toLowerCase() !== 'standard'
                                            ? `(${selectedVariant.size_label})`
                                            : 'Inclusive of all taxes'}
                                    </span>
                                </div>
                            </div>
                            {selectedVariant?.size_label && selectedVariant.size_label.toLowerCase() !== 'standard' && (
                                <p className="text-sm text-gray-500">Inclusive of all taxes</p>
                            )}
                            <hr className="border-gray-200" />
                            <div className="pt-2">
                                <p className="text-[11px] text-gray-400 uppercase tracking-tight leading-none mb-1">MRP</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold text-black">
                                        {formatPrice(originalPrice, (selectedVariant as any)?.country_prices || (product as any).country_prices)}
                                    </span>
                                    <span className="text-[12px] text-gray-400">(Inclusive of all taxes)</span>
                                </div>
                            </div>


                        </div>

                        {/* COUPON ROW */}
                        <div className="flex items-center justify-between border border-dashed border-gray-300 bg-[#FFFFFF] rounded-xl p-1 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-[#91C934]">
                                    <Tag size={18} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                    <span className="text-[15px] font-bold text-gray-800">Extra 10% OFF</span>
                                    <span className="text-sm text-gray-500">Only for New Users.</span>
                                </div>
                            </div>
                            <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-[13px] text-[#91C934] font-bold tracking-wider">Code : NEWUSER</span>
                            </div>
                        </div>

                        {/* GUARANTEED DELIVERY ROW */}
                        <div className="border border-dashed border-gray-300 rounded-lg p-2">
                            <div className="flex items-start gap-3">
                                <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800">
                                        Guaranteed delivery within <span className="font-bold text-[#91C934]">14 days </span>of ordering.
                                    </p>

                                </div>
                            </div>
                        </div>


                        {/* Divider */}
                        <hr className="border-gray-100" />


                        {/* ✅ VARIANT SELECTORS: Weight, Strength, Volume, Count, Flavor, Pack */}
                        <div className="min-h-[20px]">
                            {variants.length > 0 && (() => {
                                const uniqueWeights = [...new Set(variants.map((v: ProductVariant) => v.weight_g as number))].filter(Boolean).sort((a, b) => a - b);
                                const uniqueStrengths = [...new Set(variants.map((v: ProductVariant) => v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null))].filter(Boolean);
                                const uniqueVolumes = [...new Set(variants.map((v: ProductVariant) => v.volume_ml as number))].filter(Boolean).sort((a, b) => a - b);
                                const uniqueCounts = [...new Set(variants.map((v: ProductVariant) => v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null))].filter(Boolean);
                                const uniqueFlavors = [...new Set(variants.map((v: ProductVariant) => v.flavor as string))].filter(Boolean);
                                const uniquePacks = [...new Set(variants.map((v: ProductVariant) => (v.pack_quantity ?? 1) as number))].filter(Boolean).sort((a, b) => a - b);

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
                                        // A variant is "available" for a dimension/value if it matches everything ELSE currently selected
                                        const matchesWeight = dimension === 'weight' || !selectedWeight || v.weight_g === selectedWeight;
                                        const matchesStrength = dimension === 'strength' || !selectedStrength || (v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null) === selectedStrength;
                                        const matchesVolume = dimension === 'volume' || !selectedVolume || v.volume_ml === selectedVolume;
                                        const matchesCount = dimension === 'count' || !selectedCount || (v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null) === selectedCount;
                                        const matchesFlavor = dimension === 'flavor' || !selectedFlavor || v.flavor === selectedFlavor;
                                        const matchesPack = dimension === 'pack' || !selectedPack || (v.pack_quantity ?? 1) === selectedPack;

                                        let matchVal = false;
                                        if (dimension === 'weight') matchVal = v.weight_g === value;
                                        else if (dimension === 'strength') matchVal = (v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : null) === value;
                                        else if (dimension === 'volume') matchVal = v.volume_ml === value;
                                        else if (dimension === 'count') matchVal = (v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : null) === value;
                                        else if (dimension === 'flavor') matchVal = v.flavor === value;
                                        else if (dimension === 'pack') matchVal = (v.pack_quantity ?? 1) === value;

                                        return matchVal && matchesWeight && matchesStrength && matchesVolume && matchesCount && matchesFlavor && matchesPack && v.status !== 'Inactive' && v.is_active !== false;
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
                                                        <span className="text-sm text-gray-900 mr-2 font-medium">Weight:</span>
                                                        <span className="text-sm font-medium text-gray-900">{formatWeight(uniqueWeights[0])}</span>
                                                    </div>
                                                )}
                                                {hasSingleStrength && (
                                                    <div className="flex items-baseline">
                                                        <span className="text-sm text-gray-900 mr-2 font-medium">Strength:</span>
                                                        <span className="text-sm font-medium text-gray-900">{uniqueStrengths[0]}</span>
                                                    </div>
                                                )}
                                                {hasSingleVolume && (
                                                    <div className="flex items-baseline">
                                                        <span className="text-sm text-gray-900 mr-2 font-medium">Volume:</span>
                                                        <span className="text-sm font-medium text-gray-900">{formatVolume(uniqueVolumes[0])}</span>
                                                    </div>
                                                )}
                                                {hasSingleCount && (
                                                    <div className="flex items-baseline">
                                                        <span className="text-sm text-gray-900 mr-2 font-medium">Count:</span>
                                                        <span className="text-sm font-medium text-gray-900">{uniqueCounts[0]}</span>
                                                    </div>
                                                )}
                                                {hasSingleFlavor && (
                                                    <div className="flex items-baseline">
                                                        <span className="text-sm text-gray-900 mr-2 font-medium">Flavour:</span>
                                                        <span className="text-sm font-medium text-gray-900 capitalize">{uniqueFlavors[0]}</span>
                                                    </div>
                                                )}
                                                {hasSinglePack && (
                                                    <div className="flex items-baseline">
                                                        <span className="text-sm text-gray-900 mr-2 font-medium">Pack:</span>
                                                        <span className="text-sm font-medium text-gray-900">Pack of {uniquePacks[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Choose Weight / Size */}
                                        {uniqueWeights.length > 1 && (
                                            <div className="flex items-start gap-3">
                                                <p className="text-sm font-bold text-gray-900 w-[65px] pt-2.5 flex-shrink-0">Size</p>
                                                <div className="flex gap-2.5 flex-wrap flex-1">
                                                    {uniqueWeights.map((w) => {
                                                        const isSelected = selectedWeight === w;
                                                        const available = checkAvailable('weight', w);
                                                        const active = isOptionActive('weight', w);

                                                        return (
                                                            <button
                                                                key={w}
                                                                onClick={() => active && updateSelection({ weight: w })}
                                                                disabled={!active}
                                                                className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'bg-white text-[#91C934] border-[#91C934] border-2 shadow-sm'
                                                                        : !available
                                                                            ? 'border-gray-200 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#91C934] hover:text-[#91C934]'
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
                                            <div className="flex items-start gap-3">
                                                <p className="text-sm font-bold text-gray-900 w-[65px] pt-2.5 flex-shrink-0">Strength</p>
                                                <div className="flex gap-2.5 flex-wrap flex-1">
                                                    {uniqueStrengths.map((str) => {
                                                        const isSelected = selectedStrength === str;
                                                        const available = checkAvailable('strength', str);
                                                        const active = isOptionActive('strength', str);

                                                        return (
                                                            <button
                                                                key={str}
                                                                onClick={() => active && updateSelection({ strength: str })}
                                                                disabled={!active}
                                                                className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'bg-white text-[#91C934] border-[#91C934] border-2 shadow-sm'
                                                                        : !available
                                                                            ? 'border-gray-200 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#91C934] hover:text-[#91C934]'
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
                                            <div className="flex items-start gap-3">
                                                <p className="text-sm font-bold text-gray-900 w-[65px] pt-2.5 flex-shrink-0">Volume</p>
                                                <div className="flex gap-2.5 flex-wrap flex-1">
                                                    {uniqueVolumes.map((vol) => {
                                                        const isSelected = selectedVolume === vol;
                                                        const available = checkAvailable('volume', vol);
                                                        const active = isOptionActive('volume', vol);

                                                        return (
                                                            <button
                                                                key={vol}
                                                                onClick={() => active && updateSelection({ volume: vol })}
                                                                disabled={!active}
                                                                className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'bg-white text-[#91C934] border-[#91C934] border-2 shadow-sm'
                                                                        : !available
                                                                            ? 'border-gray-200 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#91C934] hover:text-[#91C934]'
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
                                            <div className="flex items-start gap-3">
                                                <p className="text-sm font-bold text-gray-900 w-[65px] pt-2.5 flex-shrink-0">Count</p>
                                                <div className="flex gap-2.5 flex-wrap flex-1">
                                                    {uniqueCounts.map((countStr) => {
                                                        const isSelected = selectedCount === countStr;
                                                        const available = checkAvailable('count', countStr);
                                                        const active = isOptionActive('count', countStr);

                                                        return (
                                                            <button
                                                                key={countStr}
                                                                onClick={() => active && updateSelection({ count: countStr })}
                                                                disabled={!active}
                                                                className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'bg-white text-[#91C934] border-[#91C934] border-2 shadow-sm'
                                                                        : !available
                                                                            ? 'border-gray-200 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#91C934] hover:text-[#91C934]'
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
                                            <div className="flex items-start gap-3">
                                                <p className="text-sm font-bold text-gray-900 w-[65px] pt-2.5 flex-shrink-0">Flavour</p>
                                                <div className="flex gap-2.5 flex-wrap flex-1">
                                                    {uniqueFlavors.map((flav) => {
                                                        const isSelected = selectedFlavor === flav;
                                                        const available = checkAvailable('flavor', flav);
                                                        const active = isOptionActive('flavor', flav);

                                                        return (
                                                            <button
                                                                key={flav}
                                                                onClick={() => active && updateSelection({ flavor: flav })}
                                                                disabled={!active}
                                                                className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'bg-white text-[#91C934] border-[#91C934] border-2 shadow-sm'
                                                                        : !available
                                                                            ? 'border-gray-200 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#91C934] hover:text-[#91C934]'
                                                                    }`}
                                                            >
                                                                {flav}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Pack of */}
                                        {uniquePacks.length > 1 && (
                                            <div className="flex items-start gap-3">
                                                <p className="text-sm font-bold text-gray-900 w-[65px] pt-3 flex-shrink-0">Pack of</p>
                                                <div className="flex gap-2.5 flex-wrap flex-1">
                                                    {uniquePacks.map((pack) => {
                                                        const isSelected = selectedPack === pack;
                                                        const available = checkAvailable('pack', pack);
                                                        const active = isOptionActive('pack', pack);

                                                        return (
                                                            <button
                                                                key={pack}
                                                                onClick={() => active && updateSelection({ pack })}
                                                                disabled={!active}
                                                                className={`w-11 h-11 rounded-full border text-sm font-semibold transition-all duration-200 flex items-center justify-center
                                                                    ${isSelected
                                                                        ? 'bg-white text-[#91C934] border-[#91C934] border-2 shadow-sm'
                                                                        : !available
                                                                            ? 'border-gray-200 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                            : 'bg-white border-gray-300 text-gray-700 hover:border-[#91C934] hover:text-[#91C934]'
                                                                    }`}
                                                            >
                                                                {pack}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                );
                            })()}
                        </div>




                        {/* STOCK BADGE (Hidden if available, shown if issues) */}
                        {isUnavailable && (
                            <div className="flex items-center gap-4 py-2">
                                {isComingSoon ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                        🕒 Coming Soon
                                    </div>
                                ) : isExpired ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                        <AlertTriangle size={12} /> Availability Ended
                                    </div>
                                ) : isOutOfStock && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                        <AlertTriangle size={12} /> Out of Stock
                                    </div>
                                )}
                            </div>
                        )}

                        {/* QUANTITY + ACTION BUTTONS ROW */}
                        <div className="pt-2">
                            {isOutOfStock ? (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                                        <AlertTriangle size={16} />
                                        <span>Notify me when back in stock</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            className="flex-1 px-4 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-white placeholder-red-300"
                                            value={restockEmail}
                                            onChange={(e) => setRestockEmail(e.target.value)}
                                        />
                                        <button
                                            onClick={handleRestockNotify}
                                            disabled={isRestockNotifying || !restockEmail}
                                            className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm whitespace-nowrap shadow-sm shadow-red-200"
                                        >
                                            {isRestockNotifying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Notify Me'}
                                        </button>
                                    </div>
                                </div>
                            ) : existingCartItem ? (
                                <div className="grid grid-cols-[auto_1fr_1fr] gap-3">
                                    {/* Qty Selector */}
                                    <div className="flex items-center justify-between border border-gray-300 rounded-lg p-1 bg-white h-[48px] w-[110px]">
                                        <button
                                            onClick={async () => {
                                                const newQty = existingCartQty - 1;
                                                if (newQty <= 0) {
                                                    await removeItem(existingCartItem.cart_item_id);
                                                    toast.success('Removed from cart');
                                                } else {
                                                    await updateQuantity(existingCartItem.cart_item_id, newQty);
                                                }
                                            }}
                                            disabled={cartLoading}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
                                        >
                                            {existingCartQty <= 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                                        </button>
                                        <span className="text-base font-bold text-gray-900">{existingCartQty}</span>
                                        <button
                                            onClick={async () => {
                                                const maxStock = stockQty ?? 99;
                                                if (existingCartQty >= maxStock) {
                                                    toast('Maximum stock reached', { icon: '⚠️' });
                                                    return;
                                                }
                                                await updateQuantity(existingCartItem.cart_item_id, existingCartQty + 1);
                                            }}
                                            disabled={cartLoading || existingCartQty >= (stockQty ?? 99)}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/${country || 'in'}/cart`)}
                                        className="w-full bg-white border border-gray-300 hover:border-[#91C934] text-gray-800 font-bold rounded-lg h-[48px] transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <ShoppingCart size={18} className="text-[#91C934]" /> View Cart
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        disabled={isUnavailable || cartLoading}
                                        className={`w-full rounded-lg py-2 flex justify-center items-center gap-2 font-bold transition-all h-[48px] ${isUnavailable
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                            : 'bg-[#91C934] hover:bg-[#7ab52a] text-white shadow-sm'
                                            }`}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-[auto_1fr_1fr] gap-3">
                                    {/* Qty Selector */}
                                    <div className="flex items-center justify-between border border-gray-300 rounded-lg p-1 bg-white h-[48px] w-[110px]">
                                        <button
                                            onClick={handleMinus}
                                            disabled={pageQuantity <= 1}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition disabled:opacity-30"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="text-base font-bold text-gray-900">{pageQuantity}</span>
                                        <button
                                            onClick={handlePlus}
                                            disabled={pageQuantity >= effectiveMaxQty}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition disabled:opacity-30"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={(e) => handleAddToCart(e)}
                                        disabled={isUnavailable || cartLoading}
                                        className={`w-full rounded-lg py-2 flex cursor-pointer justify-center items-center gap-2 font-semibold transition-all h-[48px] ${isUnavailable
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-[#91C934]'
                                            : 'bg-white border-2 border-[#91C934] hover:border-[#91C934] hover:bg-gray-50 text-[#91C934] shadow-sm'
                                            }`}
                                    >
                                        <ShoppingCart size={18} className={isUnavailable ? "text-gray-400" : "text-[#91C934]"} />
                                        {isComingSoon ? 'Coming Soon' : isExpired ? 'Unavailable' : isVariantInactive ? 'Unavailable' : 'Add to Cart'}
                                    </button>

                                    <button
                                        onClick={handleBuyNow}
                                        disabled={isUnavailable || cartLoading}
                                        className={`w-full rounded-lg py-2 flex cursor-pointer justify-center items-center gap-2 font-bold transition-all h-[48px] ${isUnavailable
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                            : 'bg-[#91C934] hover:bg-[#7ab52a] text-white shadow-sm'
                                            }`}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Removed old Trust Badges and Delivery Info to match cleaner reference layout */}
                    </div>
                </div>

                {/* ════ TABBED PRODUCT DESCRIPTION — Nykaa-style ════ */}
                {(product.description || product.intended_use || product.specifications) && (
                    <LazySection
                        minHeight="200px"
                        rootMargin="200px"
                        skeleton={
                            <section className="mt-6 border-t border-gray-100 pt-6">
                                <div className="space-y-4">
                                    <div className="h-6 w-40 rounded animate-shimmer" />
                                    <div className="h-4 w-full rounded animate-shimmer" />
                                    <div className="h-4 w-3/4 rounded animate-shimmer" />
                                </div>
                            </section>
                        }
                    >
                        <section className="mt-2 pt-2">
                            {/* WHY VEDASHI HIGHLIGHTS - Mamaearth Style */}
                            <div className="bg-[#f0f4ef] rounded-2xl p-4 mb-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#91C934] shadow-sm">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 leading-tight">Dermatologically<br />Tested</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#91C934] shadow-sm">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 leading-tight">Safe for<br />All Types</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#91C934] shadow-sm">
                                            <Award size={24} />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 leading-tight">Cruelty<br />Free</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#91C934] shadow-sm">
                                            <LeafIcon size={24} />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 leading-tight">100%<br />Natural</span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>

                            {/* Tab Headers */}
                            <div className="border-b border-gray-200 mb-0">
                                <div className="flex gap-0">
                                    {product.description && (
                                        <button
                                            onClick={() => setActiveInfoTab('description')}
                                            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'description'
                                                ? 'text-[#91C934]'
                                                : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            Description
                                            {activeInfoTab === 'description' && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#91C934] rounded-t-full" />
                                            )}
                                        </button>
                                    )}
                                    {product.intended_use && (
                                        <button
                                            onClick={() => setActiveInfoTab('howToUse')}
                                            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'howToUse'
                                                ? 'text-[#91C934]'
                                                : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            How To Use
                                            {activeInfoTab === 'howToUse' && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#91C934] rounded-t-full" />
                                            )}
                                        </button>
                                    )}
                                    {(product.specifications || product.country_of_origin || product.form || product.brand) && (
                                        <button
                                            onClick={() => setActiveInfoTab('specifications')}
                                            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'specifications'
                                                ? 'text-[#91C934]'
                                                : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            Specifications
                                            {activeInfoTab === 'specifications' && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#91C934] rounded-t-full" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="bg-white border border-t-0 border-gray-200 rounded-b-2xl p-6 lg:p-8 min-h-[200px]">
                                {/* Description Tab */}
                                {activeInfoTab === 'description' && product.description && (
                                    <div className="animate-fadeIn">
                                        <div className="text-[15px] text-gray-700 leading-[1.9] whitespace-pre-line">
                                            {isDescriptionExpanded || product.description.split(/\s+/).length <= 150
                                                ? product.description
                                                : product.description.split(/\s+/).slice(0, 150).join(' ') + '...'}
                                        </div>
                                        {product.description.split(/\s+/).length > 150 && (
                                            <button
                                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                className="mt-6 text-[#91C934] font-bold text-sm tracking-wide hover:underline flex items-center gap-1"
                                            >
                                                {isDescriptionExpanded ? 'Read Less ▲' : 'Read More ▼'}
                                            </button>
                                        )}

                                        {/* Key Features Highlights */}
                                        {product.specialities && product.specialities.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-gray-100">
                                                <p className="text-sm font-bold text-gray-900 mb-3">Features:</p>
                                                <ul className="space-y-2">
                                                    {product.specialities.map((s: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#91C934] flex-shrink-0" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* How To Use Tab */}
                                {activeInfoTab === 'howToUse' && product.intended_use && (
                                    <div className="animate-fadeIn">
                                        <div className="text-[15px] text-gray-700 leading-[1.9] whitespace-pre-line">
                                            {product.intended_use}
                                        </div>
                                    </div>
                                )}

                                {/* Specifications Tab */}
                                {activeInfoTab === 'specifications' && (
                                    <div className="animate-fadeIn">
                                        <div className="divide-y divide-gray-100">
                                            {product.brand && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Brand</span>
                                                    <span className="text-sm text-gray-900 font-semibold">{product.brand}</span>
                                                </div>
                                            )}
                                            {product.category && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Category</span>
                                                    <span className="text-sm text-gray-900">{product.category}</span>
                                                </div>
                                            )}
                                            {product.form && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Form</span>
                                                    <span className="text-sm text-gray-900 capitalize">{product.form}</span>
                                                </div>
                                            )}
                                            {product.country_of_origin && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Country of Origin</span>
                                                    <span className="text-sm text-gray-900 flex items-center gap-1.5">
                                                        <Globe className="h-3.5 w-3.5 text-gray-400" />
                                                        {product.country_of_origin}
                                                    </span>
                                                </div>
                                            )}
                                            {product.unit_of_measure && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Unit of Measure</span>
                                                    <span className="text-sm text-gray-900">{product.unit_of_measure}</span>
                                                </div>
                                            )}
                                            {product.specifications?.material && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Material</span>
                                                    <span className="text-sm text-gray-900">{product.specifications.material}</span>
                                                </div>
                                            )}
                                            {product.specifications?.weight_kg && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Weight</span>
                                                    <span className="text-sm text-gray-900">{product.specifications.weight_kg >= 1 ? `${product.specifications.weight_kg} kg` : `${Math.round(product.specifications.weight_kg * 1000)} g`}</span>
                                                </div>
                                            )}
                                            {product.specifications?.color && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Color</span>
                                                    <span className="text-sm text-gray-900 capitalize">{product.specifications.color}</span>
                                                </div>
                                            )}
                                            {product.specifications?.grade && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Grade</span>
                                                    <span className="text-sm text-gray-900">{product.specifications.grade}</span>
                                                </div>
                                            )}
                                            {product.specifications?.shelf_life_months && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Shelf Life</span>
                                                    <span className="text-sm text-gray-900">{product.specifications.shelf_life_months} months</span>
                                                </div>
                                            )}
                                            {(product.specifications?.length_cm || product.specifications?.width_cm || product.specifications?.height_cm) && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">Dimensions</span>
                                                    <span className="text-sm text-gray-900">
                                                        {[product.specifications.length_cm, product.specifications.width_cm, product.specifications.height_cm].filter(Boolean).join(' × ')} cm
                                                    </span>
                                                </div>
                                            )}
                                            {product.sku && (
                                                <div className="flex py-3">
                                                    <span className="text-sm text-gray-500 w-40 flex-shrink-0 font-medium">SKU</span>
                                                    <span className="text-sm text-gray-900 font-mono">{product.sku}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </LazySection>
                )}

                {/* REVIEWS SECTION — lazy loaded + dynamic import */}
                <div className="relative isolate w-full mt-6 pt-6 pb-6 overflow-hidden">


                    <div className="mx-auto max-w-[1440px] px-4 space-y-6">
                        {/* REVIEWS SECTION — lazy loaded + dynamic import */}
                        <LazySection
                            minHeight="300px"
                            rootMargin="300px"
                            skeleton={<SkeletonReviewSection />}
                        >
                            <ReviewSection
                                productId={product.product_id}
                                product={product}
                                selectedVariant={selectedVariant}
                                onAddToCart={handleAddToCart}
                            />
                        </LazySection>

                        {/* SIMILAR PRODUCTS — horizontal scroll carousel */}
                        <LazySection
                            minHeight="400px"
                            rootMargin="400px"
                            skeleton={<SkeletonProductRow title="Similar Products" />}
                        >
                            <SimilarProducts productId={product.product_id} />
                        </LazySection>

                        {/* BEST SELLERS — lazy loaded */}
                        <LazySection
                            minHeight="400px"
                            rootMargin="400px"
                            skeleton={<SkeletonProductRow title="Best Sellers" />}
                        >
                            <LazyBestSellers
                                title="Best Sellers"
                                icon={<Sparkles className="h-6 w-6 text-[#91C934]" />}
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

export default function ProductClientPage({ id, country, initialProduct }: Props) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cream animate-pulse" />}>
            <ProductDetailContent id={id} country={country} initialProduct={initialProduct} />
        </Suspense>
    );
}

'use client';

import { useState, useEffect, use, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getProduct, getProductDetails, getBestSellers, trackProductView, requestRestockNotification } from '@/lib/api';
import { trackEcommerce } from '@/lib/analytics/gtag';

import { useCurrency } from '@/context/CurrencyContext';
import { Product, ProductWithDetails, ProductVariant } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { SkeletonLine, SkeletonReviewSection, SkeletonProductRow } from '@/components/Skeleton';
import { Heart, ShoppingCart, Minus, Plus, Star, Truck, RotateCcw, ChevronRight, AlertTriangle, Sparkles, Info, Package, Award, BadgeCheck, Clock, Globe, Trash2 } from 'lucide-react';
import ProductImageGallery from '@/components/gallery/ProductImageGallery';
import LazySection from '@/components/lazy/LazySection';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { CheckCircle2, FlaskConical, Leaf as LeafIcon, ShieldCheck } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { hasDiscount, getDiscountPercent } from '@/utils/discount';

// Dynamic imports for below-fold sections
const ReviewSection = dynamic(
    () => import('@/components/reviews/ReviewSection'),
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

const ProductCarousel = dynamic(
    () => import('@/components/ProductCarousel'),
    { ssr: false }
);

interface Props {
    params: Promise<any>;
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
        <ProductCarousel
            title={title}
            icon={icon}
            products={products}
            loading={loading}
            idPrefix="best-sellers"
        />
    );
}


function ProductDetailContent({ params }: Props) {
    const { id, country } = use(params);
    const { formatPrice } = useCurrency();
    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
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
                const vs = data.variants.map((v: any) => {
                    let opts: any = {};
                    if (typeof v.options === 'string') {
                        try { opts = JSON.parse(v.options); } catch (e) {}
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

        // Validate total qty (existing in cart + requested) vs stock
        const totalAfterAdd = existingCartQty + pageQuantity;
        if (stockQty !== null && totalAfterAdd > stockQty) {
            const canAdd = stockQty - existingCartQty;
            if (canAdd <= 0) {
                toast('No more stock available — item is already at maximum in your cart', { icon: '⚠️' });
                return;
            }
            toast(`Only ${canAdd} more can be added (${existingCartQty} already in cart)`, { icon: '⚠️' });
            // Cap to what's available
            setPageQuantity(canAdd);
            return;
        }

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
            image_url: product.thumbnail_url || '',
        };
        sessionStorage.setItem('ksp_buy_now_item', JSON.stringify(buyNowItem));
        sessionStorage.removeItem('vedashi_checkout_draft');
        router.push('/checkout?buyNow=true');
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-16" style={{ backgroundImage: "url('/botanical-page-bg.png')", backgroundAttachment: 'fixed', backgroundSize: '600px' }}>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateProductJsonLd({
                    ...product,
                    review_count: Number(product.review_count || 0)
                } as any)) }}
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
            <div className="border-b border-light-border bg-white py-1">
                <div className="mx-auto max-w-7xl px-4 py-1">
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

            <div className="mx-auto max-w-7xl px-4 py-6">
                {/* ═══ ABOVE THE FOLD — loads immediately ═══ */}
                <div className="grid gap-10 lg:grid-cols-2 items-start">
                    {/* IMAGE GALLERY */}
                    <div>
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
                    <div className="space-y-5 pt-0 pr-4 lg:min-h-[700px]">
                        {/* Vedashi Badges */}


                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 italic tracking-tight leading-[1.1]">
                            {selectedVariant?.variant_name ?? variants?.[0]?.variant_name ?? product.product_name}
                        </h1>

                        {(product.review_count && Number(product.review_count) > 0) ? (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex text-[#C5A46D]">
                                    {[...Array(5)].map((_, i) => {
                                        const rating = Number(product.avg_rating) || 0;
                                        const fill = Math.min(1, Math.max(0, rating - i));
                                        return (
                                            <svg key={i} className="w-4 h-4" viewBox="0 0 24 24">
                                                <defs>
                                                    <linearGradient id={`star-fill-${i}`}>
                                                        <stop offset={`${fill * 100}%`} stopColor="#C5A46D" />
                                                        <stop offset={`${fill * 100}%`} stopColor="#E5E7EB" />
                                                    </linearGradient>
                                                </defs>
                                                <path fill={`url(#star-fill-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        );
                                    })}
                                </div>
                                <span className="text-sm text-gray-500">({product.review_count} Verified Review{Number(product.review_count) !== 1 ? 's' : ''})</span>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 mt-2">No reviews yet</p>
                        )}

                        {/* PRICE */}
                        <div className="flex items-end gap-3 mt-4">
                            {selectedVariant && hasDiscount(selectedVariant) ? (
                                <>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPrice(displayPrice, (selectedVariant as any)?.country_prices || (product as any).country_prices)}
                                    </p>
                                    <p className="text-base text-gray-400 line-through mb-0.5">
                                        {formatPrice(selectedVariant?.discount_base_price ?? 0, (selectedVariant as any)?.country_prices || (product as any).country_prices)}
                                    </p>
                                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-0.5">
                                        {getDiscountPercent(selectedVariant)}% OFF
                                    </span>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPrice(displayPrice, (selectedVariant as any)?.country_prices || (product as any).country_prices)} <span className="text-sm font-normal text-gray-500">/ set</span>
                                    </p>
                                    {isOnSale && originalPrice && (
                                        <>
                                            <p className="text-base text-gray-400 line-through mb-0.5">
                                                {formatPrice(originalPrice, (selectedVariant as any)?.country_prices || (product as any).country_prices)}
                                            </p>
                                            <span className="bg-[#3d5c3a]/10 text-[#3d5c3a] text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide mb-1">
                                                {discountPercent}% OFF
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {product.short_description && (
                            <p className="text-[15px] leading-relaxed text-gray-600">
                                {product.short_description}
                            </p>
                        )}

                        {/* ✅ VARIANT SELECTORS: Weight, Strength, Volume, Count, Flavor, Pack */}
                        <div className="min-h-[120px]">
                        {variants.length > 0 && (() => {
                            // --- CHECK IF ANY VARIANT HAS OPTIONS JSONB ---
                            const optionsKeysMap = new Map<string, Set<string>>();
                            variants.forEach((v: any) => {
                                if (v.options && typeof v.options === 'object') {
                                    Object.keys(v.options).forEach(k => {
                                        if (v.options[k] !== null && v.options[k] !== undefined && String(v.options[k]).trim() !== '') {
                                            if (!optionsKeysMap.has(k)) optionsKeysMap.set(k, new Set());
                                            optionsKeysMap.get(k)!.add(String(v.options[k]));
                                        }
                                    });
                                }
                            });
                            
                            const hasOptionsJson = optionsKeysMap.size > 0;

                            if (hasOptionsJson) {
                                // --- PRIMARY LOGIC: Driven by options JSONB ---
                                const updateOptionSelection = (optionKey: string, optionValue: string) => {
                                    const currentOpts = selectedVariant?.options || {};
                                    const targetOpts = { ...currentOpts, [optionKey]: optionValue };

                                    // Find exact match (matches all target options)
                                    let match = variants.find((v: any) => {
                                        if (v.status === 'Inactive' || v.is_active === false) return false;
                                        const vOpts = v.options || {};
                                        return Object.keys(targetOpts).every(k => String(vOpts[k]) === String(targetOpts[k]));
                                    });

                                    // If no exact match, fallback to finding the first variant that matches the MOST RECENTLY updated option
                                    if (!match) {
                                        match = variants.find((v: any) => {
                                            if (v.status === 'Inactive' || v.is_active === false) return false;
                                            return String((v.options || {})[optionKey]) === optionValue;
                                        });
                                    }

                                    if (match) {
                                        setSelectedVariant(match);
                                        // Update fallback stat variables just in case
                                        setSelectedWeight(match.weight_g || null);
                                        setSelectedStrength(match.strength ? `${match.strength} ${match.strength_unit || ''}`.trim() : null);
                                        setSelectedVolume(match.volume_ml || null);
                                        setSelectedCount(match.units_count ? `${match.units_count} ${match.form_factor || 'Units'}` : null);
                                        setSelectedFlavor(match.flavor || null);
                                        setSelectedPack(match.pack_quantity ?? 1);
                                    }
                                };

                                return (
                                    <div className="space-y-4">
                                        {Array.from(optionsKeysMap.entries()).map(([key, uniqueValsSet]) => {
                                            const uniqueVals = Array.from(uniqueValsSet);
                                            // 1. Single Value -> show as simple text
                                            // Make sure we never show the variant logic pills if it's a single value
                                            if (uniqueVals.length === 1) {
                                                return (
                                                    <div key={key} className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2 pb-2">
                                                        <div className="flex items-baseline">
                                                            <span className="text-sm text-gray-500 mr-2">{key}:</span>
                                                            <span className="text-sm font-medium text-gray-900">{uniqueVals[0]}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            // 2. Multiple Values -> show as pills
                                            const currentSelectedVal = String((selectedVariant?.options as any)?.[key] || '');
                                            return (
                                                <div key={key} className="mb-4">
                                                    <p className="text-sm font-semibold mb-2">{key}:</p>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {uniqueVals.map(val => {
                                                            const isSelected = currentSelectedVal === val;
                                                            // Check if ANY active variant exists for this option value
                                                            const active = variants.some((v: any) => String((v.options || {})[key] || '') === val && v.status !== 'Inactive' && v.is_active !== false);

                                                            return (
                                                                <button
                                                                    key={val}
                                                                    onClick={() => active && updateOptionSelection(key, val)}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !active
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-not-allowed text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
                                                                        }`}
                                                                >
                                                                    {val}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            // --- FALLBACK LOGIC: Driven by dimension columns ---
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
                                                            const isSelected = selectedWeight === w;
                                                            const available = checkAvailable('weight', w);
                                                            const active = isOptionActive('weight', w);
                                                            
                                                            return (
                                                                <button
                                                                    key={w}
                                                                    onClick={() => active && updateSelection({ weight: w })}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !available
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
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
                                                            const isSelected = selectedStrength === str;
                                                            const available = checkAvailable('strength', str);
                                                            const active = isOptionActive('strength', str);

                                                            return (
                                                                <button
                                                                    key={str}
                                                                    onClick={() => active && updateSelection({ strength: str })}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !available
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
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
                                                            const isSelected = selectedVolume === vol;
                                                            const available = checkAvailable('volume', vol);
                                                            const active = isOptionActive('volume', vol);

                                                            return (
                                                                <button
                                                                    key={vol}
                                                                    onClick={() => active && updateSelection({ volume: vol })}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !available
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
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
                                                            const isSelected = selectedCount === countStr;
                                                            const available = checkAvailable('count', countStr);
                                                            const active = isOptionActive('count', countStr);

                                                            return (
                                                                <button
                                                                    key={countStr}
                                                                    onClick={() => active && updateSelection({ count: countStr })}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !available
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
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
                                                            const isSelected = selectedFlavor === flav;
                                                            const available = checkAvailable('flavor', flav);
                                                            const active = isOptionActive('flavor', flav);

                                                            return (
                                                                <button
                                                                    key={flav}
                                                                    onClick={() => active && updateSelection({ flavor: flav })}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !available
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
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
                                                            const isSelected = selectedPack === pack;
                                                            const available = checkAvailable('pack', pack);
                                                            const active = isOptionActive('pack', pack);

                                                            return (
                                                                <button
                                                                    key={pack}
                                                                    onClick={() => active && updateSelection({ pack })}
                                                                    disabled={!active}
                                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
                                                                    ${isSelected
                                                                            ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-lg scale-[1.02]'
                                                                            : !available
                                                                                ? 'border-gray-300 border-dashed text-gray-400 bg-gray-50/30 cursor-pointer text-xs'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#edf5ed] hover:border-[#3d5c3a]/40 hover:text-[#3d5c3a] hover:shadow-md'
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
                        </div>

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

                            {!isUnavailable && !existingCartItem && (
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
                                        disabled={pageQuantity >= effectiveMaxQty}
                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-600"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* QUANTITY + CART */}
                        <div className="space-y-4 pt-4 mt-2">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between border border-[#3d5c3a] shadow-[0px_0px_0px_2px_rgba(61,92,58,0.1)] rounded-xl py-1 px-2 bg-white h-[56px] animate-in fade-in">
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
                                            className="w-10 h-10 flex items-center justify-center text-[#3d5c3a] hover:bg-[#3d5c3a]/10 rounded-lg transition"
                                        >
                                            {existingCartQty <= 1 ? <Trash2 size={18} /> : <Minus size={18} />}
                                        </button>
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-base font-black text-[#3d5c3a] leading-none mb-0.5">{existingCartQty}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-warm-gray leading-none">In Cart</span>
                                        </div>
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
                                            className="w-10 h-10 flex items-center justify-center text-[#3d5c3a] bg-[#3d5c3a]/5 hover:bg-[#3d5c3a]/15 hover:text-black rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => router.push(`/${country || 'in'}/cart`)}
                                        className="w-full bg-[#f8f5f0] border border-[#e8e1d5] hover:bg-white hover:border-[#3d5c3a] hover:text-[#3d5c3a] text-[#36453A] font-bold rounded-xl h-[56px] transition-colors flex items-center justify-center gap-2 group shadow-sm"
                                    >
                                        <ShoppingCart size={18} className="group-hover:-translate-y-0.5 group-hover:scale-105 transition-transform" /> View Cart
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={(e) => handleAddToCart(e)}
                                        disabled={isUnavailable || cartLoading}
                                        className={`w-full rounded-xl py-4 flex justify-center items-center gap-2 transition-all font-semibold h-[56px] ${isUnavailable
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                            : 'bg-[#7a8f69] hover:bg-[#6b805a] text-white shadow-sm'
                                            }`}
                                    >
                                        <ShoppingCart size={18} />
                                        {isComingSoon ? 'Coming Soon' : isExpired ? 'Unavailable' : isVariantInactive ? 'Option Unavailable' : 'Add to Cart'}
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
                            )}
                        </div>

                        {/* TRUST BADGES */}
                        <div className="grid grid-cols-3 gap-2 pt-4 pb-1">
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

                        {/* SELLER & DELIVERY INFO GRID — Aligned side-by-side */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                                <div className="px-3 py-2.5">
                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700">
                                        <BadgeCheck className="h-3.5 w-3.5 text-[#3d5c3a]" />
                                        <span>100% Genuine</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 mt-1">
                                        <RotateCcw className="h-3.5 w-3.5 text-[#3d5c3a]" />
                                        <span>Easy Returns</span>
                                    </div>
                                </div>
                                <div className="px-3 py-2 text-[10px] text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <Package className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Sold by: <strong className="text-gray-700">Vedashi Wellness</strong></span>
                                    </span>
                                </div>
                            </div>

                            <div className="bg-[#f8f6f3] rounded-xl p-3 flex flex-col justify-center space-y-2">
                                <div className="flex items-start gap-2">
                                    <Truck className="h-4 w-4 text-[#3d5c3a] mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-900">Free Shipping</p>
                                        <p className="text-[10px] text-gray-500 leading-tight">Above ₹499. Delivered in 3-7 days</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-[#3d5c3a] mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-900">Cash on Delivery</p>
                                        <p className="text-[10px] text-gray-500 leading-tight">Pay at your doorstep</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ BELOW THE FOLD — lazy loaded ═══ */}

                {/* NEW: ANCIENT ROOTS SECTION */}
                <LazySection
                    minHeight="500px"
                    rootMargin="200px"
                    skeleton={<div className="h-[500px] w-full rounded-2xl bg-gray-100 animate-pulse mt-6" />}
                >
                    <section className="mt-6 bg-[#3d5c3a] rounded-3xl overflow-hidden text-[#FAF7F2]">
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
                        <section className="mt-6 pt-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>

                            {/* Tab Headers */}
                            <div className="border-b border-gray-200 mb-0">
                                <div className="flex gap-0">
                                    {product.description && (
                                        <button
                                            onClick={() => setActiveInfoTab('description')}
                                            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'description'
                                                    ? 'text-[#1d351d]'
                                                    : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            Description
                                            {activeInfoTab === 'description' && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1d351d] rounded-t-full" />
                                            )}
                                        </button>
                                    )}
                                    {product.intended_use && (
                                        <button
                                            onClick={() => setActiveInfoTab('howToUse')}
                                            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'howToUse'
                                                    ? 'text-[#1d351d]'
                                                    : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            How To Use
                                            {activeInfoTab === 'howToUse' && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1d351d] rounded-t-full" />
                                            )}
                                        </button>
                                    )}
                                    {(product.specifications || product.country_of_origin || product.form || product.brand) && (
                                        <button
                                            onClick={() => setActiveInfoTab('specifications')}
                                            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'specifications'
                                                    ? 'text-[#1d351d]'
                                                    : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            Specifications
                                            {activeInfoTab === 'specifications' && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1d351d] rounded-t-full" />
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
                                                className="mt-6 text-[#1d351d] font-bold text-sm tracking-wide hover:underline flex items-center gap-1"
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
                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#3d5c3a] flex-shrink-0" />
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
                    {/* Shadow Background Illustration (Absolute positioned) */}
                    <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.03] flex justify-center items-center">
                        {/* A massive placeholder SVG for the "shadow leaves" effect */}
                        <svg viewBox="0 0 1000 1000" className="w-[150%] max-w-none transform min-w-[1200px]" preserveAspectRatio="xMidYMid slice">
                            <path fill="currentColor" d="M374.4,-331.1C470.9,-201.5,524.8,-42.9,493.4,87.9C462.1,218.7,345.5,321.7,211.5,410.6C77.4,499.5,-74.2,574.4,-190.2,525C-306.2,475.6,-386.5,301.9,-438.4,124.7C-490.3,-52.5,-513.7,-233.1,-437.4,-352C-361," />
                            <path fill="currentColor" transform="translate(400, 200) scale(0.8) rotate(45)" d="M434.3,-463.8C545,-387.8,604,-221.9,642.3,-45.8C680.7,130.3,698.3,316.5,614.9,451.3C531.5,586.2,347,669.7,157.9,681C-31.1,692.3,-224.8,631.3,-375.3,533C-525.8,434.8,-633.2,299.3,-667,144C-700.8,-11.3,-661.1,-186.4,-575.4,-322.6C-489.6,-458.8,-357.7,-556,-212.8,-575.3C-67.9,-594.7,89,-536.2,234.3,-480.1" />
                        </svg>
                    </div>

                    <div className="mx-auto max-w-7xl px-4 space-y-6">
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
                                icon={<Sparkles className="h-6 w-6 text-[#3d5c3a]" />}
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

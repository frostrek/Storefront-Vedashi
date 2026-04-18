'use client';

import Link from 'next/link';
import { gsap } from 'gsap';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye, X, Check, AlertTriangle, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { getRatingSummary, getProductDetails } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import StarRating from '@/components/reviews/StarRating';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { trackEcommerce } from '@/lib/analytics/gtag';
import { hasDiscount, getDiscountPercent } from '@/utils/discount';


const BLUR_DATA_URL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmNWYyIi8+PC9zdmc+';

interface ProductCardProps {
    product: Product;
    onMoveToCart?: (e: React.MouseEvent) => void;
    priority?: boolean;
    layout?: 'grid' | 'list';
    listName?: string;
    listIndex?: number;
}

export default function ProductCard({ product, onMoveToCart, priority = false, layout = 'grid', listName, listIndex }: ProductCardProps) {
    const params = useParams();
    const { formatPrice } = useCurrency();
    const { isInWishlist, toggleItem } = useWishlist();
    const { addItem, updateQuantity, removeItem, items, loading: cartLoading } = useCart();
    const wishlisted = isInWishlist(product.product_id);
    const isList = layout === 'list';

    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    // Variant preview / Cart modal state
    const [showCartModal, setShowCartModal] = useState(false);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [justAdded, setJustAdded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [showInlineOptions, setShowInlineOptions] = useState(false);
    const inlineOptionsRef = useRef<HTMLDivElement>(null);

    // ─── New refs for layered animation ───────────────────────────────────────
    const inlineContentRef = useRef<HTMLDivElement>(null);  // inner scrollable content
    const borderLineRef = useRef<HTMLDivElement>(null);  // the animated left-edge line
    const variantButtonsRef = useRef<HTMLDivElement>(null);  // grid of variant buttons

    const closeInlineOptions = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowInlineOptions(false);
    }, []);

    // ─── Multi-layer GSAP timeline ────────────────────────────────────────────
    useEffect(() => {
        if (!inlineOptionsRef.current || !isList) return;

        if (showInlineOptions) {
            const tl = gsap.timeline();

            // 1. Wrapper: width expand + clip-path wipe from left to right
            tl.fromTo(
                inlineOptionsRef.current,
                { width: 0, clipPath: 'inset(0 100% 0 0 round 12px)', opacity: 1 },
                { width: 344, clipPath: 'inset(0 0% 0 0 round 0px)', duration: 0.52, ease: 'expo.out' }
            );

            // 2. Top accent bar draws left → right
            if (borderLineRef.current) {
                tl.fromTo(
                    borderLineRef.current,
                    { scaleX: 0, transformOrigin: 'left center' },
                    { scaleX: 1, duration: 0.4, ease: 'expo.out' },
                    '<0.08'
                );
            }

            // 3. Inner content arrives from right with parallax offset
            if (inlineContentRef.current) {
                tl.fromTo(
                    inlineContentRef.current,
                    { x: 32, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.45, ease: 'expo.out' },
                    '<0.06'
                );
            }

            // 4. Variant buttons cascade up with stagger
            if (variantButtonsRef.current) {
                const btns = variantButtonsRef.current.querySelectorAll<HTMLElement>('[data-variant-btn]');
                if (btns.length > 0) {
                    tl.fromTo(
                        btns,
                        { y: 12, opacity: 0, scale: 0.97 },
                        { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.32, ease: 'back.out(1.4)' },
                        '<0.08'
                    );
                }
            }

        } else {
            // Collapse: content exits right, wrapper wipes back out
            const tl = gsap.timeline();

            if (inlineContentRef.current) {
                tl.to(inlineContentRef.current, {
                    x: 18, opacity: 0, duration: 0.18, ease: 'power2.in',
                });
            }
            if (borderLineRef.current) {
                tl.to(borderLineRef.current, {
                    scaleX: 0, transformOrigin: 'right center', duration: 0.18, ease: 'power2.in',
                }, '<');
            }
            tl.to(inlineOptionsRef.current, {
                clipPath: 'inset(0 100% 0 0 round 12px)',
                width: 0,
                duration: 0.32,
                ease: 'expo.in',
            }, '<0.04');
        }
    }, [showInlineOptions, isList]);

    const triggerAddedFeedback = useCallback(() => {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1000);
    }, []);



    useEffect(() => {
        if (product.avg_rating !== undefined && product.review_count !== undefined) {
            setAvgRating(Number(product.avg_rating) || 0);
            setTotalReviews(Number(product.review_count) || 0);
            return;
        }
        getRatingSummary(product.product_id).then(res => {
            if (res.success && res.data) {
                setAvgRating(res.data.average_rating ?? 0);
                setTotalReviews(res.data.total_reviews ?? 0);
            }
        }).catch(() => { });
    }, [product.product_id, product.avg_rating, product.review_count]);

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(product);
    };

    // Determine if product has variants from the product data
    const hasVariants = (product.variant_count ?? 0) > 1 || (product.variants?.length ?? 0) > 1;

    // Display values (default variant or product level)
    const displayPrice = product.price ?? 0;
    const isOnSale = product.is_on_sale ?? false;
    const originalPrice = product.original_price ?? displayPrice;
    const discountPercent = product.discount_percentage ?? 0;

    const imageSrc = product.thumbnail_url || product.images?.[0] || '/herbal_placeholder.png';
    const isExternal = imageSrc.startsWith('http');
    const isBase64 = imageSrc.startsWith('data:');
    const productUrl = `/products/${product.slug || product.product_id}`;

    const closeCartModal = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsClosing(true);
        setTimeout(() => {
            setShowCartModal(false);
            setIsClosing(false);
        }, 280);
    }, []);

    // Intersection Observer for view_item_list tracking
    useEffect(() => {
        if (!cardRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    trackEcommerce('view_item_list', {
                        currency: 'INR',
                        value: displayPrice,
                        items: [{
                            item_id: product.product_id,
                            item_name: product.product_name,
                            item_list_name: listName || 'category',
                            index: listIndex || 0,
                            price: displayPrice,
                            quantity: 1,
                            item_category: product.category,
                            item_brand: product.brand
                        }]
                    });
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });
        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [product.product_id, product.product_name, listName, listIndex, displayPrice, product.category, product.brand]);

    // Track view_item when the quick-view modal opens
    useEffect(() => {
        if (showCartModal) {
            trackEcommerce('view_item', {
                currency: 'INR',
                value: displayPrice,
                items: [{
                    item_id: product.product_id,
                    item_name: product.product_name,
                    price: displayPrice,
                    quantity: 1,
                    item_category: product.category,
                    item_brand: product.brand
                }]
            });
        }
    }, [showCartModal, product.product_id, product.product_name, displayPrice, product.category, product.brand]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showCartModal && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                closeCartModal();
            }
            if (showInlineOptions && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                closeInlineOptions();
            }
        };

        if (showCartModal || showInlineOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCartModal, closeCartModal, showInlineOptions, closeInlineOptions]);

    // Unified action for the card's CTA
    const openCartModal = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!hasVariants) {
            const maxStock = product.stock_quantity ?? 99;
            if (maxStock <= 0) {
                toast.error('This item is out of stock');
                return;
            }

            // Check if item already in cart at max stock
            const existingInCart = items.find(i => i.product_id === product.product_id);
            if (existingInCart && existingInCart.quantity >= maxStock) {
                toast('No more stock available', { icon: '⚠️' });
                return;
            }

            setAddingToCart(true);
            try {


                const variantIdToUse = product.default_variant_id || null;
                await addItem(product.product_id, variantIdToUse, 1);
                toast.success(`${product.product_name} added to cart!`);
                setQuantity(1);
                triggerAddedFeedback();
            } catch {
                toast.error('Failed to update cart');
            } finally {
                setAddingToCart(false);
            }
            return;
        }

        if (isList) {
            setShowInlineOptions(true);
        } else {
            setShowCartModal(true);
            setIsClosing(false);
        }

        if (variants.length > 0) {
            const defaultV = selectedVariant || variants.find((v: ProductVariant) => v.is_default === true) || variants[0];
            const existing = items.find(i => i.variant_id === defaultV.variant_id);
            setQuantity(existing ? existing.quantity : 1);
            return;
        }

        setLoadingVariants(true);
        try {
            const details = await getProductDetails(product.product_id);
            if (details?.variants?.length) {
                setVariants(details.variants);
                const defaultV = details.variants.find((v: ProductVariant) => v.is_default === true) || details.variants[0];
                setSelectedVariant(defaultV);
                const existing = items.find(i => i.variant_id === defaultV.variant_id);
                setQuantity(existing ? existing.quantity : 1);
            }
        } catch {
            toast.error('Could not load variant options');
        } finally {
            setLoadingVariants(false);
        }
    }, [product.product_id, product.default_variant_id, product.product_name, product.stock_quantity, variants, selectedVariant, hasVariants, items, isList, addItem, triggerAddedFeedback]);

    // Unified add to cart from modal
    const handleModalAddToCart = async (e: React.MouseEvent) => {
        if (hasVariants && !selectedVariant) return;

        const maxStock = hasVariants && selectedVariant
            ? (selectedVariant.stock_quantity ?? 99)
            : (product.stock_quantity ?? 99);

        if (maxStock <= 0) {
            toast.error('This item is out of stock');
            return;
        }

        setAddingToCart(true);
        try {


            const variantIdToUse = (hasVariants && selectedVariant) ? selectedVariant.variant_id : (product.default_variant_id || null);
            await addItem(product.product_id, variantIdToUse, quantity);

            trackEcommerce('add_to_cart', {
                currency: 'INR',
                value: ((hasVariants && selectedVariant) ? (selectedVariant.price ?? 0) : displayPrice) * quantity,
                items: [{
                    item_id: product.product_id,
                    item_name: product.product_name,
                    price: (hasVariants && selectedVariant) ? (selectedVariant.price ?? 0) : displayPrice,
                    quantity: quantity,
                    item_category: product.category,
                    item_brand: product.brand,
                }]
            });

            toast.success(`${product.product_name} added to cart!`);
            triggerAddedFeedback();
        } catch {
            toast.error('Failed to update cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const currentItemInCart = items.find(i =>
        hasVariants
            ? i.variant_id === selectedVariant?.variant_id
            : i.product_id === product.product_id
    );
    const isInCart = !!currentItemInCart;

    const handleIncrement = async () => {
        if (!currentItemInCart) return;
        setAddingToCart(true);
        try {
            const maxStock = hasVariants && selectedVariant
                ? (selectedVariant.stock_quantity ?? 99)
                : (currentItemInCart.stock_quantity ?? product.stock_quantity ?? 99);

            if (currentItemInCart.quantity < maxStock) {
                const newQty = currentItemInCart.quantity + 1;
                await updateQuantity(currentItemInCart.cart_item_id, newQty);
                setQuantity(newQty);
                toast.success('Cart updated successfully!');
            } else {
                toast.error('Max stock reached.');
            }
        } catch {
            toast.error('Failed to update cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleDecrement = async () => {
        if (!currentItemInCart) return;
        setAddingToCart(true);
        try {
            if (currentItemInCart.quantity > 1) {
                const newQty = currentItemInCart.quantity - 1;
                await updateQuantity(currentItemInCart.cart_item_id, newQty);
                setQuantity(newQty);
                toast.success('Cart updated successfully!');
            } else {
                await removeItem(currentItemInCart.cart_item_id);
                setQuantity(1);
                toast.success(currentItemInCart.product_name + ' removed from cart');
            }
        } catch {
            toast.error('Failed to update cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const isComingSoon = product.is_coming_soon ?? false;
    const isExpired = product.is_availability_expired ?? false;
    const isUnavailable = isComingSoon || isExpired;


    const renderInlineOptions = () => {
        if (!isList) return null;

        return (
            // ── Outer wrapper: GSAP drives clipPath wipe + width ─────────────
            <div
                ref={inlineOptionsRef}
                className="relative h-full flex-shrink-0 overflow-hidden"
                style={{ width: 0, clipPath: 'inset(0 100% 0 0 round 12px)' }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                {/* ── Frosted panel background ────────────────────────────────── */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#fff5f5] via-white to-[#fffafa] border-l border-[#FF0000]/10" />

                {/* ── Top accent bar: draws left → right via GSAP scaleX ──────── */}
                <div
                    ref={borderLineRef}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF0000] via-[#ff4d4d] to-transparent rounded-b"
                    style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
                />

                {/* ── Inner content: slides in from right (parallax) ─────────── */}
                <div
                    ref={inlineContentRef}
                    className="relative w-[320px] h-full flex flex-col py-3 px-4"
                    style={{ opacity: 0 }}
                >
                    {/* ── Header ────────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-[#FF0000] text-white text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full leading-none">
                                <Eye className="h-2.5 w-2.5" />
                                Options
                            </span>
                            {variants.length > 0 && (
                                <span className="text-[9px] font-semibold text-gray-400 tabular-nums">
                                    {variants.length} available
                                </span>
                            )}
                        </div>
                        <button
                            onClick={closeInlineOptions}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100/80 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all cursor-pointer group"
                        >
                            <X className="h-3 w-3 group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                    </div>

                    {/* ── Variant list ──────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto max-h-[180px] hidden-scroll -mx-1 px-1">
                        {loadingVariants ? (
                            // ── Skeleton rows ──────────────────────────────────
                            <div className="flex flex-col gap-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between h-9 px-3 rounded-xl bg-gray-100/70 animate-pulse">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full bg-gray-200" />
                                            <div className="w-20 h-2.5 rounded bg-gray-200" style={{ width: `${48 + i * 16}px` }} />
                                        </div>
                                        <div className="w-10 h-2.5 rounded bg-gray-200" />
                                    </div>
                                ))}
                            </div>
                        ) : variants.length > 0 ? (
                            <div ref={variantButtonsRef} className="flex flex-col gap-1">
                                {variants.map((v: ProductVariant) => {
                                    const isSelected = selectedVariant?.variant_id === v.variant_id;
                                    const isInactive = v.status === 'Inactive' || v.is_active === false;
                                    const isOut = v.stock_quantity !== null && v.stock_quantity !== undefined && v.stock_quantity <= 0;
                                    const isDisabled = isOut || isInactive;

                                    const formatVolume = (ml: number) => {
                                        if (!ml) return '';
                                        return ml >= 999 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`;
                                    };
                                    const formatWeight = (g: number) => {
                                        if (!g) return '';
                                        return g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : g % 100 === 0 ? 1 : 2)} kg` : `${Math.round(g)} g`;
                                    };
                                    const volLabel = formatVolume(v.volume_ml ?? 0);
                                    const weightLabel = formatWeight(v.weight_g ?? 0);
                                    const countLabel = v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : '';
                                    const strengthLabel = v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : '';
                                    const labelParts = [
                                        weightLabel, volLabel,
                                        (product.common_form && countLabel === product.common_form) ? '' : countLabel,
                                        (product.common_strength && strengthLabel === product.common_strength) ? '' : strengthLabel,
                                        (product.common_flavor && v.flavor === product.common_flavor) ? '' : (v.flavor ?? ''),
                                        (v.pack_quantity ?? 0) > 1 ? `Pack of ${v.pack_quantity ?? 0}` : ''
                                    ].filter(Boolean);
                                    
                                    let parsedOptions = v.options;
                                    if (typeof parsedOptions === 'string') {
                                        try { parsedOptions = JSON.parse(parsedOptions); } catch (e) {}
                                    }
                                    let optionsValList: string[] = [];
                                    if (parsedOptions && typeof parsedOptions === 'object') {
                                        optionsValList = Object.values(parsedOptions).filter(val => val !== null && val !== undefined && String(val).trim() !== '').map(String);
                                    }
                                    
                                    const label = optionsValList.length > 0 
                                        ? optionsValList.join(' · ') 
                                        : (labelParts.join(' · ') || v.sku || 'Standard');

                                    return (
                                        <button
                                            key={v.variant_id}
                                            data-variant-btn
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    setSelectedVariant(v);
                                                    const existing = items.find(i => i.variant_id === v.variant_id);
                                                    setQuantity(existing ? existing.quantity : 1);
                                                }
                                            }}
                                            disabled={isDisabled}
                                            className={`
                                                relative w-full flex items-start gap-2.5
                                                px-3 py-2.5 rounded-xl text-left outline-none
                                                transition-all duration-200 cursor-pointer
                                                focus-visible:ring-2 focus-visible:ring-[#FF0000]/40
                                                overflow-hidden group
                                                ${isSelected
                                                    ? 'bg-[#FF0000] shadow-[0_3px_12px_rgba(255,0,0,0.28)] scale-[1.01]'
                                                    : isDisabled
                                                        ? 'bg-gray-50 opacity-40 cursor-not-allowed'
                                                        : 'bg-white border border-gray-100 hover:border-[#FF0000]/25 hover:bg-[#fff5f5] hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            {/* Left accent stripe (selected only) */}
                                            {isSelected && (
                                                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/30 rounded-l-xl" />
                                            )}

                                            {/* Radio dot — aligned to first text line */}
                                            <span className={`
                                                flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full border-2
                                                flex items-center justify-center transition-all duration-150
                                                ${isSelected
                                                    ? 'border-white/60 bg-white/20'
                                                    : 'border-gray-300 group-hover:border-[#FF0000]/50'
                                                }
                                            `}>
                                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </span>

                                            {/* Label + price stacked */}
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                {/* Full label — wraps naturally, never truncated */}
                                                <span className={`
                                                    text-[11.5px] font-bold font-ui leading-snug
                                                    ${isSelected ? 'text-white' : 'text-gray-800'}
                                                `}>
                                                    {label}
                                                </span>

                                                {/* Price + status row */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`
                                                        text-[11px] font-black font-ui px-2 py-0.5 rounded-full
                                                        transition-all duration-150
                                                        ${isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-gray-100 text-gray-700 group-hover:bg-[#FF0000]/10 group-hover:text-[#FF0000]'
                                                        }
                                                    `}>
                                                        {formatPrice(v.price, v.country_prices || product.country_prices)}
                                                    </span>
                                                    {hasDiscount(v) ? (
                                                        <>
                                                            <span className={`text-[10px] line-through ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
                                                                {formatPrice(v.discount_base_price ?? 0, v.country_prices || product.country_prices)}
                                                            </span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-red-500/20 text-red-100' : 'text-red-500 bg-red-50'}`}>
                                                                {getDiscountPercent(v)}% OFF
                                                            </span>
                                                        </>
                                                    ) : (
                                                        v.is_on_sale && v.original_price && (
                                                            <span className={`text-[10px] line-through ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
                                                                {formatPrice(v.original_price, v.country_prices || product.country_prices)}
                                                            </span>
                                                        )
                                                    )}
                                                    {!isInactive && isOut && (
                                                        <span className="text-[9px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">
                                                            Out of stock
                                                        </span>
                                                    )}
                                                    {isInactive && (
                                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                            Unavailable
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-5">No options available.</p>
                        )}
                    </div>

                    {/* ── Footer CTA ────────────────────────────────────────────── */}
                    <div className="mt-3 pt-3 border-t border-[#FF0000]/10">
                        {!isInCart ? (
                            <button
                                onClick={(e) => handleModalAddToCart(e)}
                                disabled={!!(
                                    (hasVariants && !selectedVariant) ||
                                    addingToCart || cartLoading || justAdded ||
                                    (hasVariants && selectedVariant && (selectedVariant.stock_quantity ?? 0) <= 0)
                                )}
                                className={`
                                    w-full py-2.5 rounded-xl text-white text-[11px] font-bold
                                    flex items-center justify-center gap-2 transition-all duration-200
                                    active:scale-[0.97] disabled:opacity-50
                                    ${justAdded
                                        ? 'bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.35)]'
                                        : 'bg-[#FF0000] hover:bg-red-700 shadow-[0_4px_14px_rgba(255,0,0,0.25)] hover:shadow-[0_6px_18px_rgba(255,0,0,0.35)]'
                                    }
                                `}
                            >
                                {addingToCart
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : justAdded
                                        ? <Check className="h-3.5 w-3.5" />
                                        : <ShoppingCart className="h-3.5 w-3.5" />
                                }
                                <span>
                                    {addingToCart
                                        ? 'Adding to cart...'
                                        : justAdded
                                            ? 'Added to bag!'
                                            : selectedVariant
                                                ? `Add to Cart · ${formatPrice((selectedVariant?.price ?? 0) * quantity, (selectedVariant as any)?.country_prices || (product as any).country_prices)}`
                                                : 'Select an option'
                                    }
                                </span>
                            </button>
                        ) : (
                            /* ── In-cart stepper ──────────────────────────────── */
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecrement(); }}
                                    disabled={addingToCart}
                                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer shadow-sm"
                                >
                                    {currentItemInCart.quantity > 1 ? <Minus className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                </button>

                                <div className="flex-1 flex flex-col items-center justify-center bg-[#FF0000]/5 rounded-xl py-0.5 border border-[#FF0000]/10 min-w-[32px]">
                                    <p className="text-[7px] font-bold text-[#FF0000]/60 uppercase tracking-widest leading-none mb-0.5">in cart</p>
                                    <p className="text-sm font-black text-[#FF0000] leading-none">{currentItemInCart.quantity}</p>
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleIncrement(); }}
                                    disabled={addingToCart}
                                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#FF0000] text-white hover:bg-red-700 transition-all cursor-pointer shadow-sm shadow-[#FF0000]/30"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Helper to build variant label
    const buildVariantLabel = (v: ProductVariant) => {
        const formatVolume = (ml: number) => {
            if (!ml) return '';
            return ml >= 999 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`;
        };
        const formatWeight = (g: number) => {
            if (!g) return '';
            return g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : g % 100 === 0 ? 1 : 2)} kg` : `${Math.round(g)} g`;
        };
        const volLabel = formatVolume(v.volume_ml ?? 0);
        const weightLabel = formatWeight(v.weight_g ?? 0);
        const countLabel = v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : '';
        const strengthLabel = v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : '';
        const labelParts = [
            weightLabel, volLabel,
            (product.common_form && countLabel === product.common_form) ? '' : countLabel,
            (product.common_strength && strengthLabel === product.common_strength) ? '' : strengthLabel,
            (product.common_flavor && v.flavor === product.common_flavor) ? '' : (v.flavor ?? ''),
            (v.pack_quantity ?? 0) > 1 ? `Pack of ${v.pack_quantity ?? 0}` : ''
        ].filter(Boolean);
        return labelParts.join(' · ') || v.sku || 'Standard';
    };

    // Add a specific variant to cart directly
    const handleVariantDirectAdd = async (v: ProductVariant, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const isOut = v.stock_quantity !== null && v.stock_quantity !== undefined && (v.stock_quantity ?? 0) <= 0;
        if (isOut) {
            toast.error('This variant is out of stock');
            return;
        }
        setAddingToCart(true);
        try {
            await addItem(product.product_id, v.variant_id, 1);
            trackEcommerce('add_to_cart', {
                currency: 'INR',
                value: (v.price ?? 0),
                items: [{
                    item_id: product.product_id,
                    item_name: product.product_name,
                    price: v.price ?? 0,
                    quantity: 1,
                    item_category: product.category,
                    item_brand: product.brand,
                }]
            });
            toast.success(`${product.product_name} added to cart!`);
        } catch {
            toast.error('Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    // Increment/decrement a specific variant in cart
    const handleVariantIncrement = async (cartItem: typeof items[0]) => {
        setAddingToCart(true);
        try {
            const v = variants.find(vr => vr.variant_id === cartItem.variant_id);
            const maxStock = v ? (v.stock_quantity ?? 99) : 99;
            if (cartItem.quantity < maxStock) {
                await updateQuantity(cartItem.cart_item_id, cartItem.quantity + 1);
            } else {
                toast.error('Max stock reached.');
            }
        } catch {
            toast.error('Failed to update cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleVariantDecrement = async (cartItem: typeof items[0]) => {
        setAddingToCart(true);
        try {
            if (cartItem.quantity > 1) {
                await updateQuantity(cartItem.cart_item_id, cartItem.quantity - 1);
            } else {
                await removeItem(cartItem.cart_item_id);
            }
        } catch {
            toast.error('Failed to update cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const renderCartModal = () => {
        if (!showCartModal && !isClosing) return null;

        const modalBody = (
            <>
                {/* Header with product name */}
                <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1 pr-6">{product.product_name}</h4>
                    <button
                        onClick={closeCartModal}
                        className="absolute top-2.5 right-2.5 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer text-gray-500"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Variant rows — Blinkit style */}
                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 thin-scrollbar">
                    {hasVariants ? (
                        loadingVariants ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Loading options
                                </p>
                            </div>
                        ) : variants.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {variants.map((v: ProductVariant) => {
                                    const isInactive = v.status === 'Inactive' || v.is_active === false;
                                    const isOut = v.stock_quantity !== null && v.stock_quantity !== undefined && (v.stock_quantity ?? 0) <= 0;
                                    const isDisabled = isOut || isInactive;
                                    const label = buildVariantLabel(v);
                                    const variantCartItem = items.find(ci => ci.variant_id === v.variant_id);
                                    const variantInCart = !!variantCartItem;

                                    return (
                                        <div
                                            key={v.variant_id}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 ${isDisabled ? 'opacity-40' : ''}`}
                                        >
                                            {/* Variant thumbnail */}
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 relative">
                                                {v.is_on_sale && v.discount_percentage && (
                                                    <span className="absolute top-0 left-0 bg-blue-600 text-white text-[6px] font-bold px-1 py-[1px] rounded-br-md leading-none z-10">
                                                        {Math.round(v.discount_percentage)}% OFF
                                                    </span>
                                                )}
                                                <Image
                                                    src={imageSrc}
                                                    alt={label}
                                                    width={40}
                                                    height={40}
                                                    className="object-contain w-full h-full"
                                                />
                                            </div>

                                            {/* Label + Price */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-1">{label}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[12px] font-bold text-gray-900">
                                                        {formatPrice(v.price, v.country_prices || product.country_prices)}
                                                    </span>
                                                    {(v.is_on_sale || (v.original_price && v.price && v.original_price > v.price)) && (
                                                        <span className="text-[10px] text-gray-400 line-through">
                                                            {formatPrice(v.original_price!, v.country_prices || product.country_prices)}
                                                        </span>
                                                    )}
                                                </div>
                                                {isOut && !isInactive && (
                                                    <p className="text-[9px] text-red-500 font-semibold mt-0.5">Out of stock</p>
                                                )}
                                                {isInactive && (
                                                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Unavailable</p>
                                                )}
                                            </div>

                                            {/* ADD button or stepper per variant */}
                                            <div className="flex-shrink-0 relative z-20">
                                                {isDisabled ? (
                                                    <span className="text-[10px] text-gray-400 font-semibold">—</span>
                                                ) : variantInCart ? (
                                                    <div className="flex items-center gap-0 border border-[#FF0000] rounded-lg overflow-hidden shadow-sm">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVariantDecrement(variantCartItem!); }}
                                                            disabled={addingToCart}
                                                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-red-50 transition-colors cursor-pointer text-gray-500 hover:text-red-500"
                                                        >
                                                            {variantCartItem!.quantity > 1 ? <Minus className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                        </button>
                                                        <span className="w-6 text-center text-[12px] font-bold text-[#FF0000] bg-[#FF0000]/5">
                                                            {variantCartItem!.quantity}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVariantIncrement(variantCartItem!); }}
                                                            disabled={addingToCart}
                                                            className="w-7 h-7 flex items-center justify-center bg-[#FF0000] hover:bg-red-700 transition-colors cursor-pointer text-white"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => handleVariantDirectAdd(v, e)}
                                                        disabled={addingToCart}
                                                        className="px-2 py-1.5 border border-[#FF0000] rounded-lg text-[11px] font-bold text-[#FF0000] bg-white hover:bg-[#FF0000]/5 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        ADD
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-6">No options available.</p>
                        )
                    ) : null}
                </div>
            </>
        );

        return (
            <div
                className={`absolute bottom-0 left-0 right-0 h-[70%] z-50 bg-white rounded-2xl border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {modalBody}
            </div>
        );
    };

    return (
        <>
            <div className="relative group block h-full" ref={cardRef}>
                {/* ═══════ FRONT OF CARD ═══════ */}
                <div className={`h-full bg-white transition-all duration-300 ${isList ? 'overflow-hidden flex flex-row p-3 border border-gray-100 hover:bg-gray-50/50 hover:border-[#FF0000]/30 rounded-2xl gap-4 sm:gap-6 items-center shadow-sm hover:shadow-md' : 'flex flex-col rounded-2xl overflow-visible'}`}>
                    <div className={`relative overflow-hidden bg-gradient-to-br from-[#f5f2ed] to-[#ece6dd] ${isList ? 'w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] rounded-xl flex-shrink-0 border border-gray-100/50' : 'rounded-2xl border border-gray-200 mx-2 mt-2'}`} style={isList ? {} : { aspectRatio: '5 / 4' }}>
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            {isBase64 ? (
                                <img
                                    src={imageSrc}
                                    alt={product.product_name}
                                    className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    loading={priority ? 'eager' : 'lazy'}
                                    decoding="async"
                                />
                            ) : isExternal ? (
                                <Image
                                    src={imageSrc}
                                    alt={product.product_name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                                    priority={priority}
                                    loading={priority ? undefined : 'lazy'}
                                    placeholder="blur"
                                    blurDataURL={BLUR_DATA_URL}
                                />
                            ) : (
                                <Image
                                    src={imageSrc}
                                    alt={product.product_name}
                                    width={400}
                                    height={400}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    priority={priority}
                                    loading={priority ? undefined : 'lazy'}
                                    placeholder="blur"
                                    blurDataURL={BLUR_DATA_URL}
                                />
                            )}
                        </div>

                        {/* Wishlist (Grid only) */}
                        {!isList && (
                            <button
                                onClick={handleToggleWishlist}
                                className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow-sm transition-all hover:scale-110 hover:shadow-md z-20 cursor-pointer"
                            >
                                <Heart
                                    className={`h-3.5 w-3.5 transition ${wishlisted
                                        ? 'fill-[#3d5c3a] text-[#3d5c3a]'
                                        : 'text-gray-400'
                                        }`}
                                />
                            </button>
                        )}

                        {/* Product Badges (Top Left Stack) */}
                        <div className={`absolute ${isList ? 'left-2 top-2' : 'left-2 top-2'} flex flex-col gap-1 z-10`}>
                            {product.category && (
                                <span className="rounded-full bg-[#01CC00] px-2 py-0.5 text-[8px] tracking-[0.1em] text-white uppercase font-black font-ui shadow-sm w-fit mb-0.5">
                                    {product.category}
                                </span>
                            )}
                            {isExpired && !isComingSoon && (
                                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black tracking-[0.1em] text-white uppercase font-ui w-fit">
                                    Expired
                                </span>
                            )}
                            {isComingSoon && (
                                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[8px] font-black tracking-[0.1em] text-white uppercase font-ui w-fit">
                                    Coming Soon
                                </span>
                            )}
                            {product.is_best_seller && !isComingSoon && (
                                <span className="rounded-full bg-[#FFD801] px-2 py-0.5 text-[8px] font-black tracking-[0.1em] text-white uppercase font-ui w-fit">
                                    Best Seller
                                </span>
                            )}
                            {product.is_new_arrival && !isComingSoon && (
                                <span className="rounded-full bg-[#FF0000] px-2 py-0.5 text-[8px] font-black tracking-[0.1em] text-white uppercase font-ui w-fit">
                                    New
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ═══ Always-visible ADD button (Grid only) — outside image overflow ═══ */}
                    {!isUnavailable && !isList && (
                        <div className="relative">
                            <div className="absolute bottom-6 right-4 translate-y-1/2 z-30">
                                {/* Single variant: show ADD or quantity stepper */}
                                {!hasVariants ? (
                                    isInCart && currentItemInCart ? (
                                        /* ── Quantity stepper pill ── */
                                        <div className="flex items-center bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden">
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecrement(); }}
                                                disabled={addingToCart}
                                                className="w-7 h-7 flex items-center justify-center bg-white hover:bg-red-50 transition-colors cursor-pointer text-gray-500 hover:text-red-500 border-r border-gray-100"
                                            >
                                                {currentItemInCart.quantity > 1 ? <Minus className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                            </button>
                                            <div className="px-1.5 flex flex-col items-center justify-center min-w-[28px]">
                                                <span className="text-[6.5px] font-bold text-gray-400 uppercase tracking-wider leading-none">QTY</span>
                                                <span className="text-[12px] font-black text-[#FF0000] leading-tight">{currentItemInCart.quantity}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleIncrement(); }}
                                                disabled={addingToCart}
                                                className="w-7 h-7 flex items-center justify-center bg-[#FF0000] hover:bg-red-700 transition-colors cursor-pointer text-white"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        /* ── ADD button (single variant) ── */
                                        <button
                                            onClick={(e) => onMoveToCart ? onMoveToCart(e) : openCartModal(e)}
                                            disabled={cartLoading || addingToCart || justAdded}
                                            className={`relative flex items-center justify-center px-2.5 py-1.5 bg-white border-2 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-all duration-200 cursor-pointer ${addingToCart || justAdded
                                                ? 'border-[#FF0000] bg-[#FF0000]'
                                                : 'border-[#FF0000] hover:bg-gray-50'
                                                }`}
                                        >
                                            {addingToCart ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                            ) : justAdded ? (
                                                <Check className="h-4 w-4 text-white" />
                                            ) : (
                                                <span className="text-[13px] font-extrabold text-[#FF0000] tracking-wide">ADD</span>
                                            )}
                                        </button>
                                    )
                                ) : (
                                    /* ── ADD button (multi-variant) with "X options" ── */
                                    <button
                                        onClick={openCartModal}
                                        className={`relative flex flex-col items-center px-3 py-1.5 bg-white border-2 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-all duration-200 cursor-pointer ${showCartModal
                                            ? 'border-[#FF0000] bg-[#FF0000]/5'
                                            : 'border-[#FF0000] hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-[13px] font-extrabold text-[#FF0000] tracking-wide leading-tight">ADD</span>
                                        <span className="text-[8px] font-semibold text-gray-400 leading-none mt-[1px]">
                                            {product.variant_count ?? product.variants?.length ?? 0} options
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className={`p-2 sm:p-2 ${isList ? 'flex-1 flex flex-col justify-center min-w-0 p-0 sm:pr-3' : 'pt-5'}`}>
                        {/* Price Display */}
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2 px-1 text-[#91C935]">
                            <span className="font-black text-[15px] sm:text-[17px] leading-none py-0.5">
                                {formatPrice(displayPrice, product.country_prices)}
                            </span>
                            {(discountPercent > 0 || originalPrice > displayPrice) && (
                                <span className="text-gray-400 line-through text-[11px] sm:text-xs font-bold font-ui">
                                    {formatPrice(originalPrice, product.country_prices)}
                                </span>
                            )}
                        </div>

                        {/* Dashed green separator */}
                        <div className="border-b border-dashed border-[#91CA35] mb-2 sm:mb-2.5" />

                        <h3 className={`font-sans font-bold text-gray-900 leading-snug sm:leading-tight mb-0.5 sm:mb-1 ${isList ? 'text-lg sm:text-xl line-clamp-1 sm:line-clamp-2' : 'text-sm sm:text-[14px] line-clamp-2'}`}>
                            <Link
                                href={productUrl}
                                className="after:absolute after:inset-0 after:z-10"
                                onClick={() => {
                                    trackEcommerce('select_item', {
                                        currency: 'INR',
                                        value: Number(displayPrice),
                                        items: [{
                                            item_id: product.product_id,
                                            item_name: product.product_name,
                                            price: Number(displayPrice),
                                            quantity: 1,
                                            item_category: product.category,
                                            item_brand: product.brand,
                                            item_list_name: listName,
                                            index: listIndex,
                                        }]
                                    });
                                }}
                            >
                                {product.product_name}
                            </Link>
                        </h3>

                        {product.brand && (
                            <Link
                                href={`/${params.country || 'in'}/products?brand=${encodeURIComponent(product.brand)}`}
                                className={`relative z-20 block uppercase tracking-[0.12em] text-gray-400 font-medium mb-1 sm:mb-1.5 hover:text-[#3d5c3a] transition-colors cursor-pointer ${isList ? 'text-[10px] sm:text-[11px]' : 'text-[9px]'}`}
                            >
                                {product.brand}
                            </Link>
                        )}

                        {isList && product.category && (
                            <div className="flex items-center gap-2 mb-2">
                                <span className="rounded leading-none bg-[#3d5c3a]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] tracking-widest text-[#3d5c3a] uppercase font-bold border border-[#3d5c3a]/10">
                                    {product.category}
                                </span>
                            </div>
                        )}

                        {/* Rating */}
                        {avgRating > 0 && (
                            <div className="inline-flex items-center w-fit mb-2 sm:mb-2.5 relative z-20">
                                <div className="inline-flex items-center gap-[2px] bg-gradient-to-r from-[#FFD801]/15 to-transparent rounded-l-full pr-2 pl-1.5 py-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[12px] h-[12px] fill-[#FFD801] text-[#FFD801] mt-[0.5px]">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <span className="text-[12px] font-bold text-[#FFD801] leading-none mt-0.5">
                                        {avgRating % 1 === 0 ? avgRating.toFixed(1) : parseFloat(avgRating.toFixed(1))}
                                    </span>
                                </div>
                                {totalReviews > 0 && (
                                    <span className="text-[11px] font-medium text-gray-500 leading-none mt-0.5 -ml-1.5">
                                        ({Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(totalReviews).toLowerCase()})
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Short Description */}
                        {product.short_description && (
                            <p className={`text-[11px] sm:text-xs text-gray-500 mb-2 leading-relaxed ${isList ? 'line-clamp-2' : 'line-clamp-1'}`}>
                                {product.short_description}
                            </p>
                        )}
                        {/* Shared Variant Attributes (Visible if common across all options) */}
                        {/* Shared attributes at the bottom */}
                        {((product.variant_count ?? 0) > 1 || (product.variants?.length ?? 0) > 1) && (product.common_form || product.common_strength || product.common_flavor) && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {[product.common_form, product.common_strength, product.common_flavor]
                                    .filter(Boolean)
                                    .map((attr, idx) => (
                                        <span
                                            key={idx}
                                            className="text-[10px] font-bold tracking-wide text-[#FF0000] uppercase bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full"
                                        >
                                            {attr}
                                        </span>
                                    ))
                                }
                            </div>
                        )}

                        {/* List view: inline action buttons */}
                        {isList && !isUnavailable && (
                            <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3 relative z-30">
                                {hasVariants ? (
                                    <button
                                        onClick={openCartModal}
                                        className={`
                                                inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5
                                                text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-2 sm:py-2.5
                                                rounded-lg transition-all duration-200 cursor-pointer shadow-sm
                                                ${showInlineOptions
                                                ? 'bg-red-800 text-white shadow-[0_0_0_3px_rgba(255,0,0,0.2)]'
                                                : 'bg-[#FF0000] text-white hover:bg-red-700 hover:shadow'
                                            }
                                            `}
                                    >
                                        <Eye className={`h-3.5 w-3.5 transition-transform duration-300 ${showInlineOptions ? 'scale-110' : ''}`} />
                                        {showInlineOptions ? 'Choosing…' : 'Options'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => onMoveToCart ? onMoveToCart(e) : openCartModal(e)}
                                        disabled={cartLoading || addingToCart || justAdded}
                                        className={`inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-70 ${justAdded ? 'bg-emerald-600' : 'bg-[#FF0000] hover:bg-red-700'}`}
                                    >
                                        {addingToCart ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : justAdded ? (
                                            <Check className="h-3.5 w-3.5" />
                                        ) : (
                                            <ShoppingCart className="h-3.5 w-3.5" />
                                        )}
                                        <span className="truncate">{addingToCart ? 'Adding...' : justAdded ? 'Added' : 'Add to Cart'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleWishlist}
                                    className={`relative z-30 inline-flex flex-shrink-0 items-center justify-center p-2.5 sm:p-2.5 rounded-lg border transition-all cursor-pointer ${wishlisted ? 'border-red-500/30 bg-red-50' : 'border-gray-200 bg-white hover:border-red-500/30 hover:bg-gray-50'}`}
                                >
                                    <Heart className={`h-4 w-4 sm:h-4 sm:w-4 ${wishlisted ? 'fill-[#FF0000] text-[#FF0000]' : 'text-gray-400'}`} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Inline Options Panel (List View Only) */}
                    {isList && (
                        <div className="relative z-40">
                            {renderInlineOptions()}
                        </div>
                    )}
                </div>
                {/* ═══════ CART / VARIANT OVERLAY ═══════ */}
                {renderCartModal()}
            </div>

            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100%); opacity: 0; }
                }
                @keyframes slideUpAbove {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDownAbove {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(10px); opacity: 0; }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .animate-slide-down {
                    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .animate-slide-up-above {
                    animation: slideUpAbove 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .animate-slide-down-above {
                    animation: slideDownAbove 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                @keyframes breathe {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.98); }
                }
                .animate-breathe {
                    animation: breathe 4s ease-in-out infinite;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite !important;
                }
                /* Hide scrollbars but keep scrollability */
                .hidden-scroll::-webkit-scrollbar { display: none; }
                .hidden-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                
                .thin-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .thin-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .thin-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
                .thin-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #e5e7eb transparent;
                }

                /* Pulse skeleton */
                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }
                .animate-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
            `}</style>
        </>
    );
}
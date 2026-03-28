'use client';

import Link from 'next/link';
import { gsap } from 'gsap';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye, X, Check, AlertTriangle, Loader2, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { getRatingSummary, getProductDetails } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import StarRating from '@/components/reviews/StarRating';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';


const BLUR_DATA_URL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmNWYyIi8+PC9zdmc+';

interface ProductCardProps {
    product: Product;
    onMoveToCart?: (e: React.MouseEvent) => void;
    priority?: boolean;
    layout?: 'grid' | 'list';
}

export default function ProductCard({ product, onMoveToCart, priority = false, layout = 'grid' }: ProductCardProps) {
    const { formatPrice } = useCurrency();
    const { isInWishlist, toggleItem } = useWishlist();
    const { addItem, updateQuantity, removeItem, items, loading: cartLoading } = useCart();
    const wishlisted = isInWishlist(product.product_id);
    const isList = layout === 'list';

    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    // Variant preview / Cart modal state
    const [showCartModal, setShowCartModal] = useState(false);
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
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
        if ((product as any).avg_rating !== undefined && (product as any).review_count !== undefined) {
            setAvgRating(Number((product as any).avg_rating) || 0);
            setTotalReviews(Number((product as any).review_count) || 0);
            return;
        }
        getRatingSummary(product.product_id).then(res => {
            if (res.success && res.data) {
                setAvgRating(res.data.average_rating ?? 0);
                setTotalReviews(res.data.total_reviews ?? 0);
            }
        }).catch(() => { });
    }, [product.product_id, (product as any).avg_rating, (product as any).review_count]);

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(product);
    };

    // Determine if product has variants from the product data
    const hasVariants = (product as any).variant_count > 1 || (product as any).variants?.length > 1;

    // Display values (default variant or product level)
    const displayPrice = product.price ?? 0;
    const isOnSale = product.is_on_sale ?? false;
    const originalPrice = product.original_price ?? displayPrice;
    const discountPercent = product.discount_percentage ?? 0;

    const imageSrc = (product as any).thumbnail_url || product.images?.[0] || '/herbal_placeholder.png';
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
            const maxStock = (product as any).stock_quantity ?? 99;
            if (maxStock <= 0) {
                toast.error('This item is out of stock');
                return;
            }

            setAddingToCart(true);
            try {
                const rect = e.currentTarget.getBoundingClientRect();
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;
                window.dispatchEvent(new CustomEvent('add-to-cart-butterfly', {
                    detail: { startX, startY }
                }));

                const variantIdToUse = (product as any).default_variant_id || null;
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
            const defaultV = selectedVariant || variants.find((v: any) => v.is_default === true) || variants[0];
            const existing = items.find(i => i.variant_id === defaultV.variant_id);
            setQuantity(existing ? existing.quantity : 1);
            return;
        }

        setLoadingVariants(true);
        try {
            const details = await getProductDetails(product.product_id);
            if (details?.variants?.length) {
                setVariants(details.variants);
                const defaultV = details.variants.find((v: any) => v.is_default === true) || details.variants[0];
                setSelectedVariant(defaultV);
                const existing = items.find(i => i.variant_id === defaultV.variant_id);
                setQuantity(existing ? existing.quantity : 1);
            }
        } catch {
            toast.error('Could not load variant options');
        } finally {
            setLoadingVariants(false);
        }
    }, [product.product_id, variants, selectedVariant, hasVariants, items]);

    // Unified add to cart from modal
    const handleModalAddToCart = async (e: React.MouseEvent) => {
        if (hasVariants && !selectedVariant) return;

        const maxStock = hasVariants
            ? (selectedVariant.stock_quantity ?? 99)
            : ((product as any).stock_quantity ?? 99);

        if (maxStock <= 0) {
            toast.error('This item is out of stock');
            return;
        }

        setAddingToCart(true);
        try {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            window.dispatchEvent(new CustomEvent('add-to-cart-butterfly', {
                detail: { startX, startY }
            }));

            const variantIdToUse = hasVariants ? selectedVariant.variant_id : ((product as any).default_variant_id || null);
            await addItem(product.product_id, variantIdToUse, quantity);
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
            const maxStock = hasVariants
                ? (selectedVariant.stock_quantity ?? 99)
                : ((product as any).stock_quantity ?? 99);

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
                <div className="absolute inset-0 bg-gradient-to-br from-[#f3f8f3] via-white to-[#f8fbf8] border-l border-[#3d5c3a]/10" />

                {/* ── Top accent bar: draws left → right via GSAP scaleX ──────── */}
                <div
                    ref={borderLineRef}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3d5c3a] via-[#5a8a56] to-transparent rounded-b"
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
                            <span className="inline-flex items-center gap-1 bg-[#3d5c3a] text-white text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full leading-none">
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
                                {variants.map((v: any) => {
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
                                    const volLabel = formatVolume(v.volume_ml);
                                    const weightLabel = formatWeight(v.weight_g);
                                    const countLabel = v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : '';
                                    const strengthLabel = v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : '';
                                    const labelParts = [
                                        v.size_label, weightLabel, volLabel, countLabel,
                                        strengthLabel, v.flavor,
                                        v.pack_quantity > 1 ? `Pack of ${v.pack_quantity}` : ''
                                    ].filter(Boolean);
                                    const label = labelParts.join(' · ') || v.sku || 'Standard';

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
                                                focus-visible:ring-2 focus-visible:ring-[#3d5c3a]/40
                                                overflow-hidden group
                                                ${isSelected
                                                    ? 'bg-[#3d5c3a] shadow-[0_3px_12px_rgba(61,92,58,0.28)] scale-[1.01]'
                                                    : isDisabled
                                                        ? 'bg-gray-50 opacity-40 cursor-not-allowed'
                                                        : 'bg-white border border-gray-100 hover:border-[#3d5c3a]/25 hover:bg-[#f4f9f4] hover:shadow-sm'
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
                                                    : 'border-gray-300 group-hover:border-[#3d5c3a]/50'
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
                                                            : 'bg-gray-100 text-gray-700 group-hover:bg-[#3d5c3a]/10 group-hover:text-[#3d5c3a]'
                                                        }
                                                    `}>
                                                        {formatPrice(v.price)}
                                                    </span>
                                                    {v.is_on_sale && v.original_price && (
                                                        <span className={`text-[10px] line-through ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
                                                            {formatPrice(v.original_price)}
                                                        </span>
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
                    <div className="mt-3 pt-3 border-t border-[#3d5c3a]/8">
                        {!isInCart ? (
                            <button
                                onClick={(e) => handleModalAddToCart(e)}
                                disabled={
                                    (hasVariants && !selectedVariant) ||
                                    addingToCart || cartLoading || justAdded ||
                                    (hasVariants && selectedVariant?.stock_quantity <= 0)
                                }
                                className={`
                                    w-full py-2.5 rounded-xl text-white text-[11px] font-bold
                                    flex items-center justify-center gap-2 transition-all duration-200
                                    active:scale-[0.97] disabled:opacity-50
                                    ${justAdded
                                        ? 'bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.35)]'
                                        : 'bg-[#3d5c3a] hover:bg-[#2d4a2a] shadow-[0_4px_14px_rgba(61,92,58,0.25)] hover:shadow-[0_6px_18px_rgba(61,92,58,0.35)]'
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
                                        ? 'Adding to cart…'
                                        : justAdded
                                            ? 'Added to bag!'
                                            : selectedVariant
                                                ? `Add to Cart · ${formatPrice(selectedVariant.price * quantity)}`
                                                : 'Select an option'
                                    }
                                </span>
                            </button>
                        ) : (
                            /* ── In-cart stepper ──────────────────────────────── */
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecrement(); }}
                                    disabled={addingToCart}
                                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer shadow-sm"
                                >
                                    {currentItemInCart.quantity > 1 ? <Minus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                </button>

                                <div className="flex-1 flex flex-col items-center justify-center bg-[#3d5c3a]/5 rounded-xl py-1 border border-[#3d5c3a]/10">
                                    <p className="text-[8px] font-bold text-[#3d5c3a]/60 uppercase tracking-widest leading-none mb-0.5">in cart</p>
                                    <p className="text-base font-black text-[#3d5c3a] leading-none">{currentItemInCart.quantity}</p>
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleIncrement(); }}
                                    disabled={addingToCart}
                                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#3d5c3a] text-white hover:bg-[#2d4a2a] transition-all cursor-pointer shadow-sm shadow-[#3d5c3a]/30"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCartModal = () => {
        if (!showCartModal && !isClosing) return null;

        const modalBody = (
            <>
                {/* Pull handle Visual */}
                <div className="w-full flex justify-center pt-2 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Floating Close Button */}
                <button
                    onClick={closeCartModal}
                    className="absolute top-4 right-4 z-20 p-1 hover:opacity-60 transition-opacity cursor-pointer text-gray-400"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Scrollable Body: Variants & Quantity */}
                <div className="overflow-y-auto overflow-x-hidden p-4 flex-1 min-h-0 custom-scrollbar">
                    {hasVariants ? (
                        loadingVariants ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="h-8 w-8 text-gray-300 animate-spin-slow" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-breathe">
                                    Loading Variants
                                </p>
                            </div>
                        ) : variants.length > 0 ? (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-ui">
                                        Select Option
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {variants.map((v: any) => {
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
                                        const volLabel = formatVolume(v.volume_ml);
                                        const weightLabel = formatWeight(v.weight_g);
                                        const countLabel = v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : '';
                                        const strengthLabel = v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : '';

                                        const labelParts = [
                                            v.size_label,
                                            weightLabel,
                                            volLabel,
                                            countLabel,
                                            strengthLabel,
                                            v.flavor,
                                            v.pack_quantity > 1 ? `Pack of ${v.pack_quantity}` : ''
                                        ].filter(Boolean);
                                        const label = labelParts.join(' · ') || v.sku || 'Standard';

                                        return (
                                            <button
                                                key={v.variant_id}
                                                onClick={() => {
                                                    if (!isDisabled) {
                                                        setSelectedVariant(v);
                                                        const existing = items.find(i => i.variant_id === v.variant_id);
                                                        setQuantity(existing ? existing.quantity : 1);
                                                    }
                                                }}
                                                disabled={isDisabled}
                                                className={`w-full group relative flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition-all duration-300 transform outline-none focus:ring-2 focus:ring-[#3d5c3a]/50 ${isSelected
                                                    ? 'border-[#3d5c3a] bg-[#3d5c3a]/[0.02] shadow-[0_2px_10px_rgba(61,92,58,0.1)] z-10 scale-[1.02]'
                                                    : isInactive
                                                        ? 'border-gray-100 bg-gray-50 text-gray-300 opacity-50 cursor-not-allowed'
                                                        : isOut
                                                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                            : 'border-gray-100 hover:border-[#3d5c3a]/30 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 w-full pr-2">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${isSelected ? 'border-[#3d5c3a] bg-[#3d5c3a]' : 'border-gray-300 group-hover:border-[#3d5c3a]/50'
                                                        }`}>
                                                        <Check className={`h-2.5 w-2.5 text-white transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold transition-colors duration-300 ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-900'}`}>{label}</p>
                                                        {isInactive && (
                                                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                                                                Unavailable
                                                            </p>
                                                        )}
                                                        {!isInactive && isOut && (
                                                            <p className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> Out of Stock
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right flex-shrink-0">
                                                        <p className={`text-sm font-bold transition-colors duration-300 ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-900'}`}>{formatPrice(v.price)}</p>
                                                        {v.is_on_sale && v.original_price && (
                                                            <p className="text-[10px] text-gray-400 line-through">{formatPrice(v.original_price)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">No options available.</p>
                        )
                    ) : null}

                    <div className="flex-1" />
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-100 p-4 flex flex-col gap-2.5 rounded-b-2xl sm:rounded-b-3xl">
                    {hasVariants && variants.length > 0 && (
                        <div className="flex justify-end -mt-1 mb-1 pr-1">
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-ui">
                                {variants.length} {variants.length === 1 ? 'Option' : 'Options'} Available
                            </span>
                        </div>
                    )}
                    {!isInCart ? (
                        <button
                            onClick={(e) => handleModalAddToCart(e)}
                            disabled={(hasVariants && !selectedVariant) || addingToCart || cartLoading || justAdded || (hasVariants && selectedVariant?.stock_quantity <= 0) || (!hasVariants && (product as any).stock_quantity <= 0)}
                            className={`w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-lg font-ui ${justAdded ? 'bg-[#2a4d2e] shadow-[#2a4d2e]/20' : 'bg-[#3d5c3a] hover:bg-[#2d4a2a] shadow-[#3d5c3a]/20 hover:shadow-[#3d5c3a]/40'}`}
                        >
                            {addingToCart ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : justAdded ? (
                                <Check className="h-5 w-5 animate-in zoom-in" />
                            ) : (
                                <ShoppingCart className="h-4 w-4" />
                            )}
                            {addingToCart ? 'Processing...' : justAdded ? 'Added to Bag' : `Add to Cart - ${formatPrice((hasVariants ? (selectedVariant?.price ?? 0) : displayPrice) * quantity)}`}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecrement(); }}
                                disabled={addingToCart}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {currentItemInCart.quantity > 1 ? <Minus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                            <div className="flex-1 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Quantity</p>
                                <p className="text-lg font-black text-[#3d5c3a] leading-none">{currentItemInCart.quantity}</p>
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleIncrement(); }}
                                disabled={addingToCart}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#3d5c3a] text-white hover:bg-[#2d4a2a] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </>
        );

        if (false && isList && typeof document !== 'undefined') {
            return createPortal(
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                    <div className={`absolute inset-0 pointer-events-auto bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={closeCartModal} />
                    <div className={`pointer-events-auto relative w-full sm:w-[500px] max-h-[85vh] bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden border border-white/20 ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={(e) => e.stopPropagation()}>
                        {modalBody}
                    </div>
                </div>,
                document.body
            );
        }

        return (
            <div className={`absolute bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[80%] rounded-2xl flex flex-col overflow-hidden ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`} onClick={(e) => e.stopPropagation()}>
                {modalBody}
            </div>
        );
    };

    return (
        <>
            <div className="relative group block h-full" ref={cardRef}>
                {/* ═══════ FRONT OF CARD (Link) ═══════ */}
                <Link href={productUrl} className="block h-full">
                    <div className={`h-full overflow-hidden bg-white border border-gray-100 transition-all duration-300 ${isList ? 'flex flex-row p-3 hover:bg-gray-50/50 hover:border-[#3d5c3a]/30 rounded-2xl gap-4 sm:gap-6 items-center shadow-sm hover:shadow-md' : 'flex flex-col rounded-2xl hover:-translate-y-1 hover:shadow-xl'}`}>
                        <div className={`relative overflow-hidden bg-gradient-to-br from-[#f5f2ed] to-[#ece6dd] ${isList ? 'w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] rounded-xl flex-shrink-0 border border-gray-100/50' : ''}`} style={isList ? {} : { aspectRatio: '1 / 1' }}>
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
                                    className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-sm transition-all hover:scale-110 hover:shadow-md z-10 cursor-pointer"
                                >
                                    <Heart
                                        className={`h-4 w-4 transition ${wishlisted
                                            ? 'fill-[#3d5c3a] text-[#3d5c3a]'
                                            : 'text-gray-400'
                                            }`}
                                    />
                                </button>
                            )}

                            {/* Category Badge */}
                            {!isList && product.category && (
                                <span className="absolute left-3 top-3 rounded-full bg-[#3d5c3a] px-2.5 py-1 text-[9px] tracking-[0.15em] text-white uppercase font-black font-ui z-10 shadow-sm">
                                    {product.category}
                                </span>
                            )}

                            {/* Product Badges */}
                            <div className={`absolute ${isList ? 'left-2 top-2 flex-row flex-wrap' : 'left-3 bottom-3 flex-col'} flex gap-1 z-10`}>
                                {isExpired && !isComingSoon && (
                                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-black tracking-[0.1em] text-white uppercase font-ui">
                                        Expired
                                    </span>
                                )}
                                {isComingSoon && (
                                    <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[9px] font-black tracking-[0.1em] text-white uppercase font-ui">
                                        Coming Soon
                                    </span>
                                )}
                                {product.is_best_seller && !isComingSoon && (
                                    <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[9px] font-black tracking-[0.1em] text-white uppercase font-ui">
                                        Best Seller
                                    </span>
                                )}
                                {product.is_new_arrival && !isComingSoon && (
                                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] font-black tracking-[0.1em] text-white uppercase font-ui">
                                        New
                                    </span>
                                )}
                            </div>

                            {/* Hover overlay (grid only) */}
                            {!isUnavailable && !isList && (
                                <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                                    {hasVariants ? (
                                        <button
                                            onClick={openCartModal}
                                            className="w-full flex items-center justify-center gap-2 bg-[#3d5c3a]/95 backdrop-blur-sm py-3 text-xs font-black tracking-[0.05em] uppercase text-white hover:bg-[#3d5c3a] transition-colors cursor-pointer font-ui"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Preview Options
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => onMoveToCart ? onMoveToCart(e) : openCartModal(e)}
                                            disabled={cartLoading || addingToCart || justAdded}
                                            className={`w-full flex items-center justify-center gap-2 backdrop-blur-sm py-3 text-xs font-black tracking-[0.05em] uppercase text-white transition-all duration-300 cursor-pointer disabled:opacity-70 font-ui ${justAdded ? 'bg-[#2a4d2e]' : 'bg-[#3d5c3a]/95 hover:bg-[#3d5c3a]'}`}
                                        >
                                            {addingToCart ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : justAdded ? (
                                                <Check className="h-4 w-4 animate-in zoom-in" />
                                            ) : (
                                                <ShoppingCart className="h-4 w-4" />
                                            )}
                                            {addingToCart ? 'Processing...' : justAdded ? 'Added to Bag' : 'Add to Cart'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className={`p-4 ${isList ? 'flex-1 flex flex-col justify-center min-w-0 p-0 sm:pr-4' : ''}`}>
                            {isList && (
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    {product.category && (
                                        <span className="rounded leading-none bg-[#3d5c3a]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] tracking-widest text-[#3d5c3a] uppercase font-bold">
                                            {product.category}
                                        </span>
                                    )}
                                    {product.brand && (
                                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                                            {product.brand}
                                        </span>
                                    )}
                                </div>
                            )}

                            {!isList && product.brand && (
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                                    {product.brand}
                                </p>
                            )}

                            <h3 className={`font-accent text-gray-900 leading-tight mb-1.5 sm:mb-2 ${isList ? 'text-lg sm:text-xl line-clamp-1 sm:line-clamp-2' : 'text-base line-clamp-2'}`}>
                                {product.product_name}
                            </h3>

                            {/* Rating */}
                            {avgRating > 0 && (
                                <div className="flex items-center gap-1.5 mb-2">
                                    <StarRating value={avgRating} size="sm" />
                                    <span className="text-xs text-gray-400">
                                        {avgRating.toFixed(1)}
                                        {totalReviews > 0 && <span className="ml-0.5">({totalReviews})</span>}
                                    </span>
                                </div>
                            )}

                            {/* Short Description */}
                            {(product as any).short_description && (
                                <p className={`text-[11px] sm:text-xs text-gray-500 mb-2 leading-relaxed ${isList ? 'line-clamp-2' : 'line-clamp-1'}`}>
                                    {(product as any).short_description}
                                </p>
                            )}

                            {/* Price */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xl font-black text-[#3d5c3a] font-ui tabular-nums tracking-tight">
                                    {formatPrice(displayPrice)}
                                </p>
                                {isOnSale && originalPrice && (
                                    <>
                                        <p className="text-xs text-gray-400 line-through">
                                            {formatPrice(originalPrice)}
                                        </p>
                                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100">
                                            {discountPercent}% OFF
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* List view: inline action buttons */}
                            {isList && !isUnavailable && (
                                <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                                    {hasVariants ? (
                                        <button
                                            onClick={openCartModal}
                                            className={`
                                                inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5
                                                text-[11px] sm:text-xs font-bold px-3 sm:px-5 py-2 sm:py-2.5
                                                rounded-lg transition-all duration-200 cursor-pointer shadow-sm
                                                ${showInlineOptions
                                                    ? 'bg-[#2d4a2a] text-white shadow-[0_0_0_3px_rgba(61,92,58,0.2)]'
                                                    : 'bg-[#3d5c3a] text-white hover:bg-[#2d4a2a] hover:shadow'
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
                                            className={`inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 text-white text-[11px] sm:text-xs font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-70 ${justAdded ? 'bg-[#2a4d2e]' : 'bg-[#3d5c3a] hover:bg-[#2d4a2a]'}`}
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
                                        className={`inline-flex flex-shrink-0 items-center justify-center p-2.5 sm:p-2.5 rounded-lg border transition-all cursor-pointer ${wishlisted ? 'border-[#3d5c3a]/30 bg-[#3d5c3a]/5' : 'border-gray-200 bg-white hover:border-[#3d5c3a]/30 hover:bg-gray-50'}`}
                                    >
                                        <Heart className={`h-4 w-4 sm:h-4 sm:w-4 ${wishlisted ? 'fill-[#3d5c3a] text-[#3d5c3a]' : 'text-gray-400'}`} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Inline Options Panel (List View Only) */}
                        {isList && renderInlineOptions()}
                    </div>
                </Link>

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
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .animate-slide-down {
                    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
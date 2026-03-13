'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye, X, Check, AlertTriangle, Loader2, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { getRatingSummary, getProductDetails, formatVND } from '@/lib/api';
import StarRating from '@/components/reviews/StarRating';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

const BLUR_DATA_URL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmNWYyIi8+PC9zdmc+';

interface ProductCardProps {
    product: Product;
    onMoveToCart?: (e: React.MouseEvent) => void;
    priority?: boolean;
}

export default function ProductCard({ product, onMoveToCart, priority = false }: ProductCardProps) {
    const { isInWishlist, toggleItem } = useWishlist();
    const { addItem, updateQuantity, removeItem, items, loading: cartLoading } = useCart();
    const wishlisted = isInWishlist(product.product_id);
    const t = useTranslations('Product');

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

    const triggerAddedFeedback = useCallback(() => {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1000);
    }, []);



    useEffect(() => {
        getRatingSummary(product.product_id).then(res => {
            if (res.success && res.data) {
                setAvgRating(res.data.average_rating ?? 0);
                setTotalReviews(res.data.total_reviews ?? 0);
            }
        }).catch(() => { });
    }, [product.product_id]);

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
        }, 280); // Slightly shorter than actual animation to feel snappy
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showCartModal && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                closeCartModal();
            }
        };

        if (showCartModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCartModal, closeCartModal]);

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
                const variantIdToUse = (product as any).default_variant_id || null;
                await addItem(product.product_id, variantIdToUse, 1);
                toast.success(t('addedToCart', { name: product.product_name }));
                setQuantity(1); // Reset local quantity
                triggerAddedFeedback();
            } catch {
                toast.error(t('failedToUpdate'));
            } finally {
                setAddingToCart(false);
            }
            return;
        }

        setShowCartModal(true);
        setIsClosing(false);

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
            toast.error(t('couldNotLoad'));
        } finally {
            setLoadingVariants(false);
        }
    }, [product.product_id, variants, selectedVariant, hasVariants, items]);

    // Unified add to cart from modal
    const handleModalAddToCart = async () => {
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
            const variantIdToUse = hasVariants ? selectedVariant.variant_id : ((product as any).default_variant_id || null);
            await addItem(product.product_id, variantIdToUse, quantity);
            toast.success(t('addedToCart', { name: product.product_name }));
            triggerAddedFeedback();
        } catch {
            toast.error(t('failedToUpdate'));
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
                toast.success(t('cartUpdated'));
            } else {
                toast.error(t('maxStockReached'));
            }
        } catch {
            toast.error(t('failedToUpdate'));
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
                toast.success(t('cartUpdated'));
            } else {
                await removeItem(currentItemInCart.cart_item_id);
                setQuantity(1);
                toast.success(currentItemInCart.product_name + ' removed from cart');
            }
        } catch {
            toast.error(t('failedToUpdate'));
        } finally {
            setAddingToCart(false);
        }
    };

    const isComingSoon = product.is_coming_soon ?? false;
    const isExpired = product.is_availability_expired ?? false;
    const isUnavailable = isComingSoon || isExpired;

    return (
        <>
            <div className="relative group block h-full" ref={cardRef}>
                {/* ═══════ FRONT OF CARD (Link) ═══════ */}
                <Link href={productUrl} className="block h-full">
                    <div className="h-full flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        {/* Image Section */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f2ed] to-[#ece6dd]" style={{ aspectRatio: '1 / 1' }}>
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

                            {/* Wishlist */}
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

                            {/* Category Badge */}
                            {product.category && (
                                <span className="absolute left-3 top-3 rounded-full bg-[#3d5c3a] px-2.5 py-1 text-[9px] tracking-widest text-white uppercase font-bold z-10">
                                    {product.category}
                                </span>
                            )}

                            {/* Product Badges */}
                            <div className="absolute left-3 bottom-3 flex flex-col gap-1 z-10">
                                {isExpired && !isComingSoon && (
                                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                                        Expired
                                    </span>
                                )}
                                {isComingSoon && (
                                    <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                                        Coming Soon
                                    </span>
                                )}
                                {product.is_best_seller && !isComingSoon && (
                                    <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                                        Best Seller
                                    </span>
                                )}
                                {product.is_new_arrival && !isComingSoon && (
                                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                                        {t('new')}
                                    </span>
                                )}
                            </div>

                            {/* Hover overlay: Add to Cart / Preview Options */}
                            {!isUnavailable && (
                                <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                                    {hasVariants ? (
                                        <button
                                            onClick={openCartModal}
                                            className="w-full flex items-center justify-center gap-2 bg-[#3d5c3a]/95 backdrop-blur-sm py-3 text-sm font-bold text-white hover:bg-[#3d5c3a] transition-colors cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4" />
                                            {t('previewOptions')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => onMoveToCart ? onMoveToCart(e) : openCartModal(e)}
                                            disabled={cartLoading || addingToCart || justAdded}
                                            className={`w-full flex items-center justify-center gap-2 backdrop-blur-sm py-3 text-sm font-bold text-white transition-all duration-300 cursor-pointer disabled:opacity-70 ${justAdded ? 'bg-[#2a4d2e]' : 'bg-[#3d5c3a]/95 hover:bg-[#3d5c3a]'}`}
                                        >
                                            {addingToCart ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : justAdded ? (
                                                <Check className="h-4 w-4 animate-in zoom-in" />
                                            ) : (
                                                <ShoppingCart className="h-4 w-4" />
                                            )}
                                            {addingToCart ? t('processing') : justAdded ? t('addedToBag') : t('addToCart')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {product.brand && (
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                                    {product.brand}
                                </p>
                            )}

                            <h3 className="font-serif text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
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

                            {/* Price */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-lg font-bold text-[#3d5c3a]">
                                    {formatVND(displayPrice)}
                                </p>
                                {isOnSale && originalPrice && (
                                    <>
                                        <p className="text-xs text-gray-400 line-through">
                                            {formatVND(originalPrice)}
                                        </p>
                                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100">
                                            {discountPercent}% {t('off')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* ═══════ CART / VARIANT OVERLAY (BOTTOM-SHEET style) ═══════ */}
                {(showCartModal || isClosing) && (
                    <div className={`absolute bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden rounded-2xl max-h-[80%] ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
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
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
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
                                                                        {t('unavailable') ?? 'Unavailable'}
                                                                    </p>
                                                                )}
                                                                {!isInactive && isOut && (
                                                                    <p className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" /> {t('outOfStock')}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="text-right flex-shrink-0">
                                                                <p className={`text-sm font-bold transition-colors duration-300 ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-900'}`}>{formatVND(v.price)}</p>
                                                                {v.is_on_sale && v.original_price && (
                                                                    <p className="text-[10px] text-gray-400 line-through">{formatVND(v.original_price)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-6">{t('noOptionsAvailable')}</p>
                                )
                            ) : null}

                            <div className="flex-1" />
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-gray-100 p-4 flex flex-col gap-2.5 rounded-b-2xl">
                            {hasVariants && variants.length > 0 && (
                                <div className="flex justify-end -mt-1 mb-1 pr-1">
                                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {variants.length} {variants.length === 1 ? 'Option' : 'Options'} Available
                                    </span>
                                </div>
                            )}
                            {!isInCart ? (
                                <button
                                    onClick={handleModalAddToCart}
                                    disabled={(hasVariants && !selectedVariant) || addingToCart || cartLoading || justAdded || (hasVariants && selectedVariant?.stock_quantity <= 0) || (!hasVariants && (product as any).stock_quantity <= 0)}
                                    className={`w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-lg ${justAdded ? 'bg-[#2a4d2e] shadow-[#2a4d2e]/20' : 'bg-[#3d5c3a] hover:bg-[#2d4a2a] shadow-[#3d5c3a]/20 hover:shadow-[#3d5c3a]/40'}`}
                                >
                                    {addingToCart ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : justAdded ? (
                                        <Check className="h-5 w-5 animate-in zoom-in" />
                                    ) : (
                                        <ShoppingCart className="h-4 w-4" />
                                    )}
                                    {addingToCart ? t('processing') : justAdded ? t('addedToBag') : `${t('addToCart')} - ${formatVND((hasVariants ? (selectedVariant?.price ?? 0) : displayPrice) * quantity)}`}
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
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">{t('quantity')}</p>
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
                    </div>
                )}
            </div>

            {/* Slide-up animation */}
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
            `}</style>
        </>
    );
}

'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye, X, Check, AlertTriangle, Loader2, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { getRatingSummary, getProductDetails, formatVND } from '@/lib/api';
import StarRating from '@/components/reviews/StarRating';
import { useState, useEffect, useCallback } from 'react';
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
    const { addItem, updateQuantity, items, loading: cartLoading } = useCart();
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
    const [quantity, setQuantity] = useState(1);

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
        toast.success(wishlisted ? t('removedFromWishlist') : t('addedToWishlist'));
    };

    // Determine if product has variants from the product data
    const hasVariants = (product as any).variant_count > 1 || (product as any).variants?.length > 1;

    // Display values (default variant or product level)
    const displayPrice = product.price ?? 0;
    const isOnSale = product.is_on_sale ?? false;
    const originalPrice = product.original_price ?? displayPrice;
    const discountPercent = product.discount_percentage ?? 0;

    const imageSrc = product.images?.[0] || '/herbal_placeholder.png';
    const isExternal = imageSrc.startsWith('http');
    const isBase64 = imageSrc.startsWith('data:');
    const productUrl = `/product/${product.slug || product.product_id}`;

    // Load variants for cart modal
    const openCartModal = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setShowCartModal(true);

        if (!hasVariants) {
            const existing = items.find(i => i.product_id === product.product_id);
            setQuantity(existing ? existing.quantity : 1);
            return; // Non-variant products just open the modal directly
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
            const existing = items.find(i => hasVariants ? i.variant_id === variantIdToUse : i.product_id === product.product_id);
            
            if (existing) {
                if (quantity !== existing.quantity) {
                    await updateQuantity(existing.cart_item_id, quantity);
                    toast.success(t('cartUpdated'));
                } else {
                    toast.success(t('cartUpToDate'));
                }
            } else {
                await addItem(product.product_id, variantIdToUse, quantity);
                toast.success(t('addedToCart', { name: product.product_name }));
            }
            setShowCartModal(false);
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
            <div className="relative group block h-full">
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
                                        disabled={cartLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-[#3d5c3a]/95 backdrop-blur-sm py-3 text-sm font-bold text-white hover:bg-[#3d5c3a] transition-colors cursor-pointer disabled:opacity-70"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        {t('addToCart')}
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

                {/* ═══════ CART / VARIANT OVERLAY (IN-CARD) ═══════ */}
                {showCartModal && (
                    <div className="absolute inset-0 z-50 bg-white rounded-2xl border border-gray-100 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-white z-10 flex items-start gap-4 p-4 border-b border-gray-100 rounded-t-2xl relative">
                            <div className="relative w-20 h-20 rounded-xl bg-[#f8f5f2] overflow-hidden flex items-center justify-center flex-shrink-0">
                                {isBase64 ? (
                                    <img src={hasVariants ? (selectedVariant?.image_url || imageSrc) : imageSrc} alt={product.product_name} className="object-contain w-full h-full p-2 transition-transform duration-500 hover:scale-105" />
                                ) : (
                                    <Image
                                        src={hasVariants ? (selectedVariant?.image_url || imageSrc) : imageSrc}
                                        alt={product.product_name}
                                        width={96}
                                        height={96}
                                        className="object-contain p-2 transition-transform duration-500 hover:scale-105"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h3 className="font-serif font-bold text-gray-900 text-base leading-tight line-clamp-2">{product.product_name}</h3>
                                
                                <div className="flex items-center gap-2 mt-2 transition-all duration-300">
                                    <span className="text-xl font-bold text-[#3d5c3a]">
                                        {formatVND(hasVariants ? (selectedVariant?.price ?? 0) : displayPrice)}
                                    </span>
                                    {((hasVariants && selectedVariant?.is_on_sale) || (!hasVariants && isOnSale)) && (
                                        <>
                                            <span className="text-xs text-gray-400 line-through">
                                                {formatVND(hasVariants ? selectedVariant.original_price : originalPrice)}
                                            </span>
                                            <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm">
                                                {hasVariants ? selectedVariant.discount_percentage : discountPercent}% {t('off')}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowCartModal(false);
                                }}
                                className="absolute top-2 right-2 rounded-full p-1.5 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-50"
                            >
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Scrollable Body: Variants & Quantity */}
                        <div className="overflow-y-auto overflow-x-hidden p-4 flex-1 min-h-0 custom-scrollbar">
                            {hasVariants ? (
                                loadingVariants ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : variants.length > 0 ? (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                Select Option
                                            </p>
                                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{variants.length} Available</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {variants.map((v: any) => {
                                                const isSelected = selectedVariant?.variant_id === v.variant_id;
                                                const isOut = v.stock_quantity !== null && v.stock_quantity !== undefined && v.stock_quantity <= 0;
                                                const label = [v.size_label, v.pack_quantity > 1 ? `Pack of ${v.pack_quantity}` : ''].filter(Boolean).join(' · ') || v.sku || 'Standard';

                                                return (
                                                    <button
                                                        key={v.variant_id}
                                                        onClick={() => { 
                                                            if(!isOut) {
                                                                setSelectedVariant(v); 
                                                                const existing = items.find(i => i.variant_id === v.variant_id);
                                                                setQuantity(existing ? existing.quantity : 1);
                                                            } 
                                                        }}
                                                        disabled={isOut}
                                                        className={`w-full group relative flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition-all duration-300 transform outline-none focus:ring-2 focus:ring-[#3d5c3a]/50 ${
                                                            isSelected
                                                                ? 'border-[#3d5c3a] bg-[#3d5c3a]/[0.02] shadow-[0_2px_10px_rgba(61,92,58,0.1)] z-10 scale-[1.02]'
                                                                : isOut
                                                                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                                    : 'border-gray-100 hover:border-[#3d5c3a]/30 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 w-full pr-2">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                                                                isSelected ? 'border-[#3d5c3a] bg-[#3d5c3a]' : 'border-gray-300 group-hover:border-[#3d5c3a]/50'
                                                            }`}>
                                                                <Check className={`h-2.5 w-2.5 text-white transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold transition-colors duration-300 ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-900'}`}>{label}</p>
                                                                {isOut && (
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

                            {/* Quantity Selector */}
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-auto">
                                <div className="flex items-center justify-between">
                                    <p className="text-[13px] font-bold text-gray-800">{t('quantity')}</p>
                                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 cursor-pointer outline-none focus:ring-2 focus:ring-[#3d5c3a]/50"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="text-sm font-bold text-gray-900 w-6 text-center select-none">{quantity}</span>
                                        <button
                                            onClick={() => {
                                                const maxLimit = hasVariants ? (selectedVariant?.stock_quantity ?? 99) : ((product as any).stock_quantity ?? 99);
                                                setQuantity(Math.min(maxLimit, quantity + 1));
                                            }}
                                            disabled={
                                                (hasVariants && (!selectedVariant || quantity >= (selectedVariant.stock_quantity ?? 99))) ||
                                                (!hasVariants && quantity >= ((product as any).stock_quantity ?? 99))
                                            }
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 cursor-pointer outline-none focus:ring-2 focus:ring-[#3d5c3a]/50"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {((hasVariants && selectedVariant && quantity >= (selectedVariant.stock_quantity ?? 99)) ||
                                    (!hasVariants && quantity >= ((product as any).stock_quantity ?? 99))) && (
                                    <p className="text-[10px] text-red-500 font-semibold mt-1.5 text-right">{t('maxStockReached')}</p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-gray-100 p-4 flex flex-col gap-2.5 rounded-b-2xl">
                            <button
                                onClick={handleModalAddToCart}
                                disabled={(hasVariants && !selectedVariant) || addingToCart || cartLoading || (hasVariants && selectedVariant?.stock_quantity <= 0) || (!hasVariants && (product as any).stock_quantity <= 0)}
                                className="w-full py-3.5 rounded-xl bg-[#3d5c3a] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2d4a2a] transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#3d5c3a]/20 hover:shadow-[#3d5c3a]/40"
                            >
                                {addingToCart ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <ShoppingCart className={`h-4 w-4 ${addingToCart ? 'animate-bounce' : ''}`} />
                                )}
                                {addingToCart ? t('processing') : (
                                    items.some(i => hasVariants ? i.variant_id === selectedVariant?.variant_id : i.product_id === product.product_id)
                                        ? `${t('updateCart')} - ${formatVND((hasVariants ? (selectedVariant?.price ?? 0) : displayPrice) * quantity)}`
                                        : `${t('addToCart')} - ${formatVND((hasVariants ? (selectedVariant?.price ?? 0) : displayPrice) * quantity)}`
                                )}
                            </button>
                            <Link
                                href={productUrl}
                                onClick={() => setShowCartModal(false)}
                                className="w-full py-1.5 text-[11px] font-semibold text-gray-500 text-center hover:text-[#3d5c3a] transition-colors"
                            >
                                {t('viewFullDetails')}
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-up animation */}
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { getRatingSummary, formatVND } from '@/lib/api';
import StarRating from '@/components/reviews/StarRating';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/** Tiny 1x1 blurred placeholder for product images */
const BLUR_DATA_URL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmNWYyIi8+PC9zdmc+';

interface ProductCardProps {
    product: Product;
    onMoveToCart?: (e: React.MouseEvent) => void;
    /** Set to true for above-the-fold cards to preload the image */
    priority?: boolean;
}

export default function ProductCard({ product, onMoveToCart, priority = false }: ProductCardProps) {
    const { isInWishlist, toggleItem } = useWishlist();
    const wishlisted = isInWishlist(product.product_id);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

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
        toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const displayPrice = product.price ?? Math.floor(Math.random() * 500000 + 100000);
    const isOnSale = product.is_on_sale ?? false;
    const originalPrice = product.original_price ?? displayPrice;
    const discountPercent = product.discount_percentage ?? 0;

    const imageSrc = product.images?.[activeImageIndex] || '/card-drink.webp';
    const isExternal = imageSrc.startsWith('http');
    const isBase64 = imageSrc.startsWith('data:');

    const productUrl = `/product/${product.slug || product.product_id}`;

    return (
        <Link href={productUrl} className="group block">
            <div className="overflow-hidden rounded-xl bg-white border border-neutral-200 transition-all duration-200 hover:-translate-y-2 hover:shadow-2xl shadow-lg">

                {/* Image Section — fixed aspect ratio prevents CLS */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#f8f5f2] to-[#efe7df]" style={{ aspectRatio: '1 / 1' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isBase64 ? (
                            <img
                                src={imageSrc}
                                alt={product.product_name}
                                className="object-contain w-full h-full"
                                loading={priority ? 'eager' : 'lazy'}
                                // decoding="async" ensures parsing base64 doesn't block the main thread
                                decoding="async"
                            />
                        ) : isExternal ? (
                            <Image
                                src={imageSrc}
                                alt={product.product_name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-contain"
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
                                className="object-contain w-full h-full"
                                priority={priority}
                                loading={priority ? undefined : 'lazy'}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />
                        )}
                    </div>

                    {/* reflection overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/30 opacity-60" />

                    {/* Wishlist */}
                    <button
                        onClick={handleToggleWishlist}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 rounded-full bg-white/85 stroke-vedic-gold backdrop-blur-md p-1.5 sm:p-2 shadow-md transition hover:scale-110"
                    >
                        <Heart
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition ${wishlisted
                                ? 'fill-[#6b0f1a] text-[#6b0f1a]'
                                : 'text-vedic-gold'
                                }`}
                        />
                    </button>

                    {/* Category Badge */}
                    {product.category && (
                        <span className="absolute left-2 top-2 sm:left-4 sm:top-4 rounded-full bg-burgundy px-2 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] tracking-wider sm:tracking-widest text-white uppercase backdrop-blur">
                            {product.category}
                        </span>
                    )}

                    {/* Product Badges (bottom-left, stacked) */}
                    <div className="absolute left-2 bottom-2 sm:left-4 sm:bottom-4 flex flex-col gap-1">
                        {product.is_availability_expired && !product.is_coming_soon && (
                            <span className="rounded-full bg-gradient-to-r from-red-700 to-red-500 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white uppercase shadow-md flex items-center gap-0.5 sm:gap-1">
                                ⏱ <span className="hidden sm:inline">No Longer Available</span><span className="sm:hidden">Expired</span>
                            </span>
                        )}
                        {product.is_coming_soon && (
                            <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white uppercase shadow-md flex items-center gap-0.5 sm:gap-1">
                                🕒 Coming Soon
                            </span>
                        )}
                        {product.is_best_seller && !product.is_coming_soon && (
                            <span className="rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white uppercase shadow-md flex items-center gap-0.5 sm:gap-1">
                                🏆 <span className="hidden sm:inline">Best Seller</span><span className="sm:hidden">Best</span>
                            </span>
                        )}
                        {product.is_new_arrival && !product.is_coming_soon && (
                            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white uppercase shadow-md flex items-center gap-0.5 sm:gap-1">
                                ✨ <span className="hidden sm:inline">New Arrival</span><span className="sm:hidden">New</span>
                            </span>
                        )}
                        {product.is_featured && !product.is_best_seller && !product.is_coming_soon && (
                            <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-white uppercase shadow-md flex items-center gap-0.5 sm:gap-1">
                                ✦ Featured
                            </span>
                        )}
                    </div>

                    {/* Move to Cart – slides up on hover */}
                    {onMoveToCart && !product.is_coming_soon && !product.is_availability_expired && (
                        <button
                            onClick={onMoveToCart}
                            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-burgundy/95 backdrop-blur-sm py-3 text-sm font-semibold text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hover:bg-burgundy cursor-pointer"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Move to Cart
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5">
                    <h3 className="font-serif text-sm sm:text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 tracking-tight">
                        {product.product_name}
                    </h3>

                    {product.brand && (
                        <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">
                            {product.brand}
                        </p>
                    )}



                    <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className="text-base sm:text-xl font-serif font-bold text-[#6b0f1a] tracking-tight">
                            {formatVND(displayPrice)}
                        </p>
                        {isOnSale && originalPrice && (
                            <>
                                <p className="text-xs text-neutral-400 line-through decoration-[#6b0f1a]/40">
                                    {formatVND(originalPrice)}
                                </p>
                                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wide">
                                    {discountPercent}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-1.5">
                        <StarRating value={avgRating} size="sm" />
                        <span className="text-xs text-neutral-400">
                            {avgRating > 0 ? `${avgRating.toFixed(1)}` : ''}
                            {totalReviews > 0 && (
                                <span className="ml-1">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}




// 'use client';

// import Link from 'next/link';
// import { Heart, ShoppingCart } from 'lucide-react';
// import { Product } from '@/types';
// import { useCart } from '@/context/CartContext';
// import { useWishlist } from '@/context/WishlistContext';
// import toast from 'react-hot-toast';

// interface ProductCardProps {
//     product: Product;
// }

// export default function ProductCard({ product }: ProductCardProps) {
//     const { addItem } = useCart();
//     const { isInWishlist, toggleItem } = useWishlist();
//     const wishlisted = isInWishlist(product.product_id);

//     const handleAddToCart = (e: React.MouseEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         addItem(product);
//         toast.success(`${product.product_name} added to cart!`);
//     };

//     const handleToggleWishlist = (e: React.MouseEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         toggleItem(product);
//         toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
//     };

//     const displayPrice = product.price ?? Math.floor(Math.random() * 500000 + 100000);

//     return (
//         <Link href={`/products/${product.product_id}`} className="group block">
//             <div className="relative overflow-hidden rounded-xl bg-white border border-light-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
//                 {/* Image */}
//                 <div className="relative aspect-square bg-gradient-to-br from-cream to-cream-dark p-6">
//                     <div className="flex h-full items-center justify-center">
//                         <span className="text-7xl transition-transform duration-300 group-hover:scale-110">🌿</span>
//                     </div>

//                     {/* Wishlist Button */}
//                     <button
//                         onClick={handleToggleWishlist}
//                         className="absolute right-3 top-3 rounded-full bg-white/80 p-2 shadow-sm transition-all hover:bg-white hover:shadow-md"
//                         aria-label="Toggle wishlist"
//                     >
//                         <Heart
//                             className={`h-4 w-4 transition-colors ${wishlisted ? 'fill-burgundy text-burgundy' : 'text-warm-gray'}`}
//                         />
//                     </button>

//                     {/* Category Badge */}
//                     {product.category && (
//                         <span className="absolute left-3 top-3 rounded-full bg-burgundy/90 px-2.5 py-0.5 text-[10px] font-medium text-white uppercase tracking-wider">
//                             {product.category}
//                         </span>
//                     )}
//                 </div>

//                 {/* Content */}
//                 <div className="p-4">
//                     <h3 className="font-serif text-base font-semibold text-charcoal line-clamp-2 leading-snug">
//                         {product.product_name}
//                     </h3>

//                     {product.brand && (
//                         <p className="mt-0.5 text-xs text-warm-gray">{product.brand}</p>
//                     )}

//                     <p className="mt-2 font-serif text-lg font-bold text-burgundy">
//                         ${displayPrice.toLocaleString('en-US')}
//                     </p>

//                     {/* Add to Cart */}
//                     <button
//                         onClick={handleAddToCart}
//                         className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-burgundy py-2.5 text-sm font-medium text-white transition-all hover:bg-burgundy-dark active:scale-[0.98]"
//                     >
//                         <ShoppingCart className="h-4 w-4" />
//                         Add to Cart
//                     </button>
//                 </div>
//             </div>
//         </Link>
//     );
// }

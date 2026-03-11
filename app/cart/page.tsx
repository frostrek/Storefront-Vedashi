'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Minus, Plus, X, ShoppingCart, ArrowLeft, Loader2, Ticket, Bookmark } from 'lucide-react';
import { formatVND } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CartPage() {
    const {
        items, savedItems, updateQuantity, removeItem, saveForLater, moveToCart,
        totalPrice, totalItems, loading, error,
        couponCode, couponDiscount, couponType, couponError, applyCoupon, removeCoupon,
    } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [couponInput, setCouponInput] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Loading state
    if (loading && items.length === 0) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        );
    }

    if (items.length === 0 && savedItems.length === 0) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart className="mx-auto h-16 w-16 text-warm-gray/40 mb-4" />
                    <h1 className="font-serif text-2xl font-bold text-charcoal">Your Cart is Empty</h1>
                    <p className="mt-2 text-warm-gray">Explore our collection and add something you like</p>
                    <Link
                        href="/products"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-burgundy px-8 py-3 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Compute price breakdown
    const totalMRP = items.reduce((sum, item) => sum + (item.original_price ?? item.price ?? 0) * item.quantity, 0);
    const saleDiscount = totalMRP - items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

    // Total taxes are not exposed directly in CartContext at the top level, but it can be derived if not available
    // or we can sum it up from the items:
    const totalTaxes = items.reduce((sum, item) => sum + ((item as any).pricing?.tax_amount ?? 0), 0);

    const deliveryFee = couponType === 'free_shipping' ? 0 : (totalPrice > 50 ? 0 : 5);

    // Use the backend's grandTotal directly since that includes taxes. If there's a coupon, 
    // the backend will handle it, but since applying coupon happens client-side for delivery sometimes:
    const grandTotal = totalPrice - couponDiscount + deliveryFee;

    return (
        <div className="min-h-screen bg-cream">
            {/* Step Indicator */}
            <div className="border-b border-light-border bg-white py-6">
                <div className="mx-auto max-w-4xl flex items-center justify-center gap-3 sm:gap-6 md:gap-8 px-4 flex-wrap">
                    {['Cart', 'Address', 'Payment', 'Confirmation'].map((step, i) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${i === 0 ? 'bg-burgundy text-white' : 'bg-cream-dark text-warm-gray'
                                }`}>
                                {i + 1}
                            </div>
                            <span className={`text-sm font-medium hidden sm:inline ${i === 0 ? 'text-burgundy' : 'text-warm-gray'}`}>
                                {step}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-6 sm:mb-8">Your Cart</h1>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
                    {/* Left Column: Cart Items + Saved Items */}
                    <div className="flex flex-col gap-12">
                        {/* Cart Items */}
                        <div className="space-y-4">
                            {items.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-light-border p-8 text-center bg-white/50">
                                    <p className="text-warm-gray font-medium">Your active cart is empty.</p>
                                </div>
                            ) : (
                                items.map(item => {
                                    const price = item.price ?? 0;
                                    return (
                                        <div
                                            key={item.cart_item_id}
                                            className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 sm:gap-4 rounded-xl border border-light-border bg-white p-4 sm:p-6 transition-all hover:shadow-sm"
                                        >
                                            {/* Image */}
                                            <Link href={`/product/${(item as any).slug || item.product_id || item.product?.product_id || ''}`} className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg bg-cream-dark flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.product_name || ''} className="h-full w-full object-cover rounded-lg" />
                                                ) : (
                                                    <span className="text-4xl">🌿</span>
                                                )}
                                            </Link>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/product/${(item as any).slug || item.product_id || item.product?.product_id || ''}`} className="hover:text-burgundy transition-colors">
                                                    <h3 className="font-serif text-base font-semibold text-charcoal truncate">
                                                        {item.product_name || 'Product'}
                                                    </h3>
                                                </Link>
                                                {item.size_label && (
                                                    <p className="text-xs text-warm-gray mt-0.5">{item.size_label}</p>
                                                )}
                                                {item.sku && (
                                                    <p className="text-xs text-warm-gray mt-0.5">SKU: {item.sku}</p>
                                                )}
                                                <p className="mt-1 font-serif text-lg font-bold text-burgundy">
                                                    {formatVND(price)}
                                                </p>
                                            </div>

                                            {/* Quantity */}
                                            <div className="flex items-center rounded-lg border border-light-border ml-auto sm:ml-0">
                                                <button
                                                    onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                                    disabled={loading}
                                                    className="px-2.5 py-1.5 text-warm-gray hover:text-charcoal disabled:opacity-50"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium text-charcoal">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                                    disabled={loading}
                                                    className="px-2.5 py-1.5 text-warm-gray hover:text-charcoal disabled:opacity-50"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 items-end justify-center ml-2">
                                                <button
                                                    onClick={() => { removeItem(item.cart_item_id); toast.success('Removed from cart'); }}
                                                    disabled={loading}
                                                    className="p-2.5 text-warm-gray hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                                    title="Remove item"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => { saveForLater(item.cart_item_id); toast.success('Saved for later'); }}
                                                    disabled={loading}
                                                    className="p-2.5 text-warm-gray hover:text-burgundy hover:bg-burgundy/5 rounded-full transition-colors disabled:opacity-50"
                                                    title="Save for later"
                                                >
                                                    <Bookmark className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }))}
                        </div>

                        {/* Saved for Later Section */}
                        {savedItems.length > 0 && (
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-charcoal mb-6 border-b border-light-border pb-4 flex items-center gap-2">
                                    <Bookmark className="h-6 w-6 text-burgundy" />
                                    Saved for Later ({savedItems.length})
                                </h2>
                                <div className="space-y-4">
                                    {savedItems.map(item => {
                                        const price = item.price ?? 0;
                                        return (
                                            <div
                                                key={item.cart_item_id}
                                                className="flex items-center gap-4 rounded-xl border border-light-border bg-white p-4 sm:p-6 transition-all hover:shadow-sm opacity-80 hover:opacity-100"
                                            >
                                                {/* Image */}
                                                <Link href={`/product/${(item as any).slug || item.product_id || item.product?.product_id || ''}`} className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-lg bg-cream-dark flex items-center justify-center cursor-pointer">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.product_name || ''} className="h-full w-full object-cover rounded-lg" />
                                                    ) : (
                                                        <span className="text-3xl">🌿</span>
                                                    )}
                                                </Link>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/product/${(item as any).slug || item.product_id || item.product?.product_id || ''}`} className="hover:text-burgundy transition-colors">
                                                        <h3 className="font-serif text-base font-semibold text-charcoal truncate">
                                                            {item.product_name || 'Product'}
                                                        </h3>
                                                    </Link>
                                                    {item.size_label && (
                                                        <p className="text-xs text-warm-gray mt-0.5">{item.size_label}</p>
                                                    )}
                                                    <p className="mt-1 font-serif text-lg font-bold text-warm-gray">
                                                        {formatVND(price)}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button
                                                        onClick={() => { moveToCart(item.cart_item_id); toast.success('Moved to cart'); }}
                                                        disabled={loading}
                                                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-burgundy/10 text-burgundy hover:bg-burgundy hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        Move to Cart
                                                    </button>
                                                    <button
                                                        onClick={() => { removeItem(item.cart_item_id); toast.success('Removed saved item'); }}
                                                        disabled={loading}
                                                        className="px-4 py-2 text-sm font-medium text-warm-gray hover:text-red-500 transition-colors disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-8 lg:mt-0">
                        <div className="sticky top-24 rounded-xl border border-light-border bg-white p-6">
                            <h2 className="font-serif text-lg font-bold text-charcoal mb-4">Order Summary</h2>

                            {/* Item list */}
                            <div className="space-y-3 text-sm border-b border-light-border pb-4 mb-4">
                                {items.map(item => {
                                    const price = item.price ?? 0;
                                    const lineTotal = price * item.quantity;
                                    return (
                                        <div key={item.cart_item_id} className="flex items-start gap-3">
                                            <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-cream-dark flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="h-full w-full object-cover rounded-lg" />
                                                ) : (
                                                    <span className="text-lg">🌿</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-charcoal font-medium truncate">{item.product_name || 'Product'}</p>
                                                <p className="text-xs text-warm-gray">
                                                    {formatVND(price)} × {item.quantity}
                                                </p>
                                            </div>
                                            <p className="text-charcoal font-medium">{formatVND(lineTotal)}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Price breakdown */}
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-warm-gray">Total MRP</span>
                                    <span className="text-charcoal">{formatVND(totalMRP)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-warm-gray">Discount on MRP</span>
                                    <span className={saleDiscount > 0 ? 'text-green-600 font-medium' : 'text-charcoal'}>
                                        {saleDiscount > 0 ? `-${formatVND(saleDiscount)}` : formatVND(0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-warm-gray">Coupon Discount</span>
                                    <span className={couponDiscount > 0 ? 'text-green-600 font-medium' : 'text-charcoal'}>
                                        {couponDiscount > 0 ? `-${formatVND(couponDiscount)}` : formatVND(0)}
                                    </span>
                                </div>
                                {totalTaxes > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-warm-gray">Taxes (VAT & Excise)</span>
                                        <span className="text-charcoal">{formatVND(totalTaxes)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-warm-gray">Delivery Fee</span>
                                    <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : 'text-charcoal'}>
                                        {deliveryFee === 0 ? 'FREE' : formatVND(deliveryFee)}
                                    </span>
                                </div>
                            </div>

                            {/* Coupon Input Section */}
                            <div className="mt-4 border-t border-light-border pt-4">
                                {couponCode ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-700">{couponCode}</span>
                                            <span className="text-xs text-green-600">(-{formatVND(couponDiscount)})</span>
                                        </div>
                                        <button onClick={() => { removeCoupon(); toast.success('Coupon removed'); }} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter coupon code"
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                className="flex-1 rounded-lg border border-light-border px-3 py-2 text-sm font-mono uppercase focus:border-burgundy focus:outline-none"
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!couponInput.trim()) return;
                                                    setApplyingCoupon(true);
                                                    const ok = await applyCoupon(couponInput.trim());
                                                    if (ok) { toast.success('Coupon applied!'); setCouponInput(''); }
                                                    setApplyingCoupon(false);
                                                }}
                                                disabled={applyingCoupon || !couponInput.trim()}
                                                className="rounded-lg bg-burgundy px-4 py-2 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {applyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Grand Total */}
                            <div className="mt-4 border-t border-light-border pt-4 flex justify-between">
                                <span className="font-serif text-lg font-bold text-burgundy">Grand Total</span>
                                <span className="font-serif text-lg font-bold text-burgundy">{formatVND(grandTotal)}</span>
                            </div>

                            <button
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        toast('Please sign in to proceed to checkout', { icon: '🔐' });
                                        router.push('/login?redirect=/cart');
                                    } else {
                                        router.push('/checkout');
                                    }
                                }}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-burgundy py-3 text-sm font-semibold text-white transition-all hover:bg-burgundy-dark"
                            >
                                {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Continue Shopping */}
                <div className="mt-8">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 rounded-lg border border-light-border px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Minus, Plus, X, ShoppingCart, ArrowLeft, Loader2, Ticket, Bookmark, ArrowRight, Leaf, MapPin, Search, FileText, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

/* ─── Step Indicators ─────────────────────────────────────────── */

const STEPS = ['BAG', 'SHIPPING', 'PAYMENT', 'REVIEW'] as const;

function StepIndicator({ currentStep = 0 }: { currentStep?: number }) {
    return (
        <div className="cart-step-bar">
            {STEPS.map((step, i) => (
                <div key={step} className="cart-step-item">
                    <div className="flex flex-col items-center">
                        <div
                            className={`cart-step-circle ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`}
                        >
                            {i < currentStep ? '✓' : i + 1}
                        </div>
                        <span className={`cart-step-label ${i <= currentStep ? 'active' : ''}`}>
                            {step}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`cart-step-line ${i < currentStep ? 'completed' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

/* ─── Main Cart Page ─────────────────────────────────────────── */

export default function CartPage() {
    const { formatPrice } = useCurrency();
    const {
        items, savedItems, updateQuantity, removeItem, saveForLater, moveToCart,
        totalPrice, totalItems, loading, error,
        couponCode, couponDiscount, couponType, couponError, applyCoupon, removeCoupon,
        orderNotes, setOrderNotes,
    } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [itemToRemove, setItemToRemove] = useState<string | null>(null);
    const [couponInput, setCouponInput] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Shipping estimation state
    const [shippingCountry, setShippingCountry] = useState('India');
    const [shippingZip, setShippingZip] = useState('');

    useEffect(() => {
        setIsMounted(true);
        if (items.length > 0) {
            const inStock = items.filter(i => (i.stock_quantity ?? 0) > 0);
            const total = inStock.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
            import('@/lib/analytics/gtag').then(({ trackEcommerce }) => {
                trackEcommerce('view_cart', {
                    currency: 'INR',
                    value: total,
                    items: items.map(item => ({
                        item_id: item.product_id || '',
                        item_name: item.product_name || '',
                        price: item.price || 0,
                        quantity: item.quantity
                    }))
                });
            });
        }
    }, [items.length]);

    if (loading && items.length === 0) {
        return (
            <div className="cart-leaf-bg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#6B8F5E]" />
            </div>
        );
    }

    if (items.length === 0 && savedItems.length === 0) {
        return (
            <div className="cart-leaf-bg flex items-center justify-center">
                <div className="cart-noise-overlay" aria-hidden="true" />
                <div className="text-center relative z-10 px-4 py-20">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white border border-[#E8E4DC]">
                        <ShoppingCart className="h-10 w-10 text-[#8B7A3D]" />
                    </div>
                    <h1 className="cart-page-title justify-center">Your Healing Bundle is Empty</h1>
                    <p className="mt-3 max-w-md mx-auto text-[#4A4A4A] text-sm">
                        Explore our sacred collection and add authentic Ayurvedic products to your wellness journey
                    </p>
                    <Link
                        href="/products"
                        className="cart-checkout-btn inline-flex mt-8"
                        style={{ width: 'auto', display: 'inline-flex' }}
                    >
                        Explore Sacred Shop
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    // Show saved items section even when cart is empty but saved items exist
    if (items.length === 0 && savedItems.length > 0) {
        return (
            <div className="cart-leaf-bg min-h-screen">
                <div className="cart-noise-overlay" aria-hidden="true" />
                <div className="border-b border-[#D4CFC0] bg-[#FFFFFF] sticky top-0 z-20 shadow-sm">
                    <div className="mx-auto max-w-5xl">
                        <StepIndicator currentStep={0} />
                    </div>
                </div>
                <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 relative z-10">
                    <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#91c934] hover:text-[#5A7A4E] mb-6 transition-colors uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4 text-[#91c934]" /> Continue Shopping
                    </Link>
                    <div className="cart-item-card text-center py-10 mb-6">
                        <ShoppingCart className="h-8 w-8 text-[#8B7A3D] mx-auto mb-3" />
                        <p className="text-[#4A4A4A] font-medium">Your active cart is empty.</p>
                        <Link href="/products" className="text-sm text-[#91c934] font-semibold hover:underline mt-2 inline-block">Browse Products</Link>
                    </div>
                    <div>
                        <h3 className="cart-saved-section-title">
                            <Bookmark className="h-5 w-5 text-[#91C934]" />
                            Saved for Later ({savedItems.length})
                        </h3>
                        <div className="space-y-4">
                            {savedItems.map(item => {
                                const price = item.price ?? 0;
                                return (
                                    <div key={item.cart_item_id} className="cart-item-card flex items-center gap-4 bg-[#FAFAFA]">
                                        <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`} className="cart-item-img w-16 h-16 rounded-lg flex-shrink-0">
                                            {item.image_url ? <img src={item.image_url} alt="" /> : <span className="text-xl">🌿</span>}
                                        </Link>
                                        <div className="flex-1">
                                            <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`}>
                                                <h3 className="text-sm font-bold text-[#1A1A1A] hover:text-[#3d5c3a] transition-colors">{item.product_name || 'Product'}</h3>
                                            </Link>
                                            <p className="text-[#4A4A4A] mt-1">{formatPrice(price)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button onClick={() => { moveToCart(item.cart_item_id); toast.success('Moved to cart'); }} disabled={loading} className="bg-[#6B8F5E] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#5A7A4E]">
                                                Move to Bag
                                            </button>
                                            <button onClick={() => setItemToRemove(item.cart_item_id)} disabled={loading} className="text-[#C0392B] text-[11px] uppercase tracking-wider font-semibold hover:underline">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <ConfirmModal
                    isOpen={!!itemToRemove}
                    title="Remove Item"
                    message="Are you sure you want to remove this item?"
                    confirmText="Remove"
                    cancelText="Cancel"
                    isDestructive={true}
                    onConfirm={() => {
                        if (itemToRemove) {
                            removeItem(itemToRemove);
                            toast.success('Removed item');
                            setItemToRemove(null);
                        }
                    }}
                    onCancel={() => setItemToRemove(null)}
                />
            </div>
        );
    }

    // Separate in-stock vs out-of-stock items
    const inStockItems = items.filter(i => (i.stock_quantity ?? 0) > 0);
    const outOfStockItems = items.filter(i => (i.stock_quantity ?? 0) === 0);
    const insufficientStockItems = inStockItems.filter(i => i.quantity > (i.stock_quantity ?? 0));
    const hasInsufficientStock = insufficientStockItems.length > 0;

    // Calculate totals using ONLY in-stock items
    const totalMRP = inStockItems.reduce((sum, item) => sum + (item.original_price ?? item.price ?? 0) * item.quantity, 0);
    const saleDiscount = totalMRP - inStockItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    const inStockTotal = inStockItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    const deliveryFee = couponType === 'free_shipping' ? 0 : (inStockTotal > 50 ? 0 : 15);
    const grandTotal = inStockTotal - couponDiscount + deliveryFee;
    const inStockItemCount = inStockItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="cart-leaf-bg min-h-screen">
            <div className="cart-noise-overlay" aria-hidden="true" />

            {/* Step Indicator */}
            <div className="border-b border-[#D4CFC0] bg-[#FFFFFF] sticky top-0 z-20 shadow-sm">
                <div className="mx-auto max-w-5xl">
                    <StepIndicator currentStep={0} />
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 relative z-10">
                {/* Back Link */}
                <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#91c934] hover:text-[#5A7A4E] mb-6 transition-colors uppercase tracking-wider">
                    <ArrowLeft className="h-4 w-4 text-[#91c934]" /> Continue Shopping
                </Link>

                <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
                    {/* Left Column: Cart Items & Widgets */}
                    <div className="flex flex-col gap-8">
                        {/* Cart Items */}
                        <div className="space-y-4">
                            {error && (
                                <div className="mb-2 rounded-xl p-4 text-sm flex items-center gap-2 bg-red-50 border border-red-200 text-red-600">
                                    <span>⚠</span> {error}
                                </div>
                            )}

                            {outOfStockItems.length > 0 && (
                                <div className="mb-4 rounded-xl p-4 text-sm flex items-start gap-3 bg-[#FFF3CD] border border-[#FFEEBA] text-[#856404]">
                                    <span className="mt-0.5">⚠️</span>
                                    <div>
                                        <p className="font-bold">Inventory Update</p>
                                        <p>Some items in your cart are out of stock. They won&apos;t be included in your order and will be saved for later when you checkout.</p>
                                    </div>
                                </div>
                            )}
                            {hasInsufficientStock && (
                                <div className="mb-4 rounded-xl p-4 text-sm flex items-start gap-3 bg-[#FFF3CD] border border-[#FFEEBA] text-[#856404]">
                                    <span className="mt-0.5">⚠️</span>
                                    <div>
                                        <p className="font-bold">Stock Limited</p>
                                        <p>One or more items exceed available stock. Please adjust the quantity to proceed.</p>
                                    </div>
                                </div>
                            )}

                            {items.length === 0 ? (
                                <div className="cart-item-card text-center py-10">
                                    <p className="text-[#4A4A4A] font-medium">Your active cart is empty.</p>
                                </div>
                            ) : (
                                items.map(item => {
                                    const price = item.price ?? 0;
                                    const unitPrice = item.original_price ?? price;
                                    const isOutOfStock = (item.stock_quantity ?? 0) === 0;
                                    const hasInsufficientStock = !isOutOfStock && item.quantity > (item.stock_quantity ?? 0);
                                    const isAtStockLimit = !isOutOfStock && item.quantity >= (item.stock_quantity ?? Infinity);

                                    return (
                                        <div key={item.cart_item_id} className="cart-item-card flex flex-col sm:flex-row gap-6">
                                            {/* Image */}
                                            <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`} className="cart-item-img flex-shrink-0">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.product_name || ''} />
                                                ) : (
                                                    <span className="text-3xl">🌿</span>
                                                )}
                                            </Link>

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`}>
                                                            <h3 className="cart-item-title text-lg font-bold">{item.product_name || 'Product'}</h3>
                                                        </Link>
                                                        {item.size_label && (
                                                            <p className="text-xs mt-1 text-[#6B6B60] uppercase tracking-wider font-semibold">{item.size_label}</p>
                                                        )}
                                                        {isOutOfStock && (
                                                            <p className="text-[10px] mt-2 text-[#C0392B] font-bold uppercase tracking-wider py-1 px-2 border border-[#C0392B] bg-red-50 inline-block rounded max-w-fit">Out of Stock</p>
                                                        )}
                                                        {hasInsufficientStock && (
                                                            <p className="text-xs mt-2 text-[#D35400] font-bold">Only {item.stock_quantity} left in stock</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-[#1A1A1A]">
                                                            {formatPrice(price * item.quantity)}
                                                        </div>
                                                        <div className="text-xs text-[#8B7A3D] mt-1">{formatPrice(price)} each</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    {/* Quantity */}
                                                    <div className={`cart-qty-control ${isOutOfStock ? 'opacity-40' : ''}`}>
                                                        <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} disabled={loading || isOutOfStock} className="cart-qty-btn disabled:opacity-50">
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="cart-qty-value">{item.quantity}</span>
                                                        <button onClick={() => { if (isAtStockLimit) { toast('Maximum stock reached', { icon: '⚠️' }); return; } updateQuantity(item.cart_item_id, item.quantity + 1); }} disabled={loading || isOutOfStock || isAtStockLimit} className="cart-qty-btn disabled:opacity-50">
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => { saveForLater(item.cart_item_id); toast.success('Saved for later'); }} disabled={loading} className="text-[#] text-[13px] font-semibold hover:underline px-2">
                                                            Save for Later
                                                        </button>
                                                        <button onClick={() => setItemToRemove(item.cart_item_id)} disabled={loading} className="cart-remove-btn">
                                                            <X className="h-3.5 w-3.5" /> Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Saved for Later Section */}
                        {savedItems.length > 0 && (
                            <div className="mt-4">
                                <h3 className="cart-saved-section-title">
                                    <Bookmark className="h-5 w-5 text-[#91c934]" />
                                    Saved for Later ({savedItems.length})
                                </h3>
                                <div className="space-y-4">
                                    {savedItems.map(item => {
                                        const price = item.price ?? 0;
                                        return (
                                            <div key={item.cart_item_id} className="cart-item-card flex items-center gap-4 bg-[#FAFAFA]">
                                                <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`} className="cart-item-img w-16 h-16 rounded-lg flex-shrink-0">
                                                    {item.image_url ? <img src={item.image_url} alt="" /> : <span className="text-xl">🌿</span>}
                                                </Link>
                                                <div className="flex-1">
                                                    <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`}>
                                                        <h3 className="text-sm font-bold text-[#1A1A1A] hover:text-[#3d5c3a] transition-colors">{item.product_name || 'Product'}</h3>
                                                    </Link>
                                                    <p className="text-[#4A4A4A] mt-1">{formatPrice(price)}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <button onClick={() => { moveToCart(item.cart_item_id); toast.success('Moved to cart'); }} disabled={loading} className="bg-[#91C934] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#7faf27]">
                                                        Move to Bag
                                                    </button>
                                                    <button onClick={() => setItemToRemove(item.cart_item_id)} disabled={loading} className="text-[#C0392B] text-[11px] uppercase tracking-wider font-semibold hover:underline">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Promo, Shipping and Notes Widgets */}
                        {items.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {/* Ayurvedic Practitioner Notes */}
                                <div className="cart-item-card p-6 border-l-4 border-l-[#2D3B2D]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-5 w-5 text-[#91C934]" />
                                        <h4 className="text-lg font-bold text-[#1A1A1A]">Order Notes <span className="text-[#6B6B60] font-normal text-xs">(optional)</span></h4>
                                    </div>
                                    <p className="text-[13px] text-[#6B6B60] mb-4">Add any specific allergies, preferences, or delivery instructions for our practitioners.</p>
                                    <textarea
                                        value={orderNotes}
                                        onChange={e => setOrderNotes(e.target.value.slice(0, 200))}
                                        maxLength={200}
                                        rows={3}
                                        placeholder="Type your notes here..."
                                        className="w-full rounded-lg border border-[#D4CFC0] bg-[#F5F4F0] px-4 py-3 text-sm focus:border-[#2D3B2D] focus:outline-none resize-none font-medium"
                                    />
                                    <p className="mt-1 text-[10px] text-[#6B6B60] text-right font-bold tracking-wider">{orderNotes.length}/200</p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="cart-item-card p-6 border-t-4 border-t-[#91C934]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Ticket className="h-5 w-5 text-[#91C934]" />
                                            <h4 className="text-lg font-bold text-[#1A1A1A]">Promo Offering</h4>
                                        </div>
                                        <p className="text-[13px] text-[#6B6B60] mb-4">Have a sacred promo code? Enter it below.</p>
                                        {couponCode ? (
                                            <div className="ritual-coupon-applied">
                                                <div className="coupon-info text-[#1A1A1A] font-semibold text-sm">
                                                    {couponCode} <span className="text-[#6B8F5E]">(-{formatPrice(couponDiscount)})</span>
                                                </div>
                                                <button onClick={() => { removeCoupon(); toast.success('Coupon removed'); }} className="text-[#C0392B] text-xs font-semibold uppercase hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter code"
                                                    value={couponInput}
                                                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                    className="flex-1 rounded-lg border border-[#D4CFC0] px-4 py-2 text-sm focus:border-[#8B7A3D] focus:outline-none bg-[#F5F4F0] font-mono uppercase"
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
                                                    className="bg-[#91c934] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#1F291F] transition-colors disabled:opacity-50 tracking-wide"
                                                >
                                                    {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                        {couponError && <p className="mt-2 text-xs text-[#C0392B]">{couponError}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ─── Ritual Summary Sidebar ─── */}
                    <div className="mt-8 lg:mt-0">
                        <div className="sticky top-28">
                            <div className="ritual-summary">
                                <div className="ritual-summary-title">
                                    <div className="w-8 h-8 rounded-full bg-[#F5F4F0] flex items-center justify-center mr-2 border border-[#E8E4DC]">
                                        <Leaf className="w-4 h-4 text-[#91C934]" />
                                    </div>
                                    Investment Summary
                                    <span className="ritual-summary-badge">{inStockItemCount} Item{inStockItemCount !== 1 ? 's' : ''}</span>
                                </div>
                                <p className="text-[10px] uppercase tracking-[2px] text-[rgba(255,255,255,0.5)] mb-4 -mt-2">Preparing your path to healing</p>

                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {inStockItems.length === 0 ? (
                                        <p className="text-[rgba(255,255,255,0.5)] text-xs text-center py-4">No in-stock items in your cart</p>
                                    ) : inStockItems.map(item => {
                                        const price = item.price ?? 0;
                                        const lineTotal = price * item.quantity;
                                        return (
                                            <div key={item.cart_item_id} className="ritual-summary-item pb-3 border-b border-[rgba(255,255,255,0.1)] last:border-0 last:pb-0">
                                                <div className="ritual-summary-item-img">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-sm text-[#1A1A1A]">🌿</span>
                                                    )}
                                                </div>
                                                <div className="ritual-summary-item-name">
                                                    {item.product_name || 'Product'}
                                                    <div className="ritual-summary-item-qty mt-0.5">Qty: {item.quantity}</div>
                                                </div>
                                                <span className="ritual-summary-item-price">{formatPrice(lineTotal)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="ritual-summary-divider" />

                                <div className="space-y-2">
                                    <div className="ritual-summary-row">
                                        <span className="label">Bundle Subtotal</span>
                                        <span className="value">{formatPrice(totalMRP)}</span>
                                    </div>
                                    {saleDiscount > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label">Vedic Discount</span>
                                            <span className="value !text-[#86EFAC]">- {formatPrice(saleDiscount)}</span>
                                        </div>
                                    )}
                                    {couponDiscount > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label">Promo Discount</span>
                                            <span className="value !text-[#86EFAC]">- {formatPrice(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="ritual-summary-row">
                                        <span className="label">Vedic Shipping <span className="text-[9px] uppercase tracking-wider opacity-70 ml-1">(Standard)</span></span>
                                        <span className="value">{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                                    </div>

                                </div>

                                <div className="ritual-summary-total">
                                    <div>
                                        <div className="ritual-summary-total-label">Total Investment</div>
                                        <div className="ritual-summary-total-value mt-1">{formatPrice(grandTotal)}</div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)]">
                                        <Leaf className="h-5 w-5 text-white opacity-80" />
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        if (hasInsufficientStock || loading || inStockItems.length === 0) return;
                                        if (!isAuthenticated) {
                                            toast('Please sign in to proceed to checkout', { icon: '🔐' });
                                            router.push('/login?redirect=/cart');
                                            return;
                                        }
                                        // Auto-save out-of-stock items for later before checkout
                                        if (outOfStockItems.length > 0) {
                                            for (const oosItem of outOfStockItems) {
                                                try {
                                                    await saveForLater(oosItem.cart_item_id);
                                                } catch (e) {
                                                    console.warn('Failed to save OOS item for later:', e);
                                                }
                                            }
                                            toast.success(`${outOfStockItems.length} out-of-stock item${outOfStockItems.length > 1 ? 's' : ''} saved for later`);
                                        }
                                        router.push('/checkout');
                                    }}
                                    disabled={hasInsufficientStock || loading || inStockItems.length === 0}
                                    className="cart-checkout-btn block w-full text-center hover:bg-[#8B7A3D] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAuthenticated ? 'Confirm & Complete Ritual' : 'Sign In to Checkout'}
                                </button>

                                <div className="mt-5 flex items-center justify-center gap-4 text-[9px] text-[rgba(255,255,255,0.5)] font-bold tracking-[1.5px] uppercase">
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full border border-[rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-0.5 h-0.5 bg-white rounded-full"></div></div> Secure Transaction</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full border border-[rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-0.5 h-0.5 bg-white rounded-full"></div></div> Fast Processing</span>
                                </div>
                            </div>

                            <Link href="/help-center/support" className="cart-advisor-card cursor-pointer flex">
                                <div className="icon-wrapper border border-[#D4CFC0]">
                                    <Leaf className="w-5 h-5" />
                                </div>
                                <div className="text-content">
                                    <p className="title">Need Guidance?</p>
                                    <p className="subtitle">Our Vedic advisors are available to assist with your transaction.</p>
                                </div>
                                <span className="action">Contact Support</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Remove Confirmation Modal via Portal */}
            <ConfirmModal
                isOpen={!!itemToRemove}
                title="Remove Item"
                message="Are you sure you want to remove this item from your ritual bundle?"
                confirmText="Remove"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={() => {
                    if (itemToRemove) {
                        removeItem(itemToRemove);
                        toast.success('Removed item');
                        setItemToRemove(null);
                    }
                }}
                onCancel={() => setItemToRemove(null)}
            />
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Minus, Plus, X, ShoppingCart, ArrowLeft, Loader2, Ticket, Bookmark, ArrowRight, Leaf, MapPin, Search } from 'lucide-react';
import { formatVND } from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

/* ─── Step Indicator ─────────────────────────────────────────── */

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
    const {
        items, savedItems, updateQuantity, removeItem, saveForLater, moveToCart,
        totalPrice, totalItems, loading, error,
        couponCode, couponDiscount, couponType, couponError, applyCoupon, removeCoupon,
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
    }, []);

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

    const totalMRP = items.reduce((sum, item) => sum + (item.original_price ?? item.price ?? 0) * item.quantity, 0);
    const saleDiscount = totalMRP - items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    const totalTaxes = items.reduce((sum, item) => sum + ((item as any).pricing?.tax_amount ?? 0), 0);
    const deliveryFee = couponType === 'free_shipping' ? 0 : (totalPrice > 50 ? 0 : 15); // Default $15 standard
    const grandTotal = totalPrice - couponDiscount + deliveryFee;

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
                <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B8F5E] hover:text-[#5A7A4E] mb-6 transition-colors uppercase tracking-wider">
                    <ArrowLeft className="h-4 w-4" /> Continue Shopping
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

                            {items.length === 0 ? (
                                <div className="cart-item-card text-center py-10">
                                    <p className="text-[#4A4A4A] font-medium">Your active cart is empty.</p>
                                </div>
                            ) : (
                                items.map(item => {
                                    const price = item.price ?? 0;
                                    const unitPrice = item.original_price ?? price;
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
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-serif text-lg font-bold text-[#1A1A1A]">
                                                            {formatVND(price * item.quantity)}
                                                        </div>
                                                        <div className="text-xs text-[#8B7A3D] mt-1">{formatVND(price)} each</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    {/* Quantity */}
                                                    <div className="cart-qty-control">
                                                        <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} disabled={loading} className="cart-qty-btn">
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="cart-qty-value">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} disabled={loading} className="cart-qty-btn">
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => { saveForLater(item.cart_item_id); toast.success('Saved for later'); }} disabled={loading} className="text-[#8B7A3D] text-[13px] font-semibold hover:underline px-2">
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
                                    <Bookmark className="h-5 w-5 text-[#8B7A3D]" />
                                    Saved for Later ({savedItems.length})
                                </h3>
                                <div className="space-y-4">
                                    {savedItems.map(item => {
                                        const price = item.price ?? 0;
                                        return (
                                            <div key={item.cart_item_id} className="cart-item-card flex items-center gap-4 bg-[#FAFAFA] opacity-80 hover:opacity-100">
                                                <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`} className="cart-item-img w-16 h-16 rounded-lg flex-shrink-0">
                                                    {item.image_url ? <img src={item.image_url} alt="" /> : <span className="text-xl">🌿</span>}
                                                </Link>
                                                <div className="flex-1">
                                                    <Link href={`/products/${(item as any).slug || item.product_id || item.product?.product_id || ''}${item.variant_id ? `?variant=${item.variant_id}` : ''}`}>
                                                        <h3 className="text-sm font-bold text-[#1A1A1A] hover:text-[#3d5c3a] transition-colors">{item.product_name || 'Product'}</h3>
                                                    </Link>
                                                    <p className="font-serif text-[#4A4A4A] mt-1">{formatVND(price)}</p>
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
                        )}

                        {/* Promo and Shipping Widgets */}
                        {items.length > 0 && (
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="cart-item-card p-6 border-t-4 border-t-[#8B7A3D]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Ticket className="h-5 w-5 text-[#8B7A3D]" />
                                        <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">Promo Offering</h4>
                                    </div>
                                    <p className="text-[13px] text-[#6B6B60] mb-4">Have a sacred promo code? Enter it below.</p>
                                    {couponCode ? (
                                        <div className="ritual-coupon-applied">
                                            <div className="coupon-info text-[#1A1A1A] font-semibold text-sm">
                                                {couponCode} <span className="text-[#6B8F5E]">(-{formatVND(couponDiscount)})</span>
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
                                                className="bg-[#2D3B2D] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#1F291F] transition-colors disabled:opacity-50 tracking-wide"
                                            >
                                                {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                    )}
                                    {couponError && <p className="mt-2 text-xs text-[#C0392B]">{couponError}</p>}
                                </div>

                                <div className="cart-item-card p-6 border-t-4 border-t-[#6B8F5E]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-5 w-5 text-[#6B8F5E]" />
                                        <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">Shipping Sanctuary</h4>
                                    </div>
                                    <p className="text-[13px] text-[#6B6B60] mb-4">Estimate delivery to your location.</p>
                                    <div className="space-y-3">
                                        <select
                                            value={shippingCountry}
                                            onChange={(e) => setShippingCountry(e.target.value)}
                                            className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-[#F5F4F0]"
                                        >
                                            <option value="India">India</option>
                                            <option value="USA">United States</option>
                                            <option value="UK">United Kingdom</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Zip / Postal Code"
                                                value={shippingZip}
                                                onChange={(e) => setShippingZip(e.target.value)}
                                                className="flex-1 rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-[#F5F4F0]"
                                            />
                                            <button className="bg-[#E8E4DC] text-[#1A1A1A] px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#D4CFC0] transition-colors tracking-wide">
                                                Update
                                            </button>
                                        </div>
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
                                    <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center mr-2">
                                        <Leaf className="w-4 h-4 text-white" />
                                    </div>
                                    Investment Summary
                                    <span className="ritual-summary-badge">{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
                                </div>
                                <p className="text-[10px] uppercase tracking-[2px] text-[rgba(255,255,255,0.5)] mb-4 -mt-2">Preparing your path to healing</p>

                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map(item => {
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
                                                <span className="ritual-summary-item-price">{formatVND(lineTotal)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="ritual-summary-divider" />

                                <div className="space-y-2">
                                    <div className="ritual-summary-row">
                                        <span className="label">Bundle Subtotal</span>
                                        <span className="value">{formatVND(totalMRP)}</span>
                                    </div>
                                    {saleDiscount > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label">Vedic Discount</span>
                                            <span className="value !text-[#86EFAC]">- {formatVND(saleDiscount)}</span>
                                        </div>
                                    )}
                                    {couponDiscount > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label">Promo Discount</span>
                                            <span className="value !text-[#86EFAC]">- {formatVND(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="ritual-summary-row">
                                        <span className="label">Vedic Shipping <span className="text-[9px] uppercase tracking-wider opacity-70 ml-1">(Standard)</span></span>
                                        <span className="value">{deliveryFee === 0 ? 'FREE' : formatVND(deliveryFee)}</span>
                                    </div>
                                    {totalTaxes > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label">Ayurvedic Levy (Tax)</span>
                                            <span className="value">{formatVND(totalTaxes)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="ritual-summary-total">
                                    <div>
                                        <div className="ritual-summary-total-label">Total Investment</div>
                                        <div className="ritual-summary-total-value mt-1">{formatVND(grandTotal)}</div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)]">
                                        <Leaf className="h-5 w-5 text-white opacity-80" />
                                    </div>
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
                                    className="cart-checkout-btn block w-full text-center hover:bg-[#8B7A3D]"
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

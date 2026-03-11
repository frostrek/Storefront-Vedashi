'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
    checkoutOrder, directCheckout, getAddresses, formatVND,
    createPaymentOrder, verifyPayment,
} from '@/lib/api';
import { Address } from '@/types';
import { CheckCircle, Loader2, MapPin, CreditCard, Banknote, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────── */

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface BuyNowItem {
    product_id: string;
    product_name: string;
    variant_id: string | null;
    size_label: string;
    quantity: number;
    unit_price: number;
    image_url: string;
}

type PaymentMethod = 'razorpay' | 'cod';

/* ─── Component ─────────────────────────────────────────────── */

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isBuyNow = searchParams.get('buyNow') === 'true';
    const { items, totalPrice, clearCart, cartId, couponCode, couponDiscount, couponType, removeCoupon } = useCart();
    const { user, isAuthenticated, verifyUserAge } = useAuth();

    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderNotes, setOrderNotes] = useState('');

    // Payment method selection
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [failedOrderId, setFailedOrderId] = useState<string | null>(null);

    // Age Verification State
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [dob, setDob] = useState('');
    const [verifyingAge, setVerifyingAge] = useState(false);

    // Saved addresses
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [addressesLoading, setAddressesLoading] = useState(false);

    // New address form fields (matching backend)
    const [newAddress, setNewAddress] = useState({
        address_line1: '', address_line2: '', city: '', state: '', pincode: '', phone: '',
    });

    // Buy Now single-item state
    const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);

    // Load Buy Now item from sessionStorage
    useEffect(() => {
        if (isBuyNow) {
            try {
                const stored = sessionStorage.getItem('vedashi_buy_now_item');
                if (stored) {
                    setBuyNowItem(JSON.parse(stored));
                } else {
                    router.replace('/checkout');
                }
            } catch {
                router.replace('/checkout');
            }
        }
    }, [isBuyNow, router]);

    // Compute prices based on Buy Now or Cart
    const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : items;

    const baseSubtotal = isBuyNow && buyNowItem
        ? buyNowItem.unit_price * buyNowItem.quantity
        : items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

    const totalTaxes = isBuyNow ? 0 : items.reduce((sum, item) => sum + ((item as any).pricing?.tax_amount ?? 0), 0);

    const subtotalWithTaxes = isBuyNow && buyNowItem
        ? buyNowItem.unit_price * buyNowItem.quantity
        : totalPrice;

    const shippingCost = couponType === 'free_shipping' ? 0 : (subtotalWithTaxes > 50 ? 0 : 5);
    const discount = isBuyNow ? 0 : couponDiscount;
    const grandTotal = subtotalWithTaxes + shippingCost - discount;

    // Load saved addresses for logged-in users
    useEffect(() => {
        if (user?.id) {
            setAddressesLoading(true);
            getAddresses(user.id)
                .then(res => {
                    if (res.success && Array.isArray(res.data)) {
                        setSavedAddresses(res.data);
                        const defaultAddr = res.data.find((a: Address) => a.is_default) || res.data[0];
                        if (defaultAddr) {
                            setSelectedAddressId(defaultAddr.address_id);
                        } else {
                            setUseNewAddress(true);
                        }
                    } else {
                        setUseNewAddress(true);
                    }
                })
                .catch(() => setUseNewAddress(true))
                .finally(() => setAddressesLoading(false));
        } else {
            setUseNewAddress(true);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!isBuyNow && items.length === 0 && !orderPlaced) {
            router.push('/cart');
        }
    }, [items.length, orderPlaced, router, isBuyNow]);

    // Auto-proceed checkout when is_age_verified becomes true
    useEffect(() => {
        if (isAuthenticated && user?.is_age_verified && showAgeModal) {
            toast.success('Age verified. Placing order...');
            setShowAgeModal(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.is_age_verified]);

    if (!isBuyNow && items.length === 0 && !orderPlaced) {
        return null;
    }

    if (isBuyNow && !buyNowItem && !orderPlaced) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#3B5D3B]" />
            </div>
        );
    }

    /* ─── Razorpay Checkout Handler ──────────────────────────── */

    const openRazorpayCheckout = async (platformOrderId: string) => {
        setPaymentProcessing(true);

        try {
            // 1. Create Razorpay order from our backend
            const payRes = await createPaymentOrder(platformOrderId);
            if (!payRes.success) {
                throw new Error(payRes.message || 'Failed to create payment order');
            }

            const { razorpay_order_id, razorpay_key_id, amount, currency } = payRes.data;

            // 2. Open Razorpay checkout modal
            const options = {
                key: razorpay_key_id,
                amount,
                currency,
                name: 'Vedashi',
                description: `Order #${platformOrderId.slice(0, 8)}`,
                order_id: razorpay_order_id,
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: '',
                },
                theme: {
                    color: '#3B5D3B',
                    backdrop_color: 'rgba(0,0,0,0.6)',
                },
                modal: {
                    ondismiss: () => {
                        // User closed the modal without paying
                        setPaymentProcessing(false);
                        setPaymentFailed(true);
                        setFailedOrderId(platformOrderId);
                        toast.error('Payment was not completed. You can retry anytime.');
                    },
                },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    // 3. Verify payment on our backend
                    try {
                        const verifyRes = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: platformOrderId,
                        });

                        if (verifyRes.success) {
                            setOrderId(platformOrderId);
                            if (!isBuyNow) {
                                await clearCart(true);
                                removeCoupon();
                            }
                            sessionStorage.removeItem('vedashi_buy_now_item');
                            setOrderPlaced(true);
                            setStep(3);
                            setPaymentFailed(false);
                            setFailedOrderId(null);
                            toast.success('Payment successful! Order confirmed.');
                        } else {
                            setPaymentFailed(true);
                            setFailedOrderId(platformOrderId);
                            toast.error(verifyRes.message || 'Payment verification failed');
                        }
                    } catch {
                        setPaymentFailed(true);
                        setFailedOrderId(platformOrderId);
                        toast.error('Payment verification failed. Please contact support.');
                    }
                    setPaymentProcessing(false);
                },
            };

            // Ensure Razorpay script is loaded
            if (typeof window.Razorpay === 'undefined') {
                // Load it dynamically as fallback
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Razorpay'));
                    document.head.appendChild(script);
                });
            }

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
                console.error('Razorpay payment failed:', response.error);
                setPaymentProcessing(false);
                setPaymentFailed(true);
                setFailedOrderId(platformOrderId);
                toast.error(response.error?.description || 'Payment failed. Please try again.');
            });
            rzp.open();
        } catch (error: any) {
            console.error('Razorpay error:', error);
            setPaymentProcessing(false);
            toast.error(error.message || 'Failed to initiate payment');
        }
    };

    /* ─── Retry Payment for Failed Order ─────────────────────── */

    const handleRetryPayment = async () => {
        if (!failedOrderId) return;
        await openRazorpayCheckout(failedOrderId);
    };

    /* ─── Place Order Handler ────────────────────────────────── */

    const handlePlaceOrder = async () => {
        // Validate address
        if (useNewAddress) {
            if (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
                toast.error('Please fill in all required address fields');
                return;
            }
        } else if (!selectedAddressId) {
            toast.error('Please select a shipping address');
            return;
        }

        if (isAuthenticated && user && !user.is_age_verified) {
            setShowAgeModal(true);
            return;
        }

        setPlacing(true);
        setPaymentFailed(false);

        try {
            let result;

            if (isBuyNow && buyNowItem) {
                result = await directCheckout({
                    customer_id: user?.id || undefined,
                    customer_name: user?.name || undefined,
                    customer_email: user?.email || undefined,
                    items: [{
                        product_id: buyNowItem.product_id,
                        variant_id: buyNowItem.variant_id,
                        quantity: buyNowItem.quantity,
                        unit_price: buyNowItem.unit_price,
                    }],
                    shipping_address_id: useNewAddress ? undefined : selectedAddressId || undefined,
                    shipping_address: useNewAddress ? newAddress as unknown as Record<string, string> : undefined,
                    payment_method: paymentMethod,
                    order_notes: orderNotes.trim() || undefined,
                });
            } else if (isAuthenticated && cartId && user?.id) {
                result = await checkoutOrder({
                    cart_id: cartId,
                    customer_id: user.id,
                    shipping_address_id: useNewAddress ? undefined : selectedAddressId || undefined,
                    coupon_code: couponCode || undefined,
                    order_notes: orderNotes.trim() || undefined,
                    payment_method: paymentMethod,
                } as any);
            } else {
                const orderItems = items.map(item => ({
                    product_id: item.product_id || '',
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    unit_price: Number(item.price) || 0,
                }));

                result = await directCheckout({
                    customer_id: user?.id || undefined,
                    customer_name: user?.name || undefined,
                    customer_email: user?.email || undefined,
                    items: orderItems,
                    shipping_address: useNewAddress ? newAddress as unknown as Record<string, string> : undefined,
                    payment_method: paymentMethod,
                    coupon_code: couponCode || undefined,
                    order_notes: orderNotes.trim() || undefined,
                });
            }

            if (result.success) {
                const createdOrderId = result.data?.order_id;

                if (paymentMethod === 'razorpay' && createdOrderId) {
                    // ── Online Payment: Open Razorpay ──
                    setPlacing(false);
                    await openRazorpayCheckout(createdOrderId);
                } else {
                    // ── COD: Order is complete ──
                    setOrderId(createdOrderId || null);
                    if (!isBuyNow) {
                        await clearCart(true);
                        removeCoupon();
                    }
                    sessionStorage.removeItem('vedashi_buy_now_item');
                    setOrderPlaced(true);
                    setStep(3);
                    toast.success('Order placed successfully!');
                }
            } else {
                toast.error(result.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    const handleVerifyAge = async () => {
        if (!dob) {
            toast.error('Please enter your date of birth');
            return;
        }
        setVerifyingAge(true);
        try {
            const res = await verifyUserAge(dob);
            if (res.success) {
                toast.success('Age verified successfully!');
                setShowAgeModal(false);
            } else {
                toast.error(res.error || 'You must be 18 or older to purchase.');
            }
        } catch (error) {
            toast.error('Something went wrong verifying your age.');
        } finally {
            setVerifyingAge(false);
        }
    };

    /* ─── Order Placed Confirmation ──────────────────────────── */

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <CheckCircle className="mx-auto h-20 w-20 text-green-600 mb-6" />
                    <h1 className="font-serif text-3xl font-bold text-charcoal">Order Confirmed!</h1>
                    {orderId && (
                        <p className="mt-2 text-sm font-mono text-warm-gray">Order ID: {orderId}</p>
                    )}
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        {paymentMethod === 'razorpay' ? 'Payment Confirmed' : 'Cash on Delivery'}
                    </div>
                    <p className="mt-4 text-warm-gray">
                        Thank you for your order. We&apos;ll send you an email confirmation shortly.
                    </p>
                    <div className="mt-8 flex flex-col gap-3">
                        <Link
                            href="/account"
                            className="rounded-lg bg-burgundy py-3 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors"
                        >
                            View Order History
                        </Link>
                        <Link
                            href="/products"
                            className="rounded-lg border border-light-border py-3 text-sm font-medium text-charcoal hover:bg-white transition-colors"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Main Checkout UI ───────────────────────────────────── */

    return (
        <div className="min-h-screen bg-cream">
            {/* Step Indicator */}
            <div className="border-b border-light-border bg-white py-6">
                <div className="mx-auto max-w-4xl flex items-center justify-center gap-3 sm:gap-6 md:gap-8 px-4 flex-wrap">
                    {['Cart', 'Address', 'Payment', 'Confirmation'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${i <= step ? 'bg-[#3B5D3B] text-white' : 'bg-[#F5F2E8] text-[#6B6B60]'
                                }`}>
                                {i + 1}
                            </div>
                            <span className={`text-sm font-medium hidden sm:inline ${i <= step ? 'text-[#3B5D3B]' : 'text-[#6B6B60]'}`}>
                                {s}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">

                {/* ── Step 1: Address ── */}
                {step === 1 && (
                    <div>
                        <h1 className="font-serif text-xl sm:text-2xl font-bold text-charcoal mb-4 sm:mb-6">Shipping Address</h1>

                        {/* Saved Addresses */}
                        {addressesLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-burgundy" />
                            </div>
                        ) : savedAddresses.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm font-medium text-charcoal mb-3">Select a saved address:</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {savedAddresses.map(addr => (
                                        <label
                                            key={addr.address_id}
                                            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${selectedAddressId === addr.address_id && !useNewAddress
                                                ? 'border-[#3B5D3B] bg-[#3B5D3B]/5'
                                                : 'border-light-border hover:border-[#3B5D3B]/50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="address"
                                                checked={selectedAddressId === addr.address_id && !useNewAddress}
                                                onChange={() => { setSelectedAddressId(addr.address_id); setUseNewAddress(false); }}
                                                className="mt-1 accent-[#3B5D3B]"
                                            />
                                            <div>
                                                {addr.label && <span className="text-xs font-bold text-[#3B5D3B] uppercase">{addr.label}</span>}
                                                <p className="text-sm text-charcoal">{addr.address_line1}</p>
                                                {addr.address_line2 && <p className="text-sm text-warm-gray">{addr.address_line2}</p>}
                                                <p className="text-sm text-warm-gray">{addr.city}, {addr.state} {addr.pincode}</p>
                                                {addr.phone && <p className="text-xs text-warm-gray mt-1">📞 {addr.phone}</p>}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setUseNewAddress(true)}
                                    className={`mt-3 flex items-center gap-2 text-sm font-medium transition-colors ${useNewAddress ? 'text-burgundy' : 'text-warm-gray hover:text-charcoal'}`}
                                >
                                    <MapPin className="h-4 w-4" /> Use a new address
                                </button>
                            </div>
                        )}

                        {/* New Address Form */}
                        {useNewAddress && (
                            <div className="rounded-xl border border-light-border bg-white p-6 shadow-sm">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Address Line 1 *</label>
                                        <input
                                            type="text"
                                            value={newAddress.address_line1}
                                            onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#3B5D3B] focus:outline-none"
                                            placeholder="Street address"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={newAddress.address_line2}
                                            onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#3B5D3B] focus:outline-none"
                                            placeholder="Apartment, suite, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">City *</label>
                                        <input
                                            type="text"
                                            value={newAddress.city}
                                            onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#3B5D3B] focus:outline-none"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">State *</label>
                                        <input
                                            type="text"
                                            value={newAddress.state}
                                            onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#3B5D3B] focus:outline-none"
                                            placeholder="State"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Pincode *</label>
                                        <input
                                            type="text"
                                            value={newAddress.pincode}
                                            onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#3B5D3B] focus:outline-none"
                                            placeholder="Pincode"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2C2C2C] mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={newAddress.phone}
                                            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                            className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-[#3B5D3B] focus:outline-none"
                                            placeholder="Phone number"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            className="mt-6 w-full rounded-lg bg-[#3B5D3B] py-3 text-sm font-semibold text-white hover:bg-[#2D4A2D] transition-colors shadow-lg shadow-[#3B5D3B]/20"
                        >
                            Continue to Payment
                        </button>
                    </div>
                )}

                {/* ── Step 2: Payment ── */}
                {step === 2 && (
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-charcoal mb-6">Payment</h1>
                        <div className="rounded-xl border border-light-border bg-white p-6">

                            {/* Payment Failed Retry Banner */}
                            {paymentFailed && failedOrderId && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">Payment was not completed</p>
                                        <p className="text-xs text-amber-600 mt-1">Your order has been created but payment is pending. Click below to retry.</p>
                                        <button
                                            onClick={handleRetryPayment}
                                            disabled={paymentProcessing}
                                            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                                        >
                                            {paymentProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                            Retry Payment
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method Selection */}
                            <div className="space-y-3 mb-6">
                                <p className="text-sm font-medium text-charcoal mb-2">Select payment method:</p>

                                {/* Pay Online */}
                                <label
                                    className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === 'razorpay'
                                        ? 'border-burgundy bg-burgundy/5 shadow-sm'
                                        : 'border-light-border hover:border-burgundy/40'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        value="razorpay"
                                        checked={paymentMethod === 'razorpay'}
                                        onChange={() => setPaymentMethod('razorpay')}
                                        className="accent-burgundy w-4 h-4"
                                    />
                                    <CreditCard className={`h-5 w-5 ${paymentMethod === 'razorpay' ? 'text-burgundy' : 'text-warm-gray'}`} />
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold text-charcoal">Pay Online</span>
                                        <p className="text-xs text-warm-gray mt-0.5">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-6 w-9 rounded bg-blue-600 flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-white">VISA</span>
                                        </div>
                                        <div className="h-6 w-9 rounded bg-red-500 flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-white">MC</span>
                                        </div>
                                        <div className="h-6 w-9 rounded bg-green-600 flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-white">UPI</span>
                                        </div>
                                    </div>
                                </label>

                                {/* Cash on Delivery */}
                                <label
                                    className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === 'cod'
                                        ? 'border-burgundy bg-burgundy/5 shadow-sm'
                                        : 'border-light-border hover:border-burgundy/40'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="accent-burgundy w-4 h-4"
                                    />
                                    <Banknote className={`h-5 w-5 ${paymentMethod === 'cod' ? 'text-burgundy' : 'text-warm-gray'}`} />
                                    <div>
                                        <span className="text-sm font-semibold text-charcoal">Cash on Delivery</span>
                                        <p className="text-xs text-warm-gray mt-0.5">Pay when you receive your order</p>
                                    </div>
                                </label>
                            </div>

                            {/* Order Notes */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-charcoal mb-1">Order Notes <span className="text-warm-gray font-normal">(optional)</span></label>
                                <textarea
                                    id="order-notes"
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value.slice(0, 200))}
                                    maxLength={200}
                                    rows={3}
                                    placeholder="Any special instructions for your order..."
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none resize-none"
                                />
                                <p className="mt-1 text-xs text-warm-gray text-right">{orderNotes.length}/200</p>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t border-light-border pt-4 space-y-2 text-sm">
                                {/* Show item details for Buy Now */}
                                {isBuyNow && buyNowItem && (
                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-light-border">
                                        {buyNowItem.image_url && (
                                            <img src={buyNowItem.image_url} alt={buyNowItem.product_name} className="w-12 h-12 object-cover rounded-lg" />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-charcoal">{buyNowItem.product_name}</p>
                                            {buyNowItem.size_label && <p className="text-xs text-warm-gray">{buyNowItem.size_label}</p>}
                                            <p className="text-xs text-warm-gray">Qty: {buyNowItem.quantity}</p>
                                        </div>
                                        <p className="text-sm font-semibold">{formatVND(buyNowItem.unit_price * buyNowItem.quantity)}</p>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-warm-gray">Subtotal ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'})</span>
                                    <span>{formatVND(baseSubtotal)}</span>
                                </div>
                                {totalTaxes > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-warm-gray">Taxes (VAT & Excise)</span>
                                        <span className="text-charcoal">{formatVND(totalTaxes)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-warm-gray">Shipping</span>
                                    <span>{shippingCost === 0 ? 'Free' : formatVND(shippingCost)}</span>
                                </div>
                                {!isBuyNow && couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Coupon ({couponCode})</span>
                                        <span>-{formatVND(couponDiscount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-serif text-lg font-bold text-burgundy pt-2 border-t border-light-border mt-2">
                                    <span>Total</span><span>{formatVND(grandTotal)}</span>
                                </div>
                            </div>

                            {/* Secure Payment Badge */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-warm-gray">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <span>256-bit SSL Encrypted · Secure Checkout</span>
                            </div>

                            {/* Terms */}
                            <div className="mt-6 mb-4 p-4 rounded-lg bg-cream border border-light-border">
                                <p className="text-xs text-[#6B6B60] leading-relaxed text-center">
                                    By placing your order, you agree to our Terms & Conditions, Privacy Policy, and Refund Policy. For specific Ayurvedic formulations, please consult with a practitioner if you have underlying health conditions. Valid government ID may be required for age-restricted items.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-2 flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="rounded-lg border border-light-border px-6 py-3 text-sm font-medium text-charcoal hover:bg-cream transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={placing || paymentProcessing}
                                    className="flex-1 rounded-lg bg-[#3B5D3B] py-3 text-sm font-semibold text-white hover:bg-[#2D4A2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#3B5D3B]/20"
                                >
                                    {placing || paymentProcessing ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                                    ) : paymentMethod === 'razorpay' ? (
                                        <><CreditCard className="h-4 w-4" /> Pay {formatVND(grandTotal)}</>
                                    ) : (
                                        `Place Order — ${formatVND(grandTotal)}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Age Verification Modal */}
            {showAgeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
                            <span className="font-serif text-2xl font-bold text-burgundy">18+</span>
                        </div>
                        <h2 className="text-center font-serif text-2xl font-bold text-[#2C2C2C] mb-2">Verification Required</h2>
                        <p className="text-center text-sm text-[#6B6B60] mb-6">
                            Certain Ayurvedic formulations require age verification. Please enter your date of birth to continue checkout.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full rounded-lg border border-light-border px-4 py-3 text-sm focus:border-burgundy focus:outline-none"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAgeModal(false)}
                                    className="flex-1 rounded-lg border border-light-border py-3 text-sm font-medium text-charcoal hover:bg-cream transition-colors"
                                    disabled={verifyingAge}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerifyAge}
                                    disabled={verifyingAge || !dob}
                                    className="flex-1 rounded-lg bg-burgundy py-3 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {verifyingAge ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

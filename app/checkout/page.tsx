'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
    checkoutOrder, directCheckout, getAddresses, formatVND,
    createPaymentOrder, verifyPayment,
} from '@/lib/api';
import { Address } from '@/types';
import { CheckCircle, Loader2, MapPin, CreditCard, Banknote, ShieldCheck, AlertTriangle, ArrowLeft, Leaf, ChevronRight, Lock, Ticket } from 'lucide-react';
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

const STEPS = ['BAG', 'SHIPPING', 'PAYMENT', 'REVIEW'] as const;

function StepIndicator({ currentStep = 1 }: { currentStep?: number }) {
    return (
        <div className="cart-step-bar">
            {STEPS.map((step, i) => (
                <div key={step} className="cart-step-item">
                    <div className="flex flex-col items-center">
                        <div className={`cart-step-circle ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`}>
                            {i < currentStep ? '✓' : i + 1}
                        </div>
                        <span className={`cart-step-label ${i <= currentStep ? 'active' : ''}`}>{step}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`cart-step-line ${i < currentStep ? 'completed' : ''}`} />}
                </div>
            ))}
        </div>
    );
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isBuyNow = searchParams.get('buyNow') === 'true';
    const { items, totalPrice, clearCart, cartId, couponCode, couponDiscount, couponType, removeCoupon, applyCoupon, totalItems } = useCart();
    const { user, isAuthenticated } = useAuth();

    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderNotes, setOrderNotes] = useState('');

    // Payment method selection
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
    
    // Extra form fields for dummy display
    const [contactEmail, setContactEmail] = useState(user?.email || '');
    const [contactPhone, setContactPhone] = useState(user?.phone || '');
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

    // Saved addresses
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [addressesLoading, setAddressesLoading] = useState(false);

    // New address form fields
    const [newAddress, setNewAddress] = useState({
        address_line1: '', address_line2: '', city: '', state: '', pincode: '', phone: '',
    });

    // Buy Now
    const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);

    // Coupon UI
    const [couponInput, setCouponInput] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);


    useEffect(() => {
        if (isBuyNow) {
            try {
                const stored = sessionStorage.getItem('ksp_buy_now_item');
                if (stored) setBuyNowItem(JSON.parse(stored));
                else router.replace('/checkout');
            } catch {
                router.replace('/checkout');
            }
        }
    }, [isBuyNow, router]);

    // Compute prices
    const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : items;
    const itemsCount = isBuyNow && buyNowItem ? buyNowItem.quantity : totalItems;
    
    const baseSubtotal = isBuyNow && buyNowItem
        ? buyNowItem.unit_price * buyNowItem.quantity
        : items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

    const totalTaxes = isBuyNow ? 0 : items.reduce((sum, item) => sum + ((item as any).pricing?.tax_amount ?? 0), 0);
    const subtotalWithTaxes = isBuyNow && buyNowItem ? buyNowItem.unit_price * buyNowItem.quantity : totalPrice;
    const shippingCost = couponType === 'free_shipping' ? 0 : (subtotalWithTaxes > 50 ? 0 : 15);
    const discount = isBuyNow ? 0 : couponDiscount;
    const grandTotal = subtotalWithTaxes + shippingCost - discount;

    // Load addresses
    useEffect(() => {
        if (user?.id) {
            setAddressesLoading(true);
            getAddresses(user.id)
                .then(res => {
                    if (res.success && Array.isArray(res.data)) {
                        setSavedAddresses(res.data);
                        const defaultAddr = res.data.find((a: Address) => a.is_default) || res.data[0];
                        if (defaultAddr) setSelectedAddressId(defaultAddr.address_id);
                        else setUseNewAddress(true);
                    } else setUseNewAddress(true);
                })
                .catch(() => setUseNewAddress(true))
                .finally(() => setAddressesLoading(false));
            
            if (user.email) setContactEmail(user.email);
            if (user.phone) setContactPhone(user.phone);
        } else {
            setUseNewAddress(true);
        }
    }, [user]);

    useEffect(() => {
        if (!isBuyNow && items.length === 0 && !orderPlaced) {
            router.push('/cart');
        }
    }, [items.length, orderPlaced, router, isBuyNow]);

    if (!isBuyNow && items.length === 0 && !orderPlaced) return null;

    if (isBuyNow && !buyNowItem && !orderPlaced) {
        return (
            <div className="cart-leaf-bg min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#6B8F5E]" />
            </div>
        );
    }

    /* ─── Razorpay Checkout Handler ──────────────────────────── */

    const openRazorpayCheckout = async (platformOrderId: string) => {
        setPaymentProcessing(true);

        try {
            const payRes = await createPaymentOrder(platformOrderId);
            if (!payRes.success) throw new Error(payRes.message || 'Failed to create payment order');

            const { razorpay_order_id, razorpay_key_id, amount, currency } = payRes.data;

            const options = {
                key: razorpay_key_id,
                amount,
                currency,
                name: 'Vedashi Holistic Wellness',
                description: `Order #${platformOrderId.slice(0, 8)}`,
                order_id: razorpay_order_id,
                prefill: {
                    name: user?.name || '',
                    email: user?.email || contactEmail,
                    contact: contactPhone,
                },
                theme: { color: '#6B8F5E', backdrop_color: 'rgba(0,0,0,0.6)' },
                modal: {
                    ondismiss: () => {
                        setPaymentProcessing(false);
                        setPaymentFailed(true);
                        setStep(2); // Go back to payment step
                        setFailedOrderId(platformOrderId);
                        toast.error('Payment was not completed. You can retry anytime.');
                    },
                },
                handler: async (response: any) => {
                    try {
                        const verifyRes = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: platformOrderId,
                        });

                        if (verifyRes.success) {
                            setOrderId(platformOrderId);
                            if (!isBuyNow) { await clearCart(true); removeCoupon(); }
                            sessionStorage.removeItem('ksp_buy_now_item');
                            setOrderPlaced(true);
                            setPaymentFailed(false);
                            setFailedOrderId(null);
                        } else {
                            setPaymentFailed(true);
                            setStep(2);
                            setFailedOrderId(platformOrderId);
                            toast.error(verifyRes.message || 'Payment verification failed');
                        }
                    } catch {
                        setPaymentFailed(true);
                        setStep(2);
                        setFailedOrderId(platformOrderId);
                        toast.error('Payment verification failed. Please contact support.');
                    }
                    setPaymentProcessing(false);
                },
            };

            if (typeof window.Razorpay === 'undefined') {
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
                setPaymentProcessing(false);
                setPaymentFailed(true);
                setStep(2);
                setFailedOrderId(platformOrderId);
                toast.error(response.error?.description || 'Payment failed. Please try again.');
            });
            rzp.open();
        } catch (error: any) {
            setPaymentProcessing(false);
            setStep(2);
            toast.error(error.message || 'Failed to initiate payment');
        }
    };

    /* ─── Place Order Handler ────────────────────────────────── */

    const handlePlaceOrder = async () => {
        if (useNewAddress && (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode)) {
            setStep(1);
            toast.error('Please fill in all required address fields');
            return;
        } else if (!useNewAddress && !selectedAddressId) {
            setStep(1);
            toast.error('Please select a shipping address');
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
                    customer_email: user?.email || contactEmail || undefined,
                    items: [{ product_id: buyNowItem.product_id, variant_id: buyNowItem.variant_id, quantity: buyNowItem.quantity, unit_price: buyNowItem.unit_price }],
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
                result = await directCheckout({
                    customer_id: user?.id || undefined,
                    customer_name: user?.name || undefined,
                    customer_email: user?.email || contactEmail || undefined,
                    items: checkoutItems.map(item => ({ product_id: (item as any).product_id || '', variant_id: (item as any).variant_id, quantity: item.quantity, unit_price: Number((item as any).price || (item as any).unit_price) || 0 })),
                    shipping_address: useNewAddress ? newAddress as unknown as Record<string, string> : undefined,
                    payment_method: paymentMethod,
                    coupon_code: couponCode || undefined,
                    order_notes: orderNotes.trim() || undefined,
                });
            }

            if (result.success) {
                const createdOrderId = result.data?.order_id;
                if (paymentMethod === 'razorpay' && createdOrderId) {
                    setPlacing(false);
                    await openRazorpayCheckout(createdOrderId);
                } else {
                    setOrderId(createdOrderId || null);
                    if (!isBuyNow) { await clearCart(true); removeCoupon(); }
                    sessionStorage.removeItem('ksp_buy_now_item');
                    setOrderPlaced(true);
                }
            } else {
                toast.error(result.message || 'Failed to place order');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    /* ─── Move to Next Steps Handlers ────────────────────────── */

    const goToPayment = () => {
        if (useNewAddress && (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode)) {
            toast.error('Please fill in all required address fields');
            return;
        } else if (!useNewAddress && !selectedAddressId) {
            toast.error('Please select a shipping address');
            return;
        }
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToReview = () => {
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ─── Order Placed Confirmation UI ───────────────────────── */

    if (orderPlaced) {
        return (
            <div className="cart-leaf-bg min-h-screen">
                <div className="cart-noise-overlay" aria-hidden="true" />
                <div className="mx-auto max-w-7xl px-4 py-8 sm:py-16 relative z-10 flex items-center justify-center">
                    <div className="text-center max-w-lg p-10 bg-white rounded-2xl border border-[#E8E4DC] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#6B8F5E]" />
                        <CheckCircle className="mx-auto h-24 w-24 text-[#6B8F5E] mb-6" />
                        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Ritual Initialized</h1>
                        {orderId && (
                            <p className="mt-2 text-sm font-mono text-[#6B6B60]">Order ID: {orderId}</p>
                        )}
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DFE5D9] text-[#2D3B2D] text-sm font-bold tracking-wide uppercase">
                            <ShieldCheck className="h-4 w-4" />
                            {paymentMethod === 'razorpay' ? 'Payment Confirmed' : 'Cash on Delivery'}
                        </div>
                        <p className="mt-6 text-[#4A4A4A] leading-relaxed">
                            Your sacred herbs and authentic formulations are being prepared with care. We&apos;ll notify you regarding the delivery schedule.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/products" className="cart-checkout-btn !w-auto bg-[#E8E4DC] !text-[#1A1A1A] hover:bg-[#D4CFC0] order-2 sm:order-1">
                                Continue Exploring
                            </Link>
                            <Link href="/account" className="cart-checkout-btn !w-auto order-1 sm:order-2">
                                Track Your Journey
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Main Checkout UI ───────────────────────────────────── */

    const getSelectedAddressText = () => {
        if (useNewAddress) return `${newAddress.address_line1}, ${newAddress.city}, ${newAddress.state} ${newAddress.pincode}`;
        const addr = savedAddresses.find(a => a.address_id === selectedAddressId);
        return addr ? `${addr.address_line1}, ${addr.city}, ${addr.state} ${addr.pincode}` : '';
    };

    return (
        <div className="cart-leaf-bg min-h-screen">
            <div className="cart-noise-overlay" aria-hidden="true" />

            {/* Step Indicator */}
            <div className="border-b border-[#D4CFC0] bg-[#FFFFFF] sticky top-0 z-20 shadow-sm">
                <div className="mx-auto max-w-5xl">
                    <StepIndicator currentStep={step} />
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 relative z-10">
                <button onClick={() => { if (step > 1) setStep(step - 1); else router.push('/cart'); }} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B8F5E] hover:text-[#5A7A4E] mb-6 transition-colors uppercase tracking-wider">
                    <ArrowLeft className="h-4 w-4" /> {step > 1 ? 'Back to previous step' : 'Back to Bag'}
                </button>

                <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
                    {/* Left Column: Form Flow */}
                    <div className="flex flex-col gap-8">
                        {/* ── Step 1: Shipping ── */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">Shipping Sanctuary</h2>
                                 {/* Contact Details Form */}
                                <div className="cart-item-card p-6 border-l-4 border-l-[#2D3B2D]">
                                    <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                                        <div className="bg-[#DFE5D9] text-[#2D3B2D] rounded-full w-6 h-6 flex items-center justify-center text-xs">A</div>
                                        Contact Information
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">Email *</label>
                                            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-[#F5F4F0]" placeholder="Enter your email" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">Mobile Phone *</label>
                                            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-[#F5F4F0]" placeholder="Enter your mobile number" />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs text-[#8B7A3D]">We will send order updates and Ayurvedic guidelines to these contacts.</p>
                                </div>

                                {/* Delivery Details Form */}
                                <div className="cart-item-card p-6 border-l-4 border-l-[#6B8F5E]">
                                    <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                                        <div className="bg-[#DFE5D9] text-[#2D3B2D] rounded-full w-6 h-6 flex items-center justify-center text-xs">B</div>
                                        Delivery Address
                                    </h3>
                                    
                                    {addressesLoading ? (
                                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#6B8F5E]" /></div>
                                    ) : savedAddresses.length > 0 && (
                                        <div className="mb-6 space-y-3">
                                            {savedAddresses.map(addr => (
                                                <label key={addr.address_id} className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${selectedAddressId === addr.address_id && !useNewAddress ? 'border-[#6B8F5E] bg-[#DFE5D9] border-2 shadow-sm' : 'border-[#D4CFC0] bg-white hover:border-[#CEDBCE]'}`}>
                                                    <input type="radio" name="address" checked={selectedAddressId === addr.address_id && !useNewAddress} onChange={() => { setSelectedAddressId(addr.address_id); setUseNewAddress(false); }} className="mt-1 w-4 h-4 accent-[#6B8F5E]" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-[#1A1A1A]">{addr.label || 'Saved Address'}</span>
                                                            {addr.is_default && <span className="bg-[#1A1A1A] text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">Default</span>}
                                                        </div>
                                                        <p className="text-sm text-[#4A4A4A]">{addr.address_line1}</p>
                                                        {addr.address_line2 && <p className="text-sm text-[#4A4A4A]">{addr.address_line2}</p>}
                                                        <p className="text-sm text-[#4A4A4A]">{addr.city}, {addr.state} {addr.pincode}</p>
                                                    </div>
                                                </label>
                                            ))}
                                            <button onClick={() => setUseNewAddress(true)} className={`mt-2 flex items-center gap-2 text-sm font-semibold transition-colors ${useNewAddress ? 'text-[#6B8F5E]' : 'text-[#8B7A3D] hover:text-[#6B8F5E]'}`}>
                                                <MapPin className="h-4 w-4" /> Use a different address
                                            </button>
                                        </div>
                                    )}

                                    {useNewAddress && (
                                        <div className="bg-[#F5F4F0] rounded-xl p-4 border border-[#D4CFC0] grid gap-4 sm:grid-cols-2 mt-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">Address Line 1 *</label>
                                                <input type="text" value={newAddress.address_line1} onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-white" placeholder="Street address" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">Address Line 2</label>
                                                <input type="text" value={newAddress.address_line2} onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value })} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-white" placeholder="Apartment, suite, etc." />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">City *</label>
                                                <input type="text" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-white" placeholder="City" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">State *</label>
                                                <input type="text" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-white" placeholder="State" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">Pincode *</label>
                                                <input type="text" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-white" placeholder="Pincode" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-wider text-[#6B6B60] font-bold mb-1.5">Mobile Phone (optional)</label>
                                                <input type="tel" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full rounded-lg border border-[#D4CFC0] px-4 py-2.5 text-sm focus:border-[#6B8F5E] focus:outline-none bg-white" placeholder="Secondary Phone" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button onClick={goToPayment} className="cart-checkout-btn w-full sm:w-auto inline-flex px-8">
                                        Continue to Payment <ChevronRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Payment ── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">Payment Methodology</h2>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B8F5E]">
                                        <Lock className="w-3.5 h-3.5" /> SECURE CHECKOUT
                                    </div>
                                </div>

                                {/* Payment Failed Retry Banner */}
                                {paymentFailed && failedOrderId && (
                                    <div className="mb-6 flex items-start gap-4 rounded-xl bg-red-50 border border-red-200 p-5 shadow-sm">
                                        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-bold text-red-800">Transaction Incomplete</p>
                                            <p className="text-sm text-red-600 mt-1 mb-3">Your wellness journey is paused due to a payment drop-off. Please complete the transaction to secure your order.</p>
                                            <button onClick={() => openRazorpayCheckout(failedOrderId!)} disabled={paymentProcessing} className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2">
                                                {paymentProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                                Retry Transaction
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Methods */}
                                <div className="cart-item-card p-6 border-l-4 border-l-[#8B7A3D]">
                                    <p className="text-[#6B6B60] text-sm mb-5 font-medium">Select a payment option for your healing bundle:</p>
                                    
                                    <div className="space-y-4">
                                        <label className={`flex items-start sm:items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-[#6B8F5E] bg-[#DFE5D9]/50 shadow-sm' : 'border-[#D4CFC0] bg-white hover:border-[#CEDBCE]'}`}>
                                            <input type="radio" name="payment-method" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="w-5 h-5 accent-[#6B8F5E] mt-0.5 sm:mt-0" />
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CreditCard className={`h-5 w-5 ${paymentMethod === 'razorpay' ? 'text-[#6B8F5E]' : 'text-[#8B7A3D]'}`} />
                                                        <span className="font-bold text-[#1A1A1A]">Online Payment (Secure)</span>
                                                    </div>
                                                    <p className="text-xs text-[#6B6B60]">Credit/Debit, Netbanking, UPI, Wallets</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 opacity-80">
                                                    <div className="bg-white border border-[#D4CFC0] rounded px-2 py-1 text-[9px] font-bold text-blue-800">VISA</div>
                                                    <div className="bg-white border border-[#D4CFC0] rounded px-2 py-1 text-[9px] font-bold text-red-600">MasterCard</div>
                                                    <div className="bg-[#1A1A1A] text-white rounded px-2 py-1 text-[9px] font-bold">UPI</div>
                                                </div>
                                            </div>
                                        </label>

                                        {/* Cash on Delivery */}
                                        <label className={`flex items-start sm:items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#6B8F5E] bg-[#DFE5D9]/50 shadow-sm' : 'border-[#D4CFC0] bg-white hover:border-[#CEDBCE]'}`}>
                                            <input type="radio" name="payment-method" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-[#6B8F5E] mt-0.5 sm:mt-0" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Banknote className={`h-5 w-5 ${paymentMethod === 'cod' ? 'text-[#6B8F5E]' : 'text-[#8B7A3D]'}`} />
                                                    <span className="font-bold text-[#1A1A1A]">Cash on Delivery</span>
                                                </div>
                                                <p className="text-xs text-[#6B6B60]">Settle the amount upon receiving your package.</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Billing Address Toggle */}
                                    <div className="cart-item-card p-6 border-l-4 border-l-[#8B7A3D] mt-6">
                                        <h3 className="font-bold text-[#1A1A1A] mb-4 text-sm">Billing Address</h3>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${billingSameAsShipping ? 'bg-[#6B8F5E] border-[#6B8F5E]' : 'border-[#D4CFC0] group-hover:border-[#6B8F5E]'}`}>
                                                {billingSameAsShipping && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                                <input type="checkbox" className="hidden" checked={billingSameAsShipping} onChange={(e) => setBillingSameAsShipping(e.target.checked)} />
                                            </div>
                                            <span className="text-sm font-medium text-[#4A4A4A]">Same as shipping address</span>
                                        </label>

                                        {!billingSameAsShipping && (
                                            <div className="mt-4 p-4 bg-[#F5F4F0] rounded-xl text-center text-sm text-[#6B6B60] border border-[#D4CFC0] border-dashed">
                                                (Billing form would expand here. Utilizing mock state for UI reference.)
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-4">
                                    <button onClick={goToReview} className="cart-checkout-btn w-full sm:w-auto inline-flex px-8">
                                        Review Order <ChevronRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Review ── */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">Final Review</h2>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Shipping details */}
                                    <div className="cart-item-card p-5">
                                        <div className="flex justify-between items-start mb-3 border-b border-[#D4CFC0] pb-2">
                                            <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wide">Shipping To</h3>
                                            <button onClick={() => setStep(1)} className="text-[11px] font-bold text-[#8B7A3D] uppercase hover:underline">Edit</button>
                                        </div>
                                        <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                            <span className="font-bold text-[#1A1A1A]">{user?.name || 'Customer'}</span><br />
                                            {getSelectedAddressText()}<br />
                                            {contactPhone && <>{contactPhone}<br /></>}
                                            {contactEmail}
                                        </p>
                                    </div>
                                    
                                    {/* Payment details */}
                                    <div className="cart-item-card p-5">
                                        <div className="flex justify-between items-start mb-3 border-b border-[#D4CFC0] pb-2">
                                            <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wide">Payment Method</h3>
                                            <button onClick={() => setStep(2)} className="text-[11px] font-bold text-[#8B7A3D] uppercase hover:underline">Edit</button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {paymentMethod === 'razorpay' ? (
                                                <><CreditCard className="w-5 h-5 text-[#6B8F5E]" /> <span className="font-bold text-[#4A4A4A]">Online Payment</span></>
                                            ) : (
                                                <><Banknote className="w-5 h-5 text-[#6B8F5E]" /> <span className="font-bold text-[#4A4A4A]">Cash on Delivery</span></>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#6B6B60] mt-2">Billing address: {billingSameAsShipping ? 'Same as shipping' : 'Different'}</p>
                                    </div>
                                </div>

                                {/* Order Notes */}
                                <div className="cart-item-card p-5 border-l-4 border-l-[#2D3B2D]">
                                    <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Ayurvedic Practitioner Notes <span className="text-[#8B7A3D] font-normal text-xs">(optional)</span></label>
                                    <textarea
                                        value={orderNotes}
                                        onChange={e => setOrderNotes(e.target.value.slice(0, 200))}
                                        maxLength={200}
                                        rows={3}
                                        placeholder="Add any specific allergies, preferences, or delivery instructions here..."
                                        className="w-full rounded-lg border border-[#D4CFC0] bg-[#F5F4F0] px-4 py-3 text-sm focus:border-[#2D3B2D] focus:outline-none resize-none font-medium"
                                    />
                                    <p className="mt-1 text-[10px] text-[#6B6B60] text-right font-bold tracking-wider">{orderNotes.length}/200</p>
                                </div>
                                
                                <div className="mt-8">
                                    <button onClick={handlePlaceOrder} disabled={placing || paymentProcessing} className="cart-checkout-btn w-full text-center flex items-center justify-center gap-2 py-4 text-base">
                                        {placing || paymentProcessing ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing Ritual...</> : <><Lock className="w-4 h-4" /> Place Final Order — {formatVND(grandTotal)}</>}
                                    </button>
                                    <p className="text-center text-xs text-[#6B6B60] mt-4 max-w-lg mx-auto leading-relaxed">By placing your order, you agree to Vedashi's <span className="underline cursor-pointer hover:text-[#2D3B2D]">Terms of Service</span> and <span className="underline cursor-pointer hover:text-[#2D3B2D]">Privacy & Wellness Policy</span>.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Ritual Summary Sidebar (Appears on all steps) ─── */}
                    <div className="mt-8 lg:mt-0">
                        <div className="sticky top-28">
                            <div className="ritual-summary">
                                <div className="ritual-summary-title">
                                    <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center mr-2">
                                        <Leaf className="w-4 h-4 text-white" />
                                    </div>
                                    Ritual Investment
                                    <span className="ritual-summary-badge">{itemsCount} Item{itemsCount !== 1 ? 's' : ''}</span>
                                </div>
                                
                                <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mt-4">
                                    {checkoutItems.map(item => {
                                        const price = isBuyNow ? (item as BuyNowItem).unit_price : (item as any).price ?? 0;
                                        const lineTotal = price * item.quantity;
                                        return (
                                            <div key={item.product_id + (item.variant_id || '')} className="ritual-summary-item pb-3 border-b border-[rgba(255,255,255,0.1)] last:border-0 last:pb-0">
                                                <div className="ritual-summary-item-img">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-sm text-[#1A1A1A]">🌿</span>
                                                    )}
                                                </div>
                                                <div className="ritual-summary-item-name">
                                                    {item.product_name || 'Product'}
                                                    {(item as any).size_label && <p className="text-[#a4a9a4] text-xs">{(item as any).size_label}</p>}
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
                                        <span className="label">Item Subtotal</span>
                                        <span className="value">{formatVND(baseSubtotal)}</span>
                                    </div>
                                    {!isBuyNow && couponDiscount > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label text-[#86EFAC] flex items-center gap-1"><Ticket className="w-3 h-3" /> Promo: {couponCode}</span>
                                            <span className="value text-[#86EFAC]">- {formatVND(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="ritual-summary-row">
                                        <span className="label">Shipping</span>
                                        <span className="value">{shippingCost === 0 ? 'FREE' : formatVND(shippingCost)}</span>
                                    </div>
                                    {totalTaxes > 0 && (
                                        <div className="ritual-summary-row">
                                            <span className="label">Federal Tax</span>
                                            <span className="value">{formatVND(totalTaxes)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="ritual-summary-total">
                                    <div>
                                        <div className="ritual-summary-total-label">Total Amount</div>
                                        <div className="ritual-summary-total-value mt-1">{formatVND(grandTotal)}</div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)]">
                                        <Leaf className="h-5 w-5 text-white opacity-80" />
                                    </div>
                                </div>
                                
                                {/* Promo Code in Sidebar only if not buy_now */}
                                {!isBuyNow && step < 3 && !couponCode && (
                                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                                        <p className="text-xs text-[rgba(255,255,255,0.7)] mb-2 font-bold uppercase tracking-wide">Promo Code</p>
                                        <div className="flex gap-2">
                                            <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 rounded border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white font-mono uppercase" />
                                            <button onClick={async () => { if (!couponInput.trim()) return; setApplyingCoupon(true); const ok = await applyCoupon(couponInput.trim()); if (ok) { toast.success('Coupon applied!'); setCouponInput(''); } setApplyingCoupon(false); }} disabled={applyingCoupon || !couponInput.trim()} className="bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white px-3 py-1.5 rounded text-sm font-bold transition-colors disabled:opacity-50">Apply</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="cart-advisor-card">
                                <div className="icon-wrapper border border-[#D4CFC0]">
                                    <ShieldCheck className="w-5 h-5 text-[#2D3B2D]" />
                                </div>
                                <div className="text-content">
                                    <p className="title">Secure Checkout</p>
                                    <p className="subtitle">All transactions are encrypted and authentic.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="cart-leaf-bg min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6B8F5E]" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}

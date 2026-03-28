'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { BackendCartItem, BackendCart } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
    createCart as apiCreateCart,
    getCart as apiGetCart,
    addCartItem as apiAddCartItem,
    updateCartItem as apiUpdateCartItem,
    removeCartItem as apiRemoveCartItem,
    mergeGuestCart as apiMergeGuestCart,
    validateCoupon as apiValidateCoupon,
    getBestAutoApplyCoupon as apiGetBestAutoApplyCoupon,
    saveForLater as apiSaveForLater,
    moveToCartFromSaved as apiMoveToCart,
    getSavedItems as apiGetSavedItems,
} from '@/lib/api';

const GUEST_CART_KEY = 'ksp_guest_cart_id';

interface CartContextType {
    items: BackendCartItem[];
    savedItems: BackendCartItem[];
    cartId: string | null;
    loading: boolean;
    error: string | null;
    addItem: (productId: string, variantId: string | null, quantity?: number) => Promise<void>;
    removeItem: (cartItemId: string) => Promise<void>;
    updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
    clearCart: (localOnly?: boolean) => Promise<void>;
    saveForLater: (cartItemId: string) => Promise<void>;
    moveToCart: (cartItemId: string) => Promise<void>;
    totalItems: number;
    totalPrice: number;
    couponCode: string | null;
    couponDiscount: number;
    couponType: string | null;
    couponError: string | null;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
    orderNotes: string;
    setOrderNotes: (notes: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Flatten backend cart item → easy-to-consume shape with top-level product_id, product_name, price */
function flattenCartItem(item: BackendCartItem): BackendCartItem {
    return {
        ...item,
        product_id: item.product?.product_id || item.product_id || '',
        product_name: item.product?.product_name || item.product_name || 'Product',
        slug: item.product?.slug || item.slug || '',
        sku: item.variant?.variant_sku || item.product?.product_sku || item.sku || (item as any).product_sku || '',
        price: item.pricing?.effective_price ?? item.pricing?.unit_price ?? item.price ?? 0,
        original_price: item.pricing?.unit_price ?? item.price ?? 0,
        size_label: item.variant?.size_label || item.size_label || '',
        image_url: item.product?.thumbnail_url || item.image_url || '',
        stock_quantity: item.variant?.stock_quantity ?? (item as any).stock_quantity ?? 0,
    };
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<BackendCartItem[]>([]);
    const [savedItems, setSavedItems] = useState<BackendCartItem[]>([]);
    const [cartId, setCartId] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponType, setCouponType] = useState<string | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [autoApplyDisabled, setAutoApplyDisabled] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    const { onAuthChange, isAuthenticated, user } = useAuth();
    const initDone = useRef(false);

    const fetchSavedItems = useCallback(async (cId: string) => {
        try {
            const res = await apiGetSavedItems(cId);
            if (res.success && res.data) {
                setSavedItems((res.data || []).map(flattenCartItem));
            }
        } catch (err) {
            console.error('[CartContext] fetchSavedItems error:', err);
        }
    }, []);

    /** Fetch full cart state from backend */
    const fetchCart = useCallback(async (cId: string) => {
        try {
            const res = await apiGetCart({ cart_id: cId });
            if (res.success && res.data) {
                const cart = res.data as BackendCart;
                const flatItems = (cart.items || []).map(flattenCartItem);
                setItems(flatItems);
                setTotalItems(cart.summary?.item_count ?? cart.total_items ?? flatItems.reduce((s: number, i: BackendCartItem) => s + i.quantity, 0));
                setTotalPrice(cart.summary?.grand_total ?? cart.total_amount ?? flatItems.reduce((s: number, i: BackendCartItem) => s + (i.price || 0) * i.quantity, 0));
            }
            await fetchSavedItems(cId);
        } catch (err) {
            console.error('[CartContext] fetchCart error:', err);
        }
    }, [fetchSavedItems]);

    /** Initialize cart for a logged-in customer (optionally merging a guest cart first) */
    const initCart = useCallback(async (customerId: string) => {
        setLoading(true);
        setError(null);
        try {
            // Check if there's a guest cart to merge
            const guestCartId = typeof window !== 'undefined' ? localStorage.getItem(GUEST_CART_KEY) : null;
            if (guestCartId) {
                try {
                    await apiMergeGuestCart(guestCartId, customerId);
                } catch (mergeErr) {
                    console.warn('[CartContext] Guest cart merge failed (cart may have expired):', mergeErr);
                }
                localStorage.removeItem(GUEST_CART_KEY);
            }

            const getRes = await apiGetCart({ customer_id: customerId });
            if (getRes.success && getRes.data) {
                const cart = getRes.data as BackendCart;
                setCartId(cart.cart_id);
                const flatItems = (cart.items || []).map(flattenCartItem);
                setItems(flatItems);
                setTotalItems(cart.summary?.item_count ?? cart.total_items ?? flatItems.reduce((s: number, i: BackendCartItem) => s + i.quantity, 0));
                setTotalPrice(cart.summary?.grand_total ?? cart.total_amount ?? flatItems.reduce((s: number, i: BackendCartItem) => s + (i.price || 0) * i.quantity, 0));
                await fetchSavedItems(cart.cart_id);
            } else {
                const createRes = await apiCreateCart(customerId);
                if (createRes.success && createRes.data) {
                    setCartId(createRes.data.cart_id);
                    setItems([]);
                    setSavedItems([]);
                    setTotalItems(0);
                    setTotalPrice(0);
                }
            }
        } catch (err) {
            console.error('[CartContext] initCart error:', err);
            setError('Failed to load cart');
        } finally {
            setLoading(false);
        }
    }, []);

    /** Restore a guest cart from localStorage (if user is NOT authenticated) */
    const restoreGuestCart = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const savedCartId = localStorage.getItem(GUEST_CART_KEY);
        if (!savedCartId) return;

        setLoading(true);
        try {
            const res = await apiGetCart({ cart_id: savedCartId });
            if (res.success && res.data) {
                const cart = res.data as BackendCart;
                setCartId(cart.cart_id);
                const flatItems = (cart.items || []).map(flattenCartItem);
                setItems(flatItems);
                setTotalItems(cart.summary?.item_count ?? cart.total_items ?? flatItems.reduce((s: number, i: BackendCartItem) => s + i.quantity, 0));
                setTotalPrice(cart.summary?.grand_total ?? cart.total_amount ?? flatItems.reduce((s: number, i: BackendCartItem) => s + (i.price || 0) * i.quantity, 0));
                await fetchSavedItems(cart.cart_id);
            } else {
                // Guest cart expired or deleted — clean up
                localStorage.removeItem(GUEST_CART_KEY);
            }
        } catch (err) {
            console.error('[CartContext] restoreGuestCart error:', err);
            localStorage.removeItem(GUEST_CART_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Create a guest cart on-the-fly (called when a guest clicks "Add to Cart") */
    const ensureGuestCart = useCallback(async (): Promise<string | null> => {
        try {
            const createRes = await apiCreateCart(); // no customer_id → guest cart
            if (createRes.success && createRes.data) {
                const newCartId = createRes.data.cart_id;
                setCartId(newCartId);
                localStorage.setItem(GUEST_CART_KEY, newCartId);
                return newCartId;
            }
        } catch (err) {
            console.error('[CartContext] ensureGuestCart error:', err);
        }
        return null;
    }, []);

    const resetCart = useCallback(() => {
        setCartId(null);
        setItems([]);
        setSavedItems([]);
        setTotalItems(0);
        setTotalPrice(0);
        setError(null);
        setCouponCode(null);
        setCouponDiscount(0);
        setCouponType(null);
        setCouponError(null);
        setAutoApplyDisabled(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(GUEST_CART_KEY);
        }
        setOrderNotes('');
    }, []);

    const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
        setCouponError(null);
        try {
            // Compute cart_total from items directly to avoid stale totalPrice state
            const computedCartTotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
            const cartTotalToSend = computedCartTotal > 0 ? computedCartTotal : totalPrice;

            if (!cartTotalToSend || cartTotalToSend <= 0) {
                setCouponError('Please add items to your cart before applying a coupon');
                return false;
            }

            const res = await apiValidateCoupon(code, cartTotalToSend);
            if (res.success) {
                setCouponCode(res.data.coupon.code);
                setCouponType(res.data.coupon.discount_type || null);

                let computedDiscount = 0;

                if (res.data.coupon.discount_type === 'bogo') {
                    const buyQty = res.data.coupon.bogo_buy_qty || 1;
                    const getQty = res.data.coupon.bogo_get_qty || 1;

                    const flatPrices: number[] = [];
                    items.forEach(it => {
                        for (let i = 0; i < it.quantity; i++) {
                            // Effective price
                            flatPrices.push(it.price || 0);
                        }
                    });

                    flatPrices.sort((a, b) => a - b);
                    const bogoGroups = Math.floor(flatPrices.length / (buyQty + getQty));
                    const freeItemsCount = bogoGroups * getQty;

                    let bogoDiscount = 0;
                    for (let i = 0; i < freeItemsCount; i++) {
                        bogoDiscount += flatPrices[i];
                    }

                    if (res.data.coupon.max_discount_cap !== null) {
                        bogoDiscount = Math.min(bogoDiscount, parseFloat(res.data.coupon.max_discount_cap));
                    }
                    computedDiscount = bogoDiscount;
                } else {
                    computedDiscount = res.data.discount;
                }

                // Enforce minimum payable of ₹1 — cap discount so total never drops below ₹1
                const maxAllowedDiscount = Math.max(0, cartTotalToSend - 1);
                computedDiscount = Math.min(computedDiscount, maxAllowedDiscount);

                setCouponDiscount(computedDiscount);
                return true;
            } else {
                setCouponError(res.message || 'Invalid coupon');
                setCouponCode(null);
                setCouponDiscount(0);
                setCouponType(null);
                return false;
            }
        } catch {
            setCouponError('Failed to validate coupon');
            return false;
        }
    }, [totalPrice, items]);

    const removeCoupon = useCallback(() => {
        setCouponCode(null);
        setCouponDiscount(0);
        setCouponType(null);
        setCouponError(null);
        setAutoApplyDisabled(true); // Don't forcibly auto-apply again if user actively removed it
    }, []);

    // Subscribe to auth changes
    useEffect(() => {
        const unsub = onAuthChange((event, user) => {
            if (event === 'login' && user) {
                initCart(user.id);
            } else if (event === 'logout') {
                resetCart();
            }
        });
        return unsub;
    }, [onAuthChange, initCart, resetCart]);

    // On mount: if not authenticated, try to restore guest cart
    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        // If user is already authenticated, initCart is handled by onAuthChange listener
        // If not authenticated, try to restore a guest cart from localStorage
        if (!isAuthenticated) {
            restoreGuestCart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-apply effect
    useEffect(() => {
        if (couponCode || totalPrice <= 0 || autoApplyDisabled) return;

        let active = true;
        apiGetBestAutoApplyCoupon(totalPrice)
            .then(res => {
                if (active && res.success && res.data?.coupon?.code) {
                    // Temporarily skip setCouponError on this automatic background attempt
                    applyCoupon(res.data.coupon.code).catch(() => { });
                }
            })
            .catch(() => { });

        return () => { active = false; };
    }, [totalPrice, couponCode, autoApplyDisabled, applyCoupon]);


    // Re-validate applied coupon when cart changes
    useEffect(() => {
        if (couponCode && !loading) {
            applyCoupon(couponCode).catch(err => {
                console.warn('[CartContext] Coupon re-validation failed:', err);
            });
        }
        // We only want to re-run this when items or total price changes to keep discount accurate
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length, totalPrice]);

    const addItem = useCallback(async (productId: string, variantId: string | null, quantity = 1) => {
        let activeCartId = cartId;

        // If no cart exists, create one (guest cart if not authenticated)
        if (!activeCartId) {
            if (isAuthenticated && user) {
                // Shouldn't normally happen, but just in case
                const createRes = await apiCreateCart(user.id);
                if (createRes.success && createRes.data) {
                    activeCartId = createRes.data.cart_id;
                    setCartId(activeCartId);
                }
            } else {
                activeCartId = await ensureGuestCart();
            }
        }

        if (!activeCartId) {
            setError('Failed to create cart. Please try again.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (variantId) {
                await apiAddCartItem(activeCartId, variantId, quantity, true);
            } else {
                await apiAddCartItem(activeCartId, productId, quantity, false);
            }
            await fetchCart(activeCartId);
        } catch (err) {
            console.error('[CartContext] addItem error:', err);
            const msg = 'Failed to add item to cart';
            setError(msg);
            throw err; // Re-throw to inform caller (e.g. for toast handling)
        } finally {
            setLoading(false);
        }
    }, [cartId, fetchCart, isAuthenticated, user, ensureGuestCart]);

    const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            await apiRemoveCartItem(cartItemId);
            if (cartId) await fetchCart(cartId);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await apiUpdateCartItem(cartItemId, quantity);
            if (cartId) await fetchCart(cartId);
        } catch (err) {
            console.error('[CartContext] updateQuantity error:', err);
            setError('Failed to update quantity');
        } finally {
            setLoading(false);
        }
    }, [cartId, fetchCart]);

    const removeItem = useCallback(async (cartItemId: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiRemoveCartItem(cartItemId);
            if (cartId) await fetchCart(cartId);
        } catch (err) {
            console.error('[CartContext] removeItem error:', err);
            setError('Failed to remove item');
        } finally {
            setLoading(false);
        }
    }, [cartId, fetchCart]);

    const saveForLater = useCallback(async (cartItemId: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiSaveForLater(cartItemId);
            if (cartId) await fetchCart(cartId);
        } catch (err) {
            console.error('[CartContext] saveForLater error:', err);
            setError('Failed to save item for later');
        } finally {
            setLoading(false);
        }
    }, [cartId, fetchCart]);

    const moveToCart = useCallback(async (cartItemId: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiMoveToCart(cartItemId);
            if (cartId) await fetchCart(cartId);
        } catch (err) {
            console.error('[CartContext] moveToCart error:', err);
            setError('Failed to move item to cart');
        } finally {
            setLoading(false);
        }
    }, [cartId, fetchCart]);

    const clearCart = useCallback(async (localOnly = false) => {
        if (!cartId) return;
        setLoading(true);
        try {
            if (!localOnly) {
                for (const item of items) {
                    await apiRemoveCartItem(item.cart_item_id);
                }
            }
            setItems([]);
            setTotalItems(0);
            setTotalPrice(0);
        } catch (err) {
            console.error('[CartContext] clearCart error:', err);
        } finally {
            setLoading(false);
        }
    }, [cartId, items]);

    // Real-time stock polling & validation
    useEffect(() => {
        if (!cartId || items.length === 0) return;

        // Auto-check quantities against stock
        items.forEach(item => {
            const stock = item.stock_quantity ?? 0;
            if (stock > 0 && item.quantity > stock) {
                updateQuantity(item.cart_item_id, stock).catch(() => {});
                import('react-hot-toast').then(({ default: toast }) => {
                    toast(`Quantity of ${item.product_name} reduced to ${stock} due to limited stock.`, { icon: '⚠️' });
                });
            }
        });

        // Poll cart every 30 seconds
        const pollInterval = setInterval(() => {
            fetchCart(cartId).catch(() => {});
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [cartId, items, fetchCart, updateQuantity]);

    return (
        <CartContext.Provider value={{
            items, savedItems, cartId, loading, error,
            addItem, removeItem, updateQuantity, clearCart, saveForLater, moveToCart,
            totalItems, totalPrice,
            couponCode, couponDiscount, couponType, couponError,
            applyCoupon, removeCoupon,
            orderNotes, setOrderNotes,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
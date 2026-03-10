'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
    getWishlist as apiGetWishlist,
    addToWishlist as apiAddToWishlist,
    removeFromWishlist as apiRemoveFromWishlist,
} from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistContextType {
    items: Product[];
    loading: boolean;
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleItem: (product: Product) => void;
    totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { onAuthChange } = useAuth();

    /** Load wishlist from backend */
    const initWishlist = useCallback(async () => {
        setIsAuthenticated(true);
        setLoading(true);
        try {
            const res = await apiGetWishlist();
            if (res.success && res.data) {
                const wishlistItems = res.data.items || res.data || [];
                const products: Product[] = wishlistItems.map((wi: any) => {
                    if (wi.product) return wi.product;
                    return {
                        product_id: wi.product_id,
                        sku: wi.sku || '',
                        slug: wi.slug || '',
                        product_name: wi.product_name || 'Unknown Product',
                        price: wi.price,
                        brand: wi.brand,
                        images: wi.image_url ? [wi.image_url] : (wi.images || []),
                    } as Product;
                });
                setItems(products);
            }
        } catch (err) {
            console.error('[WishlistContext] initWishlist error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const resetWishlist = useCallback(() => {
        setItems([]);
        setIsAuthenticated(false);
    }, []);

    // Subscribe to auth changes
    useEffect(() => {
        const unsub = onAuthChange((event) => {
            if (event === 'login') {
                initWishlist();
            } else if (event === 'logout') {
                resetWishlist();
            }
        });
        return unsub;
    }, [onAuthChange, initWishlist, resetWishlist]);

    const addItem = useCallback((product: Product) => {
        if (!isAuthenticated) {
            toast.error('Please log in to add to wishlist');
            return;
        }
        setItems(prev => {
            if (prev.find(p => p.product_id === product.product_id)) return prev;
            return [...prev, product];
        });
        apiAddToWishlist(product.product_id).catch(err => {
            console.error('[WishlistContext] addItem error:', err);
            setItems(prev => prev.filter(p => p.product_id !== product.product_id));
        });
    }, [isAuthenticated]);

    const removeItem = useCallback((productId: string) => {
        if (!isAuthenticated) return;
        const removedItem = items.find(p => p.product_id === productId);
        setItems(prev => prev.filter(p => p.product_id !== productId));
        apiRemoveFromWishlist(productId).catch(err => {
            console.error('[WishlistContext] removeItem error:', err);
            if (removedItem) {
                setItems(prev => [...prev, removedItem]);
            }
        });
    }, [isAuthenticated, items]);

    const isInWishlist = useCallback((productId: string) => {
        return items.some(p => p.product_id === productId);
    }, [items]);

    const toggleItem = useCallback((product: Product) => {
        if (isInWishlist(product.product_id)) {
            removeItem(product.product_id);
        } else {
            addItem(product);
        }
    }, [isInWishlist, removeItem, addItem]);

    return (
        <WishlistContext.Provider value={{
            items, loading,
            addItem, removeItem, isInWishlist, toggleItem,
            totalItems: items.length,
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
}

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
                    const baseProduct = wi.product || wi;
                    return {
                        ...baseProduct,
                        product_id: baseProduct.product_id || wi.product_id,
                        sku: baseProduct.sku || wi.sku || '',
                        slug: baseProduct.slug || wi.slug || '',
                        product_name: baseProduct.product_name || wi.product_name || 'Unknown Product',
                        price: baseProduct.price || wi.price,
                        brand: baseProduct.brand || wi.brand,
                        images: baseProduct.image_url ? [baseProduct.image_url] : (baseProduct.images || wi.images || []),
                        // Force normalized 'stock_status' even if nested inside wi or baseProduct
                        stock_status: (baseProduct.stock_status || wi.stock_status || 'in_stock').toLowerCase(),
                        created_at: wi.added_at || wi.created_at || baseProduct.created_at,
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

        // Normalize product before adding to local state
        const normalizedProduct: Product = {
            ...product,
            stock_status: (product.stock_status || 'in_stock').toLowerCase(),
            images: product.images || (product.image_url ? [product.image_url] : []),
        };

        setItems(prev => {
            if (prev.find(p => p.product_id === normalizedProduct.product_id)) return prev;
            return [...prev, normalizedProduct];
        });
        toast.success('Added to wishlist');
        apiAddToWishlist(product.product_id).catch(err => {
            console.error('[WishlistContext] addItem error:', err);
            setItems(prev => prev.filter(p => p.product_id !== product.product_id));
        });
    }, [isAuthenticated]);

    const removeItem = useCallback((productId: string) => {
        if (!isAuthenticated) return;
        const removedItem = items.find(p => p.product_id === productId);
        setItems(prev => prev.filter(p => p.product_id !== productId));
        toast.success('Removed from wishlist');
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

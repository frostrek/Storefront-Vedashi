'use client';

import { useCallback } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 12;

/**
 * Hook to manage recently viewed product IDs in localStorage.
 * Stores up to MAX_ITEMS product IDs, most recent first.
 */
export function useRecentlyViewed() {
    /** Add a product ID to the front of the recently viewed list */
    const addProduct = useCallback((productId: string) => {
        if (!productId) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let ids: string[] = raw ? JSON.parse(raw) : [];

            // Remove duplicate if exists, then prepend
            ids = ids.filter((id) => id !== productId);
            ids.unshift(productId);

            // Cap at MAX_ITEMS
            if (ids.length > MAX_ITEMS) ids = ids.slice(0, MAX_ITEMS);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch {
            // localStorage not available — silently ignore
        }
    }, []);

    /** Get recently viewed product IDs, excluding a specific ID (usually the current product) */
    const getProductIds = useCallback((excludeId?: string): string[] => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const ids: string[] = raw ? JSON.parse(raw) : [];
            return excludeId ? ids.filter((id) => id !== excludeId) : ids;
        } catch {
            return [];
        }
    }, []);

    const removeProduct = useCallback((productId: string) => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let ids: string[] = raw ? JSON.parse(raw) : [];
            ids = ids.filter((id) => id !== productId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch {
            // ignore
        }
    }, []);

    return { addProduct, getProductIds, removeProduct };
}

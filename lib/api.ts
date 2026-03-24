/**
 * Storefront  API Client
 * Consumes existing backend at https://ecommerce-backend-h23p.onrender.com
 * Backend response format: { success: boolean, message: string, data: T }
 */

import { Product, FilteredProduct, FilterMeta, ProductWithDetails, ProductAsset, ApiResponse } from '@/types';
import { env } from '@/lib/env';

export let API_URL = env.NEXT_PUBLIC_API_URL;
if (typeof window !== 'undefined' && (API_URL.includes('localhost') || API_URL.includes('127.0.0.1'))) {
    const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    API_URL = `${window.location.protocol}//${hostname}:5000`;
}
const TOKEN_KEY = 'vedashi_token';

/** Read the JWT stored by AuthContext after login/register */
function getStorefrontToken(): string | null {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

let cachedCsrfToken: string | null = null;

/** Read the CSRF token from cache or cookie */
function getCsrfToken(): string | null {
    if (cachedCsrfToken) return cachedCsrfToken;
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

/** Ensure a CSRF token exists (lazy-loaded by authFetch) */
export async function initCsrf(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (cachedCsrfToken) return;
    try {
        const res = await fetch(`${API_URL}/api/csrf-token`, { credentials: 'include' });
        const json = await res.json();
        if (json.success && json.data?.csrfToken) {
            cachedCsrfToken = json.data.csrfToken;
        }
    } catch {
        // Non-critical
    }
}

/** fetch() wrapper that automatically ensures CSRF tokens and credentials: 'include' are sent */
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
    const isStateChanging = init?.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase());

    // Auto-fetch CSRF token if missing on a state-changing browser request
    if (isStateChanging && typeof window !== 'undefined' && !cachedCsrfToken) {
        await initCsrf();
    }

    const token = getStorefrontToken();
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    // Merge with any existing headers
    const existingHeaders = init?.headers as Record<string, string> | undefined;
    if (existingHeaders) Object.assign(headers, existingHeaders);

    return fetch(url, { ...init, headers, credentials: 'include' });
}

/* ─── Products ─── */

export async function getProducts(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    brand?: string;
    sort?: string;
    status?: string;
}): Promise<Product[]> {
    try {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.offset) searchParams.set('offset', String(params.offset));
        if (params?.category) searchParams.set('category', params.category);
        if (params?.brand) searchParams.set('brand', params.brand);
        if (params?.sort) searchParams.set('sort', params.sort);
        if (params?.status) searchParams.set('status', params.status);

        const url = `${API_URL}/api/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return [];
        const json: ApiResponse<any> = await res.json();
        // Backend may return data as { products: [...], meta } or as a direct array
        let products: any[] = [];
        if (Array.isArray(json.data)) products = json.data;
        else if (Array.isArray(json.data.products)) products = json.data.products;

        return products.map(p => ({
            ...p,
            images: p.thumbnail_url ? [p.thumbnail_url] : []
        }));
    } catch (error) {
        console.warn('[API] Failed to fetch products. Backend might be unreachable.');
        return [];
    }
}

export async function getRelatedProducts(productId: string, type: string = 'similar', limit: number = 4): Promise<Product[]> {
    try {
        const url = `${API_URL}/api/products/${productId}/related?type=${type}&limit=${limit}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return [];
        const json: ApiResponse<any> = await res.json();

        let products: any[] = [];
        if (json.success && Array.isArray(json.data)) {
            products = json.data;
        }

        return products.map(p => ({
            ...p,
            images: p.thumbnail_url ? [p.thumbnail_url] : []
        }));
    } catch (error) {
        console.warn(`[API] Failed to fetch related products for ${productId}`);
        return [];
    }
}

/* ─── Featured Products ─── */

export async function getFeaturedProducts(): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/api/products/featured`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return [];
        const json: ApiResponse<any> = await res.json();
        console.log('[getFeaturedProducts] response:', json);
        if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map((p: any) => ({
                ...p,
                images: p.thumbnail_url ? [p.thumbnail_url] : [],
                is_featured: true,
            }));
            return mapped;
        }
        return [];
    } catch (error) {
        console.warn('[API] Failed to fetch featured products.');
        return [];
    }
}

/* ─── Filtered Products (backend-powered) ─── */

/* ─── Seasonal Collections ─── */

export interface StorefrontCollection {
    collection_id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    icon?: string;
    color_gradient?: string;
    sort_order: number;
    start_date?: string;
    end_date?: string;
    product_count?: number;
    preview_products?: Array<{ product_id: string; product_name: string; thumbnail_url?: string }>;
}

export interface StorefrontCollectionDetail extends StorefrontCollection {
    products: Product[];
    total_products: number;
}

/** Fetch featured collections for the storefront homepage. */
export async function getFeaturedCollections(limit: number = 6): Promise<StorefrontCollection[]> {
    try {
        const res = await fetch(`${API_URL}/api/collections/featured?limit=${limit}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return [];
        const json: ApiResponse<any> = await res.json();
        return json.success && Array.isArray(json.data) ? json.data : [];
    } catch (error) {
        console.warn('[API] Failed to fetch featured collections.');
        return [];
    }
}

/** Fetch a single collection by slug with its products. */
export async function getCollectionBySlug(slug: string, limit: number = 20, offset: number = 0): Promise<StorefrontCollectionDetail | null> {
    try {
        const res = await fetch(`${API_URL}/api/collections/${slug}?limit=${limit}&offset=${offset}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return null;
        const json: ApiResponse<any> = await res.json();
        if (json.success && json.data) {
            return {
                ...json.data,
                products: (json.data.products || []).map((p: any) => ({
                    ...p,
                    images: p.thumbnail_url ? [p.thumbnail_url] : [],
                })),
            };
        }
        return null;
    } catch (error) {
        console.warn(`[API] Failed to fetch collection: ${slug}`);
        return null;
    }
}

/* ─── Filtered Products (backend-powered) ─── */

export interface FilterParams {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    min_abv?: number;
    max_abv?: number;
    country?: string;      // comma-separated
    form?: string;         // comma-separated
    specialities?: string; // comma-separated
    min_rating?: number;
    availability?: string;  // 'in_stock' | 'out_of_stock' | 'all'
    category?: string;
    sub_category?: string;
    brand?: string;
    discount_min?: number;
    featured?: boolean;
    trending?: boolean;
    editor_pick?: boolean;
    on_sale?: boolean;
    inStock?: boolean;
    bestSeller?: boolean;
    newArrival?: boolean;
    attributes?: Record<string, string[]>;
}

export async function getFilteredProducts(
    params: FilterParams = {}
): Promise<{ data: FilteredProduct[]; meta: FilterMeta }> {
    try {
        const sp = new URLSearchParams();
        if (params.page) sp.set('page', String(params.page));
        if (params.limit) sp.set('limit', String(params.limit));
        if (params.sort) sp.set('sort', params.sort);
        if (params.search) sp.set('search', params.search);
        if (params.min_price != null) sp.set('min_price', String(params.min_price));
        if (params.max_price != null) sp.set('max_price', String(params.max_price));
        if (params.min_abv != null) sp.set('min_abv', String(params.min_abv));
        if (params.max_abv != null) sp.set('max_abv', String(params.max_abv));
        if (params.country) sp.set('country', params.country);
        if (params.form) sp.set('form', params.form);
        if (params.specialities) sp.set('specialities', params.specialities);
        if (params.min_rating != null) sp.set('min_rating', String(params.min_rating));
        if (params.availability) sp.set('availability', params.availability);
        if (params.category) sp.set('category', params.category);
        if (params.sub_category) sp.set('sub_category', params.sub_category);
        if (params.brand) sp.set('brand', params.brand);
        if (params.discount_min != null) sp.set('discount_min', String(params.discount_min));
        if (params.featured) sp.set('featured', 'true');
        if (params.trending) sp.set('trending', 'true');
        if (params.editor_pick) sp.set('editor_pick', 'true');
        if (params.on_sale) sp.set('on_sale', 'true');
        if (params.inStock) sp.set('inStock', 'true');
        if (params.bestSeller) sp.set('bestSeller', 'true');
        if (params.newArrival) sp.set('newArrival', 'true');

        if (params.attributes) {
            Object.entries(params.attributes).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    sp.set(`attr_${key}`, values.join(','));
                }
            });
        }

        const qs = sp.toString();
        const url = `${API_URL}/api/products/filter${qs ? '?' + qs : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();

        if (json.success) {
            const data = json.data ?? [];
            return {
                data: data.map((p: any) => ({
                    ...p,
                    images: p.thumbnail_url ? [p.thumbnail_url] : []
                })),
                meta: json.meta ?? { total_count: 0, page: 1, limit: 20, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'newest', cache_hit: false },
            };
        }
        return { data: [], meta: { total_count: 0, page: 1, limit: 20, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'newest', cache_hit: false } };
    } catch (error) {
        console.error('[API] Failed to fetch filtered products:', error);
        return { data: [], meta: { total_count: 0, page: 1, limit: 20, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'newest', cache_hit: false } };
    }
}

/* ─── Best Sellers (public endpoint) ─── */

export async function getBestSellers(params?: {
    period?: string;
    limit?: number;
    page?: number;
    category?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
}): Promise<{ data: FilteredProduct[]; meta: FilterMeta }> {
    try {
        const sp = new URLSearchParams();
        if (params?.period) sp.set('period', params.period);
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.page) sp.set('page', String(params.page));
        if (params?.category) sp.set('category', params.category);
        if (params?.country) sp.set('country', params.country);
        if (params?.minPrice != null) sp.set('minPrice', String(params.minPrice));
        if (params?.maxPrice != null) sp.set('maxPrice', String(params.maxPrice));

        const qs = sp.toString();
        const url = `${API_URL}/api/products/best-sellers${qs ? '?' + qs : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();

        if (json.success && json.data) {
            const products = json.data.products ?? json.data ?? [];
            const pagination = json.data.pagination ?? {};
            return {
                data: products.map((p: any) => ({
                    ...p,
                    images: p.thumbnail_url ? [p.thumbnail_url] : [],
                })),
                meta: {
                    total_count: pagination.total ?? products.length,
                    page: pagination.page ?? 1,
                    limit: pagination.limit ?? params?.limit ?? 12,
                    total_pages: pagination.totalPages ?? 1,
                    has_next_page: (pagination.page ?? 1) < (pagination.totalPages ?? 1),
                    has_prev_page: (pagination.page ?? 1) > 1,
                    filters_applied: {},
                    sort: 'best_sellers',
                    cache_hit: false,
                },
            };
        }
        return { data: [], meta: { total_count: 0, page: 1, limit: 12, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'best_sellers', cache_hit: false } };
    } catch (error) {
        console.error('[API] Failed to fetch best sellers:', error);
        return { data: [], meta: { total_count: 0, page: 1, limit: 12, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'best_sellers', cache_hit: false } };
    }
}

/* ─── New Arrivals (public endpoint) ─── */

export async function getNewArrivals(params?: {
    limit?: number;
    category?: string;
    brand?: string;
    region?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    in_stock?: boolean;
    sort?: string;
    cursor?: string;
}): Promise<{ data: FilteredProduct[]; meta: FilterMeta }> {
    try {
        const sp = new URLSearchParams();
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.category) sp.set('category', params.category);
        if (params?.brand) sp.set('brand', params.brand);
        if (params?.region) sp.set('region', params.region);
        if (params?.min_price != null) sp.set('min_price', String(params.min_price));
        if (params?.max_price != null) sp.set('max_price', String(params.max_price));
        if (params?.min_rating != null) sp.set('min_rating', String(params.min_rating));
        if (params?.in_stock) sp.set('in_stock', 'true');
        if (params?.sort) sp.set('sort', params.sort);
        if (params?.cursor) sp.set('cursor', params.cursor);

        const qs = sp.toString();
        const url = `${API_URL}/api/products/new-arrivals${qs ? '?' + qs : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();

        if (json.success && json.data) {
            const products = Array.isArray(json.data) ? json.data : [];
            const meta = json.meta ?? {};
            return {
                data: products.map((p: any) => ({
                    ...p,
                    images: p.thumbnail_url ? [p.thumbnail_url] : [],
                })),
                meta: {
                    total_count: meta.total_count ?? products.length,
                    page: 1,
                    limit: meta.returned_count ?? params?.limit ?? 12,
                    total_pages: meta.has_more ? 2 : 1,
                    has_next_page: meta.has_more ?? false,
                    has_prev_page: false,
                    filters_applied: {},
                    sort: 'new_arrivals',
                    cache_hit: false,
                },
            };
        }
        return { data: [], meta: { total_count: 0, page: 1, limit: 12, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'new_arrivals', cache_hit: false } };
    } catch (error) {
        console.error('[API] Failed to fetch new arrivals:', error);
        return { data: [], meta: { total_count: 0, page: 1, limit: 12, total_pages: 0, has_next_page: false, has_prev_page: false, filters_applied: {}, sort: 'new_arrivals', cache_hit: false } };
    }
}

/** Fetch all products once and extract unique brands & countries for filter options */
export async function getFilterOptions(): Promise<{ brands: string[]; countries: string[]; maxPrice: number; categories: any[]; attributes: any[] }> {
    try {
        const [{ data: products }, { data: maxPriceProd }, catRes, attrRes] = await Promise.all([
            getFilteredProducts({ limit: 500 }),
            getFilteredProducts({ limit: 1, sort: 'price_desc' }),
            fetch(`${API_URL}/api/categories?tree=true`, { credentials: 'include' }).then(res => res.json()).catch(() => ({ data: [] })),
            fetch(`${API_URL}/api/filter-attributes`, { credentials: 'include' }).then(res => res.json()).catch(() => ({ data: [] }))
        ]);

        const brandSet = new Set<string>();
        const countrySet = new Set<string>();
        products.forEach((p: FilteredProduct) => {
            if (p.brand) brandSet.add(p.brand);
            if (p.country_of_origin) countrySet.add(p.country_of_origin);
        });

        // Round up the max price nicely
        let rawMax = 500;
        if (maxPriceProd && maxPriceProd.length > 0 && maxPriceProd[0].price) {
            rawMax = maxPriceProd[0].price;
        }

        let roundedMax = Math.ceil(rawMax / 100) * 100;
        if (rawMax > 1000) roundedMax = Math.ceil(rawMax / 500) * 500;
        if (rawMax > 5000) roundedMax = Math.ceil(rawMax / 1000) * 1000;

        return {
            brands: Array.from(brandSet).sort(),
            countries: Array.from(countrySet).sort(),
            maxPrice: roundedMax,
            categories: catRes?.data || [],
            attributes: attrRes?.data || []
        };
    } catch (err) {
        console.error('[API] Failed to fetch filter options:', err);
        return { brands: [], countries: [], maxPrice: 500, categories: [], attributes: [] };
    }
}

export async function getProduct(id: string): Promise<Product | null> {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}`, { credentials: 'include' });
        const json: ApiResponse<any> = await res.json();
        if (json.success && json.data) {
            const p = json.data;
            return { ...p, images: p.thumbnail_url ? [p.thumbnail_url] : [] };
        }
        return null;
    } catch (error) {
        console.error('[API] Failed to fetch product:', error);
        return null;
    }
}

export async function getProductDetails(id: string): Promise<ProductWithDetails | null> {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}/details`, { credentials: 'include' });
        const json: ApiResponse<any> = await res.json();
        if (!json.success || !json.data) return null;

        const p = json.data;
        return {
            ...p,
            // Map thumbnail_url → images[] for backward compatibility with ProductCard
            images: p.thumbnail_url ? [p.thumbnail_url] : (p.images || []),
        };
    } catch (error) {
        console.error('[API] Failed to fetch product details:', error);
        return null;
    }
}

export async function searchProducts(query: string): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/api/products/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        const json: ApiResponse<any[]> = await res.json();
        if (json.success && json.data) {
            return json.data.map((p: any) => ({
                ...p,
                images: p.thumbnail_url ? [p.thumbnail_url] : []
            }));
        }
        return [];
    } catch (error) {
        console.error('[API] Failed to search products:', error);
        return [];
    }
}

/** Get or create a session ID for tracking */
function getTrackingSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sid = localStorage.getItem('ksp_tracking_session_id');
    if (!sid) {
        sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('ksp_tracking_session_id', sid);
    }
    return sid;
}

/** Track a product view for analytics */
export async function trackProductView(productId: string, source: string = 'direct') {
    try {
        // Fire and forget
        fetch(`${API_URL}/api/analytics/product-view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                product_id: productId,
                session_id: getTrackingSessionId(),
                source,
                device_type: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'mobile' : 'desktop') : 'desktop',
            }),
        }).catch(() => { /* ignore */ });
    } catch {
        /* ignore */
    }
}

export interface SearchSuggestion {
    product_id: string;
    product_name: string;
    slug: string;
    brand?: string;
    category?: string;
    thumbnail_url?: string;
    price?: number;
}

export async function getSearchSuggestions(q: string): Promise<SearchSuggestion[]> {
    if (!q || q.trim().length < 2) return [];
    try {
        const res = await fetch(`${API_URL}/api/products/suggestions?q=${encodeURIComponent(q.trim())}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success && json.data?.suggestions) {
            return json.data.suggestions;
        }
        return [];
    } catch {
        return [];
    }
}

export async function checkApiHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/products?limit=1`, { credentials: 'include' });
        return res.ok;
    } catch {
        return false;
    }
}

/* ─── Auth ─── */

export async function loginUser(email: string, password: string) {
    const res = await authFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    return res.json();
}

export async function registerUser(full_name: string, email: string, password: string) {
    const res = await authFetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name, email, password }),
    });
    return res.json();
}

export async function logoutUser() {
    try {
        await authFetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
        });
    } catch { /* silent */ }
}

export async function refreshAuthToken() {
    const res = await authFetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
    });
    return res.json();
}

export async function getMe() {
    const res = await authFetch(`${API_URL}/api/auth/me`);
    return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const res = await authFetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    return res.json();
}

export async function deactivateAccount(password: string) {
    const res = await authFetch(`${API_URL}/api/auth/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
    return res.json();
}

export async function reactivateAccount(email: string, password: string) {
    const res = await authFetch(`${API_URL}/api/auth/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
}

export async function forgotPassword(email: string) {
    const res = await authFetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return res.json();
}

export async function resetPassword(token: string, new_password: string) {
    const res = await authFetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password }),
    });
    return res.json();
}

export async function sendVerificationEmail(email?: string) {
    // If an email is provided, we send it in the body (unauthenticated flow).
    // Otherwise, we rely on the auth cookies (which `authFetch` handles under the hood if it was protected, 
    // but standard `fetch` with `credentials: 'include'` will do the same).
    const res = await authFetch(`${API_URL}/api/auth/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: email ? JSON.stringify({ email }) : undefined,
    });
    return res.json();
}

export async function verifyEmail(otp_code: string, email?: string) {
    const res = await authFetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otp_code, email }),
    });
    return res.json();
}

export async function sendOtp() {
    const res = await authFetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
    });
    return res.json();
}

export async function verifyOtp(otp_code: string) {
    const res = await authFetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code }),
    });
    return res.json();
}

/* ─── Newsletter ─── */

export async function subscribeNewsletter(email: string) {
    const res = await authFetch(`${API_URL}/api/storefront/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return res.json();
}

/* ─── Cart ─── */

export async function createCart(customerId?: string) {
    try {
        const res = await authFetch(`${API_URL}/api/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: customerId }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] createCart failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function getCart(params: { cart_id?: string; customer_id?: string }) {
    try {
        const searchParams = new URLSearchParams();
        if (params.cart_id) searchParams.set('cart_id', params.cart_id);
        if (params.customer_id) searchParams.set('customer_id', params.customer_id);
        const res = await authFetch(`${API_URL}/api/cart?${searchParams.toString()}`);
        return res.json();
    } catch (error) {
        console.warn('[API] getCart failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function addCartItem(cartId: string, itemId: string, quantity: number, isVariant = true) {
    try {
        const body: Record<string, unknown> = { cart_id: cartId, quantity };
        if (isVariant) {
            body.variant_id = itemId;
        } else {
            body.product_id = itemId;
        }
        
        // Add session logic for analytics
        if (typeof window !== 'undefined') {
            const getTrackingSessionId = () => {
                let sid = localStorage.getItem('ksp_tracking_session_id');
                if (!sid) {
                    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                    localStorage.setItem('ksp_tracking_session_id', sid);
                }
                return sid;
            };
            body.session_id = getTrackingSessionId();
        }

        const res = await authFetch(`${API_URL}/api/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] addCartItem failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function updateCartItem(itemId: string, quantity: number) {
    try {
        const res = await authFetch(`${API_URL}/api/cart/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] updateCartItem failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function removeCartItem(itemId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/cart/items/${itemId}`, {
            method: 'DELETE',
        });
        return res.json();
    } catch (error) {
        console.warn('[API] removeCartItem failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function saveForLater(itemId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/cart/items/${itemId}/save-for-later`, {
            method: 'PATCH',
        });
        return res.json();
    } catch (error) {
        console.warn('[API] saveForLater failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function moveToCartFromSaved(itemId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/cart/items/${itemId}/move-to-cart`, {
            method: 'PATCH',
        });
        return res.json();
    } catch (error) {
        console.warn('[API] moveToCartFromSaved failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function getSavedItems(cartId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/cart/${cartId}/saved`);
        return res.json();
    } catch (error) {
        console.warn('[API] getSavedItems failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function mergeGuestCart(guestCartId: string, customerId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/cart/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guest_cart_id: guestCartId, customer_id: customerId }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] mergeGuestCart failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/** 
 * Clear all items from a cart.
 * Note: Backend currently doesn't have a single "clear" endpoint, 
 * so this is a placeholder or can be enhanced later.
 */
export async function clearCart(cartId: string) {
    try {
        // Placeholder until backend provides a DELETE /api/cart/:id/items endpoint
        return { success: true, message: 'Cart cleared locally' };
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
}

/* ─── Payments (Razorpay) ─── */

/** Create a Razorpay order for an existing platform order. */
export async function createPaymentOrder(orderId: string) {
    try {
        const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const res = await authFetch(`${API_URL}/api/payments/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify({ order_id: orderId }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] createPaymentOrder failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/** Verify Razorpay payment signature after checkout. */
export async function verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id?: string;
}) {
    try {
        const res = await authFetch(`${API_URL}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] verifyPayment failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/** 
 * Initiate a Razorpay checkout (Deferred Order Creation).
 * Prepares the checkout and creates a Razorpay order without creating a platform order yet.
 */
export async function initiatePaymentCheckout(data: {
    cart_id?: string;
    items?: Array<{ product_id: string; variant_id?: string | null; quantity: number; unit_price?: number }>;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address_id?: string;
    shipping_address?: Record<string, any>;
    billing_address_id?: string;
    billing_address?: Record<string, any>;
    coupon_code?: string;
    payment_method?: string;
    redeem_points?: number;
    final_total?: number;
    currency?: string;
    order_notes?: string;
}) {
    try {
        const res = await authFetch(`${API_URL}/api/payments/razorpay/initiate-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] initiatePaymentCheckout failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/** Get payment status for an order. */
export async function getPaymentStatus(orderId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/payments/order/${orderId}`);
        return res.json();
    } catch (error) {
        console.warn('[API] getPaymentStatus failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/* ─── Orders ─── */

/**
 * Direct checkout — creates an order from localStorage cart items.
 * Uses POST /api/orders/direct (does NOT require a backend cart).
 */
export async function directCheckout(data: {
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    items: Array<{ product_id: string; variant_id?: string | null; quantity: number; unit_price?: number }>;
    shipping_address_id?: string;
    shipping_address?: Record<string, string>;
    billing_address_id?: string;
    billing_address?: Record<string, string>;
    payment_method?: string;
    order_notes?: string;
    coupon_code?: string;
    redeem_points?: number;
}) {
    try {
        const res = await authFetch(`${API_URL}/api/orders/direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] directCheckout failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/**
 * Global Postal Code Lookup 
 * Strategy:
 * 1. Zippopotam (Primary - as requested)
 * 2. Indian Pincode API (Fallback for India)
 * 3. Nominatim (Global Fallback for maximum reliability)
 */
export const lookupPostalCode = async (pincode: string, countryCode?: string) => {
    if (!pincode || !countryCode) return { success: false };
    const cCode = countryCode.toUpperCase();

    try {
        // 1. Try Zippopotam (User Requested)
        const zipRes = await fetch(`https://api.zippopotam.us/${cCode.toLowerCase()}/${pincode}`);
        if (zipRes.ok) {
            const data = await zipRes.json();
            if (data.places && data.places.length > 0) {
                const place = data.places[0];
                return {
                    city: place['place name'],
                    state: place['state'],
                    country: data['country'],
                    success: true
                };
            }
        }

        // 2. Fallback specifically for India (IN)
        if (cCode === 'IN') {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            if (res.ok) {
                const json = await res.json();
                if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
                    const po = json[0].PostOffice[0];
                    return {
                        city: po.District || po.Name,
                        state: po.State,
                        country: 'India',
                        success: true
                    };
                }
            }
        }

        // 3. Nominatim Global Fallback (Robust, covers KR, AE, etc.)
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&countrycodes=${cCode.toLowerCase()}&format=json&addressdetails=1&accept-language=en`;
        const nRes = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'Vedashi-Storefront-App' }
        });
        if (nRes.ok) {
            const nJson = await nRes.json();
            if (nJson.length > 0) {
                const addr = nJson[0].address;
                return {
                    city: addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || '',
                    state: addr.state || addr.region || addr.province || '',
                    country: addr.country || '',
                    success: true
                };
            }
        }

        return { success: false, message: 'Postal code not found' };
    } catch (error) {
        console.error('Postal code lookup error:', error);
        return { success: false, message: 'Error fetching location data' };
    }
};

/** Cart-based checkout (requires backend cart_id + customer_id). */
export async function checkoutOrder(data: {
    cart_id: string;
    customer_id: string;
    shipping_address_id?: string;
    shipping_address?: Record<string, string>;
    billing_address_id?: string;
    billing_address?: Record<string, string>;
    coupon_code?: string;
    order_notes?: string;
    payment_method?: string;
    redeem_points?: number;
}) {
    try {
        const res = await authFetch(`${API_URL}/api/orders/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] checkoutOrder failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/* ─── Coupons ─── */

/** Validate a coupon code against a cart total. */
export async function validateCoupon(code: string, cart_total: number) {
    try {
        const res = await authFetch(`${API_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, cart_total }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] validateCoupon failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/** Fetch the best auto-apply coupon based on cart total. */
export async function getBestAutoApplyCoupon(cart_total: number) {
    try {
        const res = await authFetch(`${API_URL}/api/coupons/best-auto-apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_total }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] getBestAutoApplyCoupon failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function getMyOrders(customerId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/orders/my`);
        return res.json();
    } catch (error) {
        console.warn('[API] getMyOrders failed:', error);
        return { success: false, data: [] };
    }
}

export async function getOrderById(orderId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/orders/${orderId}`);
        return res.json();
    } catch (error) {
        console.warn('[API] getOrderById failed:', error);
        return { success: false, data: null };
    }
}

export async function cancelOrder(orderId: string, reason: string = '') {
    try {
        const res = await authFetch(`${API_URL}/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] cancelOrder failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function downloadInvoice(orderId: string) {
    try {
        const url = `${API_URL}/api/invoices/${orderId}/download`;
        const res = await authFetch(url);
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            return { success: false, message: data?.message || 'Failed to download invoice' };
        }

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const nameMatch = disposition.match(/filename="?([^"]+)"?/);
        const filename = nameMatch ? nameMatch[1] : `invoice_${orderId}.pdf`;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        return { success: true };
    } catch (error) {
        console.warn('[API] downloadInvoice failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/**
 * Format an INR amount for display.
 * e.g. 1500 → "₹1,500"
 */
export function formatVND(amount: number | string | null | undefined): string {
    const n = Math.round(Number(amount) || 0);
    return '₹' + n.toLocaleString('en-IN');
}
export const formatPrice = formatVND; // alias

/* ─── Customers ─── */

export async function getCustomerProfile(id: string) {
    try {
        const res = await authFetch(`${API_URL}/api/customers/${id}`);
        return res.json();
    } catch (error) {
        console.warn('[API] getCustomerProfile failed:', error);
        return { success: false, data: null };
    }
}

export async function updateCustomerProfile(id: string, data: Record<string, unknown>) {
    const res = await authFetch(`${API_URL}/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function requestEmailChange(newEmail: string) {
    const res = await authFetch(`${API_URL}/api/customers/profile/email/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: newEmail }),
    });
    return res.json();
}

export async function verifyEmailChangeProfile(token: string) {
    const res = await authFetch(`${API_URL}/api/customers/profile/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    return res.json();
}

export async function requestPhoneChange(newPhone: string) {
    const res = await authFetch(`${API_URL}/api/customers/profile/phone/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_phone: newPhone }),
    });
    return res.json();
}

export async function verifyPhoneChangeProfile(token: string) {
    const res = await authFetch(`${API_URL}/api/customers/profile/phone/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    return res.json();
}

export async function verifyAge(customerId: string) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/verify-age`, {
        method: 'POST',
    });
    return res.json();
}

export async function uploadProfileImage(customerId: string, base64Image: string) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/profile-image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
    });
    return res.json();
}

export async function getProfileImage(customerId: string) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/profile-image`);
    return res.json();
}

export async function removeProfileImage(customerId: string) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/profile-image`, {
        method: 'DELETE',
    });
    return res.json();
}

export async function getAddresses(customerId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/customers/${customerId}/addresses`);
        return res.json();
    } catch (error) {
        console.warn('[API] getAddresses failed:', error);
        return { success: false, data: [] };
    }
}

/** Legacy alias for getAddresses */
export const getUserAddresses = getAddresses;

export async function addAddress(customerId: string, address: Record<string, string>) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
    });
    return res.json();
}

export async function updateAddress(customerId: string, addressId: string, data: Record<string, string>) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/addresses/${addressId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteAddress(customerId: string, addressId: string) {
    const res = await authFetch(`${API_URL}/api/customers/${customerId}/addresses/${addressId}`, {
        method: 'DELETE',
    });
    return res.json();
}

/* ─── Notification Preferences ─── */

export async function getNotificationPreferences() {
    try {
        const res = await authFetch(`${API_URL}/api/customers/notifications/preferences`);
        return res.json();
    } catch (error) {
        console.warn('[API] getNotificationPreferences failed:', error);
        return { success: false, data: { preferences: [] } };
    }
}

export async function toggleNotificationPreference(channel: string, category: string, is_enabled: boolean) {
    try {
        const res = await authFetch(`${API_URL}/api/customers/notifications/preferences/${channel}/${category}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_enabled }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] toggleNotificationPreference failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/* ─── Reviews ─── */

export async function getProductReviews(productId: string, params?: { limit?: number; offset?: number; sort?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.sort) searchParams.set('sort', params.sort);
    const qs = searchParams.toString();
    const res = await fetch(`${API_URL}/api/reviews/product/${productId}${qs ? '?' + qs : ''}`, { credentials: 'include' });
    return res.json();
}

export async function getRatingSummary(productId: string) {
    const res = await authFetch(`${API_URL}/api/reviews/product/${productId}/summary`);
    return res.json();
}

export async function submitReview(data: { product_id: string; rating: number; title?: string; body?: string; order_id?: string }) {
    const res = await authFetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}


export async function getMyReviews() {
    try {
        const res = await authFetch(`${API_URL}/api/reviews/my`);
        const json = await res.json();
        return json.success && json.data ? json.data : [];
    } catch { return []; }
}

export async function getMyReviewForProduct(productId: string) {
    const res = await authFetch(`${API_URL}/api/reviews/my/${productId}`);
    return res.json();
}

export async function deleteReview(reviewId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/reviews/${reviewId}`, {
            method: 'DELETE',
        });
        return await res.json();
    } catch { return { success: false }; }
}

export async function voteHelpful(reviewId: string, voteType: 'up' | 'down') {
    const res = await authFetch(`${API_URL}/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
    });
    return res.json();
}

export async function reportReview(reviewId: string, reason: string) {
    const res = await authFetch(`${API_URL}/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    return res.json();
}

/* ─── Wishlist ─── */

export async function getWishlist() {
    try {
        const res = await authFetch(`${API_URL}/api/wishlist`);
        return res.json();
    } catch (error) {
        console.warn('[API] getWishlist failed:', error);
        return { success: false, data: [] };
    }
}

export async function addToWishlist(productId: string, variantId?: string) {
    try {
        const res = await authFetch(`${API_URL}/api/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, variant_id: variantId }),
        });
        return res.json();
    } catch (error) {
        console.warn('[API] addToWishlist failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function removeFromWishlist(productId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/wishlist/${productId}`, {
            method: 'DELETE',
        });
        return res.json();
    } catch (error) {
        console.warn('[API] removeFromWishlist failed:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function checkInWishlist(productId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/wishlist/check/${productId}`);
        return res.json();
    } catch (error) {
        console.warn('[API] checkInWishlist failed:', error);
        return { success: false, data: { in_wishlist: false } };
    }
}

export async function clearWishlist() {
    try {
        const res = await authFetch(`${API_URL}/api/wishlist`, {
            method: 'DELETE',
        });
        return res.json();
    } catch (error) {
        console.warn('[API] clearWishlist failed:', error);
        return { success: false, message: 'Network error' };
    }
}

/* ─── Categories ─── */

export async function getCategories(tree?: boolean): Promise<any[]> {
    try {
        const qs = tree ? '?tree=true' : '';
        const res = await fetch(`${API_URL}/api/categories${qs}`, { credentials: 'include' });
        if (!res.ok) return [];
        const json: ApiResponse<any[]> = await res.json();
        return json.success && json.data ? json.data : [];
    } catch (error) {
        console.warn('[API] Failed to fetch categories. Backend might be unreachable.');
        return [];
    }
}

export async function getCategoryProducts(categoryId: string, params?: { limit?: number; offset?: number }) {
    try {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.offset) searchParams.set('offset', String(params.offset));
        const qs = searchParams.toString();
        const res = await fetch(`${API_URL}/api/categories/${categoryId}/products${qs ? '?' + qs : ''}`, { credentials: 'include' });
        if (!res.ok) return [];
        const json: ApiResponse<Product[]> = await res.json();
        return json.success && json.data ? json.data : [];
    } catch (error) {
        console.warn('[API] Failed to fetch category products. Backend might be unreachable.');
        return [];
    }
}

/* ─── Product Images ─── */

export async function getProductImages(productId: string, variantId?: string): Promise<ProductAsset[]> {
    try {
        const sp = new URLSearchParams();
        if (variantId) sp.set('variant_id', variantId);
        const qs = sp.toString();
        const url = `${API_URL}/api/products/${productId}/images${qs ? '?' + qs : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        const json: ApiResponse<ProductAsset[]> = await res.json();
        return json.success && json.data ? json.data : [];
    } catch (error) {
        console.warn('[API] Failed to fetch product images:', error);
        return [];
    }
}

/* ─── Search ─── */

export interface SearchSuggestion {
    product_id: string;
    product_name: string;
    brand?: string;
    category?: string;
    price?: number;
    thumbnail_url?: string;
}

export interface SearchParams {
    q: string;
    page?: number;
    limit?: number;
    sort?: string;
    min_price?: number;
    max_price?: number;
    min_abv?: number;
    max_abv?: number;
    country?: string;
    min_rating?: number;
    availability?: string;
    category?: string;
    sub_category?: string;
    brand?: string;
}

export async function searchAutocomplete(q: string, limit: number = 8): Promise<SearchSuggestion[]> {
    try {
        if (!q || q.trim().length < 2) return [];
        const res = await fetch(
            `${API_URL}/api/search/autocomplete?q=${encodeURIComponent(q.trim())}&limit=${limit}`,
            { credentials: 'include' }
        );
        if (!res.ok) return [];
        const json: ApiResponse<SearchSuggestion[]> = await res.json();
        return json.success && json.data ? json.data : [];
    } catch (error) {
        console.warn('[API] searchAutocomplete failed:', error);
        return [];
    }
}

export async function advancedSearch(
    params: SearchParams
): Promise<{ data: FilteredProduct[]; meta: FilterMeta }> {
    try {
        const sp = new URLSearchParams();
        sp.set('q', params.q);
        if (params.page) sp.set('page', String(params.page));
        if (params.limit) sp.set('limit', String(params.limit));
        if (params.sort) sp.set('sort', params.sort);
        if (params.min_price != null) sp.set('min_price', String(params.min_price));
        if (params.max_price != null) sp.set('max_price', String(params.max_price));
        if (params.min_abv != null) sp.set('min_abv', String(params.min_abv));
        if (params.max_abv != null) sp.set('max_abv', String(params.max_abv));
        if (params.country) sp.set('country', params.country);
        if (params.min_rating != null) sp.set('min_rating', String(params.min_rating));
        if (params.availability) sp.set('availability', params.availability);
        if (params.category) sp.set('category', params.category);
        if (params.sub_category) sp.set('sub_category', params.sub_category);
        if (params.brand) sp.set('brand', params.brand);

        const url = `${API_URL}/api/search?${sp.toString()}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();

        if (json.success) {
            const data = json.data ?? [];
            return {
                data: data.map((p: any) => ({
                    ...p,
                    images: p.thumbnail_url ? [p.thumbnail_url] : [],
                })),
                meta: json.meta ?? {
                    total_count: 0, page: 1, limit: 20, total_pages: 0,
                    has_next_page: false, has_prev_page: false,
                    filters_applied: {}, sort: 'relevance', cache_hit: false,
                },
            };
        }
        return {
            data: [],
            meta: {
                total_count: 0, page: 1, limit: 20, total_pages: 0,
                has_next_page: false, has_prev_page: false,
                filters_applied: {}, sort: 'relevance', cache_hit: false,
            },
        };
    } catch (error) {
        console.error('[API] advancedSearch failed:', error);
        return {
            data: [],
            meta: {
                total_count: 0, page: 1, limit: 20, total_pages: 0,
                has_next_page: false, has_prev_page: false,
                filters_applied: {}, sort: 'relevance', cache_hit: false,
            },
        };
    }
}


/* ─── Blog ─── */

export interface BlogPost {
    post_id: string;
    title: string;
    slug: string;
    excerpt?: string;
    body: string;
    status: 'draft' | 'published' | 'archived';
    blog_type?: string;
    cover_image?: string;
    reading_time?: number;
    word_count?: number;
    view_count?: number;
    comment_count?: number;
    share_count?: number;
    is_featured?: boolean;
    published_at?: string;
    created_at: string;
    author_name?: string;
    author_slug?: string;
    author_avatar?: string;
    author_bio?: string;
    category_name?: string;
    category_slug?: string;
    tags?: { tag_id: string; name: string; slug: string }[];
    meta_title?: string;
    meta_description?: string;
    share_urls?: Record<string, string>;
    featured_image?: string;
    display_order?: number;
    is_trending?: boolean;
    is_editor_pick?: boolean;
    content_type?: string;
    difficulty_level?: string;
    compliance_checked?: boolean;
}

export interface BlogCategory {
    category_id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    post_count?: number;
    children?: BlogCategory[];
}

export interface BlogTag {
    tag_id: string;
    name: string;
    slug: string;
    post_count?: number;
}

export interface BlogComment {
    comment_id: string;
    post_id: string;
    body: string;
    commenter_name: string;
    status: string;
    created_at: string;
    parent_id?: string;
    children?: BlogComment[];
}

export async function getBlogPosts(params?: { cursor?: string; limit?: number; blog_type?: string }): Promise<{ posts: BlogPost[]; nextCursor: string | null; hasMore: boolean }> {
    try {
        const sp = new URLSearchParams();
        if (params?.cursor) sp.set('cursor', params.cursor);
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.blog_type) sp.set('blog_type', params.blog_type);
        const res = await fetch(`${API_URL}/api/blog/posts?${sp.toString()}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data;
        return { posts: [], nextCursor: null, hasMore: false };
    } catch { return { posts: [], nextCursor: null, hasMore: false }; }
}

export async function getFeaturedBlogPosts(limit = 5): Promise<BlogPost[]> {
    try {
        const res = await fetch(`${API_URL}/api/blog/posts/featured?limit=${limit}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data || [];
        return [];
    } catch { return []; }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const res = await authFetch(`${API_URL}/api/blog/posts/slug/${slug}`);
        const json = await res.json();
        if (json.success) return json.data;
        return null;
    } catch { return null; }
}

export async function getBlogPostsByCategory(categorySlug: string, params?: { cursor?: string; limit?: number }) {
    try {
        const sp = new URLSearchParams();
        if (params?.cursor) sp.set('cursor', params.cursor);
        if (params?.limit) sp.set('limit', String(params.limit));
        const res = await fetch(`${API_URL}/api/blog/posts/category/${categorySlug}?${sp.toString()}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data;
        return { posts: [], nextCursor: null, hasMore: false };
    } catch { return { posts: [], nextCursor: null, hasMore: false }; }
}

export async function getBlogPostsByTag(tagSlug: string, params?: { cursor?: string; limit?: number }) {
    try {
        const sp = new URLSearchParams();
        if (params?.cursor) sp.set('cursor', params.cursor);
        if (params?.limit) sp.set('limit', String(params.limit));
        const res = await fetch(`${API_URL}/api/blog/posts/tag/${tagSlug}?${sp.toString()}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data;
        return { posts: [], nextCursor: null, hasMore: false };
    } catch { return { posts: [], nextCursor: null, hasMore: false }; }
}

export async function searchBlogPosts(search: string, params?: { cursor?: string; limit?: number }) {
    try {
        const sp = new URLSearchParams({ search });
        if (params?.cursor) sp.set('cursor', params.cursor);
        if (params?.limit) sp.set('limit', String(params.limit));
        const res = await fetch(`${API_URL}/api/blog/posts/search?${sp.toString()}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data;
        return { posts: [], nextCursor: null, hasMore: false };
    } catch { return { posts: [], nextCursor: null, hasMore: false }; }
}

export async function getRelatedBlogPosts(postId: string, limit = 4): Promise<BlogPost[]> {
    try {
        const res = await fetch(`${API_URL}/api/blog/posts/${postId}/related?limit=${limit}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data || [];
        return [];
    } catch { return []; }
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
    try {
        const res = await fetch(`${API_URL}/api/blog/categories`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data || [];
        return [];
    } catch { return []; }
}

export async function getBlogCategoryTree(): Promise<BlogCategory[]> {
    try {
        const res = await fetch(`${API_URL}/api/blog/categories/tree`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data || [];
        return [];
    } catch { return []; }
}

export async function getPopularBlogTags(limit = 15): Promise<BlogTag[]> {
    try {
        const res = await fetch(`${API_URL}/api/blog/tags/popular?limit=${limit}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) return json.data || [];
        return [];
    } catch { return []; }
}

export async function getBlogComments(postId: string): Promise<BlogComment[]> {
    try {
        const res = await authFetch(`${API_URL}/api/blog/posts/${postId}/comments`);
        const json = await res.json();
        if (json.success) return json.data?.comments || [];
        return [];
    } catch { return []; }
}

export async function postBlogComment(postId: string, data: { body: string; commenter_name?: string; commenter_email?: string; parent_id?: string }) {
    try {
        const res = await authFetch(`${API_URL}/api/blog/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    } catch { return { success: false, message: 'Network error' }; }
}

export async function recordBlogView(postId: string) {
    try { fetch(`${API_URL}/api/blog/analytics/views`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId }), credentials: 'include' }); } catch { /* fire-and-forget */ }
}

export async function recordBlogShare(postId: string, platform: string) {
    try { fetch(`${API_URL}/api/blog/analytics/shares`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId, platform }), credentials: 'include' }); } catch { /* fire-and-forget */ }
}

/* ─── Support & Help System ─── */

// FAQs
export async function getFaqs() {
    try {
        const res = await fetch(`${API_URL}/api/faqs`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : { faqs: [], grouped: {} };
    } catch { return { faqs: [], grouped: {} }; }
}

export async function searchFaqs(q: string) {
    try {
        const res = await fetch(`${API_URL}/api/faqs/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

// Help Center
export async function getHelpArticles() {
    try {
        const res = await fetch(`${API_URL}/api/help-center`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : { articles: [], grouped: {} };
    } catch { return { articles: [], grouped: {} }; }
}

export async function searchHelpArticles(q: string) {
    try {
        const res = await fetch(`${API_URL}/api/help-center/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

export async function getHelpArticle(slug: string) {
    try {
        const res = await fetch(`${API_URL}/api/help-center/${slug}`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : null;
    } catch { return null; }
}

// Knowledge Base
export async function getKBCategories() {
    try {
        const res = await fetch(`${API_URL}/api/knowledge-base/categories`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

export async function getKBArticles(category?: string) {
    try {
        const qs = category ? `?category=${encodeURIComponent(category)}` : '';
        const res = await fetch(`${API_URL}/api/knowledge-base${qs}`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

export async function getKBArticle(slug: string) {
    try {
        const res = await fetch(`${API_URL}/api/knowledge-base/article/${slug}`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : null;
    } catch { return null; }
}

export async function searchKBArticles(q: string) {
    try {
        const res = await authFetch(`${API_URL}/api/knowledge-base/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

// Support Tickets
export async function createSupportTicket(data: { subject: string; category: string; description: string; order_id?: string; priority?: string }) {
    const res = await authFetch(`${API_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function getMySupportTickets() {
    try {
        const res = await authFetch(`${API_URL}/api/support/my`);
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

export async function getSupportTicketDetail(ticketId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/support/my/${ticketId}`);
        const json = await res.json();
        return json.success ? json.data : null;
    } catch { return null; }
}

export async function replySupportTicket(ticketId: string, body: string) {
    const res = await authFetch(`${API_URL}/api/support/my/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
    });
    return res.json();
}

// Customer Enquiry
export async function submitFeedback(data: { name?: string; email?: string; type: string; subject?: string; message: string; rating?: number }) {
    try {
        const res = await authFetch(`${API_URL}/api/customer-enquiry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    } catch { return { success: false, message: 'Network error' }; }
}

export async function rateArticle(data: { article_type: 'help' | 'kb'; article_id: string; rating: number }) {
    try {
        const res = await authFetch(`${API_URL}/api/customer-enquiry/article-rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return (await res.json());
    } catch { return { success: false, message: 'Network error' }; }
}

export async function getMyEnquiries() {
    try {
        const res = await authFetch(`${API_URL}/api/customer-enquiry/my`);
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

export async function replyToEnquiry(id: string, message: string) {
    try {
        const res = await authFetch(`${API_URL}/api/customer-enquiry/my/${id}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: message }),
        });
        return (await res.json());
    } catch { return { success: false, message: 'Network error' }; }
}

// In-App Notifications
export async function getMyNotifications(limit = 50, offset = 0) {
    try {
        const res = await authFetch(`${API_URL}/api/notifications?limit=${limit}&offset=${offset}`);
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

export async function getUnreadNotificationCount() {
    try {
        const res = await authFetch(`${API_URL}/api/notifications/unread-count`);
        const json = await res.json();
        return json.success ? json.data.unread_count : 0;
    } catch { return 0; }
}

export async function markNotificationAsRead(id: string) {
    try {
        const res = await authFetch(`${API_URL}/api/notifications/${id}/read`, {
            method: 'PATCH'
        });
        return await res.json();
    } catch { return { success: false }; }
}

export async function markAllNotificationsAsRead() {
    try {
        const res = await authFetch(`${API_URL}/api/notifications/read-all`, {
            method: 'PATCH'
        });
        return await res.json();
    } catch { return { success: false }; }
}

export async function deleteNotification(id: string) {
    try {
        const res = await authFetch(`${API_URL}/api/notifications/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    } catch { return { success: false }; }
}

// ─── Loyalty & Rewards ───

export async function getLoyaltyWallet() {
    try {
        const res = await authFetch(`${API_URL}/api/loyalty/wallet`);
        const json = await res.json();
        return json.success ? json.data : null;
    } catch { return null; }
}

export async function getLoyaltyTransactions(limit = 20, offset = 0) {
    try {
        const res = await authFetch(`${API_URL}/api/loyalty/transactions?limit=${limit}&offset=${offset}`);
        const json = await res.json();
        if (json.success && json.data) {
            return Array.isArray(json.data.transactions) ? json.data.transactions : (Array.isArray(json.data) ? json.data : []);
        }
        return [];
    } catch { return []; }
}

export async function getLoyaltyTiers() {
    try {
        const res = await fetch(`${API_URL}/api/loyalty/tiers`, { credentials: 'include' });
        const json = await res.json();
        return json.success ? json.data : [];
    } catch { return []; }
}

/* ─── Legal Documents ─── */

export async function getLegalDocument(slug: string) {
    try {
        const res = await fetch(`${API_URL}/api/legal/public/${slug}`, { credentials: 'include' });
        if (!res.ok) return null;
        const json: ApiResponse<any> = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.warn(`[API] Failed to fetch legal document: ${slug}`);
        return null;
    }
}

export async function trackOrder(orderId: string) {
    try {
        const res = await authFetch(`${API_URL}/api/orders/${orderId}/track`);
        return await res.json();
    } catch (error) {
        console.warn('[API] trackOrder failed:', error);
        return { success: false, message: 'Network error' };
    }
}

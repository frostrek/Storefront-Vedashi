/**
 * Vedashi GA4 Analytics Utility Layer
 * ────────────────────────────────────
 * Centralised tracking API. All analytics calls go through this module —
 * NO direct `gtag()` usage in UI components.
 *
 * Consent is handled at the script-loading level (DynamicScriptLoader).
 * This module pushes structured events to `window.dataLayer` which GA4
 * picks up automatically once the gtag script is loaded and consent is granted.
 */

// ─── Types ──────────────────────────────────────────────────

export type EcommerceEventName =
  | 'view_item'
  | 'view_item_list'
  | 'select_item'
  | 'view_cart'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase'
  | 'refund';

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  index?: number;
  item_list_name?: string;
  item_category?: string;
  item_brand?: string;
  item_variant?: string;
  coupon?: string;
  affiliation?: string;
}

export interface EcommercePayload {
  currency: string;
  value: number;
  items: EcommerceItem[];
  transaction_id?: string;
  coupon?: string;
  affiliation?: string;
  shipping?: number;
  tax?: number;
  payment_type?: string;
  checkout_step?: number;
  shipping_tier?: string;
  page_load_time?: number;
  api_latency_avg?: number;
  performance_category?: 'fast' | 'moderate' | 'slow';
}

/** The GA4 Measurement ID sourced from environment variables. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Type-safe wrapper around `window.gtag`. */
function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

/**
 * Safely push a structured event into `window.dataLayer`.
 * Events accumulate here even before the GA4 script loads;
 * once loaded, gtag processes the backlog automatically.
 */
function pushToDataLayer(payload: Record<string, unknown> | string | unknown): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Track a virtual pageview (for SPA route changes).
 */
export function pageview(url: string): void {
  if (!GA_MEASUREMENT_ID && !GTM_ID) return;
  pushToDataLayer({ event: 'page_view', page_path: url });
}

/**
 * Track a generic custom event.
 */
export function trackEvent(
  event: string,
  payload: Record<string, unknown> = {},
): void {
  if (!GA_MEASUREMENT_ID && !GTM_ID) return;
  pushToDataLayer({ event, ...payload });
}

/**
 * Track a standard GA4 ecommerce event.
 * Clears previous ecommerce data before pushing to avoid
 * cross-contamination between events.
 */
export function trackEcommerce(
  event: EcommerceEventName,
  payload: EcommercePayload,
): void {
  if (!GA_MEASUREMENT_ID && !GTM_ID) return;

  // Clear the previous ecommerce object (GA4 recommendation)
  pushToDataLayer({ ecommerce: null });

  const ecommerceData: Record<string, unknown> = {
    currency: payload.currency || 'INR',
    value: Number(payload.value || 0),
    items: payload.items.map(item => ({
      ...item,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1)
    })),
  };

  if (payload.transaction_id) ecommerceData.transaction_id = payload.transaction_id;
  if (payload.coupon) ecommerceData.coupon = payload.coupon;
  if (payload.affiliation) ecommerceData.affiliation = payload.affiliation;
  if (payload.shipping !== undefined) ecommerceData.shipping = Number(payload.shipping || 0);
  if (payload.tax !== undefined) ecommerceData.tax = Number(payload.tax || 0);
  if (payload.payment_type) ecommerceData.payment_type = payload.payment_type;
  if (payload.checkout_step !== undefined) ecommerceData.checkout_step = Number(payload.checkout_step);
  if (payload.shipping_tier) ecommerceData.shipping_tier = payload.shipping_tier;
  if (payload.page_load_time !== undefined) ecommerceData.page_load_time = Number(payload.page_load_time);
  if (payload.api_latency_avg !== undefined) ecommerceData.api_latency_avg = Number(payload.api_latency_avg);
  if (payload.performance_category) ecommerceData.performance_category = payload.performance_category;

  pushToDataLayer({ event, ecommerce: ecommerceData });
}

// ─── Purchase Deduplication ─────────────────────────────────

const PURCHASE_PREFIX = 'vedashi_purchase_';

/**
 * Track a purchase event with built-in deduplication.
 * Returns `true` if the event was fired, `false` if it was a duplicate.
 */
export function trackPurchase(payload: EcommercePayload): boolean {
  if (!payload.transaction_id) {
    // Cannot deduplicate or track reliably without transaction_id
    console.warn('[GA4] Attempted to track purchase without transaction_id. Skipping.');
    return false;
  }

  const key = `${PURCHASE_PREFIX}${payload.transaction_id}`;

  if (typeof window !== 'undefined' && localStorage.getItem(key)) {
    // Duplicate — skip
    return false;
  }

  trackEcommerce('purchase', payload);

  if (typeof window !== 'undefined') {
    localStorage.setItem(key, 'true');
  }

  return true;
}

// ─── Refund Deduplication ───────────────────────────────────

const REFUND_PREFIX = 'vedashi_refund_';

/**
 * Track a refund event with built-in deduplication.
 * Returns `true` if the event was fired, `false` if it was a duplicate.
 */
export function trackRefund(payload: EcommercePayload): boolean {
  if (!payload.transaction_id) {
    console.warn('[GA4] Attempted to track refund without transaction_id. Skipping.');
    return false;
  }

  const key = `${REFUND_PREFIX}${payload.transaction_id}`;

  if (typeof window !== 'undefined' && localStorage.getItem(key)) {
    return false;
  }

  trackEcommerce('refund', payload);

  if (typeof window !== 'undefined') {
    localStorage.setItem(key, 'true');
  }

  return true;
}

// ─── Checkout Step Deduplication ────────────────────────────

const CHECKOUT_STEP_PREFIX = 'vedashi_checkout_step_';

/**
 * Track a checkout funnel step with sessionStorage deduplication.
 * Each step fires only once per checkout session.
 * Returns `true` if the event was fired, `false` if it was a duplicate.
 */
export function trackCheckoutStep(
  event: EcommerceEventName,
  stepNumber: number,
  payload: EcommercePayload,
): boolean {
  if (typeof window === 'undefined') return false;

  const key = `${CHECKOUT_STEP_PREFIX}${stepNumber}`;

  if (sessionStorage.getItem(key)) {
    return false;
  }

  trackEcommerce(event, {
    ...payload,
    checkout_step: stepNumber,
  });

  sessionStorage.setItem(key, 'true');
  return true;
}

/**
 * Clear all checkout step dedup keys from sessionStorage.
 * Call after a successful purchase or when leaving checkout.
 */
export function clearCheckoutStepKeys(): void {
  if (typeof window === 'undefined') return;
  for (let i = 1; i <= 4; i++) {
    sessionStorage.removeItem(`${CHECKOUT_STEP_PREFIX}${i}`);
  }
}

// ─── Consent Helpers ────────────────────────────────────────

/**
 * Set the default consent state. Called once on app init,
 * BEFORE the GA4 script loads.
 */
export function setDefaultConsent(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // Push via dataLayer so it's processed even before gtag.js loads
  window.dataLayer.push('consent', 'default', {
    analytics_storage: 'denied',
  });
}

/**
 * Update consent to granted. Called when the user accepts
 * analytics cookies.
 */
export function grantAnalyticsConsent(): void {
  gtag('consent', 'update', {
    analytics_storage: 'granted',
  });
}

/**
 * Revoke analytics consent.
 */
export function revokeAnalyticsConsent(): void {
  gtag('consent', 'update', {
    analytics_storage: 'denied',
  });
}

/**
 * Check if analytics consent is currently granted by reading the cookie.
 */
export function isConsentGranted(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(/(?:^|;\s*)gdpr_consent=([^;]+)/);
  if (match) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      return parsed.analytics === true;
    } catch {
      return false;
    }
  }
  return false;
}

// ─── User Identity ──────────────────────────────────────────

/**
 * Push user identity to the dataLayer.
 * Called on login, signup, social login, and session restoration.
 * The `user_id` must be a stable, non-PII identifier (e.g., customer_id UUID).
 */
export function setUserId(userId: string): void {
  if (!userId) return;
  pushToDataLayer({
    event: 'user_login',
    user_id: userId,
  });
}

/**
 * Clear user identity from the dataLayer on logout.
 */
export function clearUserId(): void {
  pushToDataLayer({
    event: 'user_logout',
    user_id: undefined,
  });
}

// ─── Advanced / Recommended Events ──────────────────────────

export function trackSearch(searchTerm: string): void {
  trackEvent('search', { search_term: searchTerm });
}

export function trackFilterApplied(filterType: string, filterValue: string): void {
  trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue });
}

export function trackProductClick(itemId: string, itemName: string): void {
  trackEvent('product_click', { item_id: itemId, item_name: itemName });
}

export function trackCouponApplied(couponCode: string): void {
  trackEvent('coupon_applied', { coupon: couponCode });
}

export function trackLogin(method: string, userId?: string): void {
  trackEvent('login', { method });
  if (userId) setUserId(userId);
}

export function trackSignup(method: string, userId?: string): void {
  trackEvent('sign_up', { method });
  if (userId) setUserId(userId);
}

export function trackFirstPurchase(transactionId: string, value: number): void {
  trackEvent('first_purchase', { transaction_id: transactionId, value });
}

// ─── Performance Tracking ───────────────────────────────────

export function trackPerformance(metric: string, valueMs: number): void {
  trackEvent('performance', { metric_name: metric, value: Math.round(valueMs) });
}

/**
 * Yandex.Metrika Utility Module
 * 
 * Provides a safe wrapper around the Yandex.Metrika counter API.
 * The counter ID is sourced from NEXT_PUBLIC_YANDEX_METRIKA_ID env var.
 * 
 * Usage:
 *   import { YANDEX_METRIKA_ID, ym } from '@/lib/analytics/yandex-metrika';
 *   ym('hit', '/some-page');
 *   ym('reachGoal', 'purchase');
 */

declare global {
    interface Window {
        ym?: (counterId: number, action: string, ...args: unknown[]) => void;
    }
}

/** Metrika counter ID from environment. Undefined = Metrika is not configured. */
export const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
    ? Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID)
    : undefined;

/**
 * Safe wrapper for the ym() global function.
 * Silently no-ops if Metrika is not loaded or the counter ID is missing.
 *
 * @param action  Metrika method: 'hit', 'reachGoal', 'params', 'userParams', etc.
 * @param args    Additional arguments passed to the Metrika method.
 *
 * @example
 *   ym('hit', '/katalog');
 *   ym('reachGoal', 'add_to_cart', { product_id: '123' });
 *   ym('params', { page_type: 'product' });
 */
export function ym(action: string, ...args: unknown[]): void {
    if (typeof window === 'undefined') return;
    if (!YANDEX_METRIKA_ID) return;
    if (typeof window.ym !== 'function') return;

    try {
        window.ym(YANDEX_METRIKA_ID, action, ...args);
    } catch (e) {
        // Silently swallow — analytics should never break the page
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Yandex.Metrika] Error calling ym():', e);
        }
    }
}

/**
 * Generate the Yandex.Metrika initialization snippet as a raw HTML string.
 * This is designed to be injected via dangerouslySetInnerHTML inside a <script> tag.
 *
 * Features enabled:
 * - clickmap: true     — Click heatmaps
 * - trackLinks: true   — External link tracking
 * - accurateTrackBounce: true — Accurate bounce rate (15-second threshold)
 * - webvisor: true     — Session replay recordings
 * - trackHash: true    — Track hash changes (useful for SPA)
 * - ecommerce: "dataLayer" — Link Metrika ecommerce events to GTM dataLayer
 *
 * NOTE on Webvisor privacy:
 * Webvisor records user sessions. Checkout/payment/address forms should
 * be excluded via Metrika's element-blocking settings in the Metrika dashboard,
 * NOT in this code. Add CSS class `ym-disable-keys` to sensitive form fields
 * and configure dataSanitization in the Metrika counter settings.
 */
export function getMetrikaInitScript(counterId: number): string {
    return `
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");

        ym(${counterId},"init",{
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true,
            trackHash:true,
            ecommerce:"dataLayer"
        });
    `;
}

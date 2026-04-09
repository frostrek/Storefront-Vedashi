'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/analytics/gtag';
import { captureAttribution } from '@/lib/analytics/attribution';
import { useEngagementScore } from '@/lib/analytics/engagement';

/**
 * RouteTracker — fires a GA4 pageview on every Next.js route change.
 * Also captures UTM parameters on the initial landing page.
 * Must be rendered inside a `<Suspense>` boundary because it reads
 * `useSearchParams()`.
 */
export default function RouteTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const attributionCaptured = useRef(false);

    // Capture UTM parameters on first load (before they're lost to navigation)
    useEffect(() => {
        if (attributionCaptured.current) return;
        attributionCaptured.current = true;
        captureAttribution();
    }, []);

    const getPageType = (path: string | null) => {
        if (!path || path === '/' || path.match(/^\/[a-zA-Z]{2}$/)) return 'home';
        if (path.includes('/products/')) return 'product';
        if (path.includes('/collections/') || path.includes('/shop') || path.includes('/search')) return 'category';
        if (path.includes('/checkout')) return 'checkout';
        if (path.includes('/cart')) return 'cart';
        return 'other';
    };
    const pageType = getPageType(pathname);

    // Initialise engagement tracking hooks (scroll, time, score)
    useEngagementScore(pageType);

    useEffect(() => {
        if (!pathname) return;

        const url = searchParams?.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

        pageview(url);
    }, [pathname, searchParams]);

    return null;
}


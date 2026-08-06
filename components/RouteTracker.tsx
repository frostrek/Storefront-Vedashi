'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/analytics/gtag';
import { captureAttribution } from '@/lib/analytics/attribution';
import { useEngagementScore } from '@/lib/analytics/engagement';
import { ym } from '@/lib/analytics/yandex-metrika';

/**
 * RouteTracker — fires a GA4 pageview AND a Yandex.Metrika hit on every
 * Next.js route change. Also captures UTM parameters on the initial landing.
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
        if (path.includes('/tovar/')) return 'product';
        if (path.includes('/poisk')) return 'category';
        if (path.includes('/oformlenie-zakaza')) return 'checkout';
        if (path.includes('/korzina')) return 'cart';
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

        // GA4 pageview
        pageview(url);

        // Yandex.Metrika SPA hit — ensures Metrika tracks every navigation,
        // not just the initial page load
        ym('hit', url);
    }, [pathname, searchParams]);

    return null;
}


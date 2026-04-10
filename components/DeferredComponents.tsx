'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// ─── Lazy-loaded components (not needed for first paint) ────────────
// These are deferred to reduce the initial JS bundle count.
const PromoBanner = dynamic(() => import('@/components/PromoBanner'), { ssr: false });
const CookieBanner = dynamic(() => import('@/components/CookieBanner'), { ssr: false });
const LanguageSuggestionBanner = dynamic(() => import('@/components/LanguageSuggestionBanner'), { ssr: false });
const ButterflyEffect = dynamic(() => import('@/components/animations/ButterflyEffect'), { ssr: false });
const RouteTracker = dynamic(() => import('@/components/RouteTracker'), { ssr: false });
const GlobalErrorTracker = dynamic(() => import('@/components/GlobalErrorTracker'), { ssr: false });

/**
 * DeferredComponents
 * 
 * Wraps non-critical UI components that don't need to be loaded on first paint.
 * By lazy-loading these, we reduce the initial JS bundle from ~21 files to ~14-15,
 * directly addressing the Seobility "too many JavaScript files" error.
 */
export default function DeferredComponents() {
  return (
    <>
      <PromoBanner />
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
      <GlobalErrorTracker />
      <ButterflyEffect />
      <CookieBanner />
      <LanguageSuggestionBanner />
    </>
  );
}

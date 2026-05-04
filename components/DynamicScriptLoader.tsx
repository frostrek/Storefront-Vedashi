'use client';

import { useEffect, useRef } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import Script from 'next/script';
import { GA_MEASUREMENT_ID, GTM_ID, grantAnalyticsConsent, revokeAnalyticsConsent } from '@/lib/analytics/gtag';
import { pushAttributionEvent } from '@/lib/analytics/attribution';
import PerformanceStore from '@/lib/analytics/performance';

declare global {
    interface Window {
        _pageLoadTracked?: boolean;
    }
}

export default function DynamicScriptLoader() {
    const { consent } = useCookieConsent();
    const prevAnalyticsConsent = useRef<boolean | null>(null);

    // React to consent changes — grant or revoke analytics
    useEffect(() => {
        if (!consent) return;

        const analyticsAllowed = consent.analytics === true;

        // Only fire an update when the value actually changes
        if (prevAnalyticsConsent.current !== analyticsAllowed) {
            if (analyticsAllowed) {
                grantAnalyticsConsent();
                // Push session attribution event (fires once per session)
                pushAttributionEvent();
            } else {
                revokeAnalyticsConsent();
            }
            prevAnalyticsConsent.current = analyticsAllowed;
        }
    }, [consent]);

    // Track page load time once analytics consent is given and page is fully ready
    useEffect(() => {
        if (!consent || !consent.analytics) return;

        const reportPageLoad = () => {
            const navEntries = window.performance.getEntriesByType('navigation');
            if (navEntries && navEntries.length > 0) {
                const pageNav = navEntries[0] as PerformanceNavigationTiming;
                if (pageNav.loadEventEnd > 0 && !window._pageLoadTracked) {
                    window._pageLoadTracked = true;
                    
                    const loadTime = Math.round(pageNav.loadEventEnd - pageNav.startTime);
                    PerformanceStore.setPageLoadTime(loadTime);
                    const category = PerformanceStore.getPerformanceCategory(loadTime, 'page_load');

                    const dataLayer = window.dataLayer;
                    if (dataLayer && Array.isArray(dataLayer)) {
                        dataLayer.push({
                            event: 'page_load_time',
                            load_time_ms: loadTime,
                            performance_category: category,
                            page_path: window.location.pathname
                        });
                    }
                }
            }
        };

        if (document.readyState === 'complete') {
            setTimeout(reportPageLoad, 100);
        } else {
            window.addEventListener('load', () => setTimeout(reportPageLoad, 100));
        }
    }, [consent]);

    if (!consent) return <></>;

    return (
        <>
            {/* ── GTM Container — loads AFTER analytics consent if configured ── */}
            {consent?.analytics && GTM_ID && (
                <Script id="google-tag-manager" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){window.dataLayer.push(arguments);}
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${GTM_ID}');

                        // Explicitly config GA4 property via GTM dataLayer
                        gtag('js', new Date());
                        gtag('config', '${GA_MEASUREMENT_ID}', {
                            send_page_view: false,
                            debug_mode: true
                        });
                    `}
                </Script>
            )}

            {/* ── GA4 Script Fallback — only loads if GTM is NOT configured ── */}
            {consent?.analytics && !GTM_ID && GA_MEASUREMENT_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){window.dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_MEASUREMENT_ID}', {
                                send_page_view: false,
                                debug_mode: true
                            });
                        `}
                    </Script>
                </>
            )}

            {/* ── Meta Pixel — only loads AFTER marketing consent ── */}
            {consent?.marketing && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                    `}
                </Script>
            )}
        </>
    );
}

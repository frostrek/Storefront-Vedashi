'use client';

import { useCookieConsent } from '@/context/CookieConsentContext';
import Script from 'next/script';

export default function DynamicScriptLoader() {
    const { consent } = useCookieConsent();

    if (!consent) return null;

    return (
        <>
            {/* Example Google Analytics Loader */}
            {consent.analytics && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){window.dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-XXXXXXXXXX', {
                                page_path: window.location.pathname,
                            });
                        `}
                    </Script>
                </>
            )}

            {/* Example Meta Pixel Loader */}
            {consent.marketing && (
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
                        // Intentionally left initialization out until consent
                        fbq('init', 'XXXXXXXXXXXXXXX');
                    `}
                </Script>
            )}
        </>
    );
}

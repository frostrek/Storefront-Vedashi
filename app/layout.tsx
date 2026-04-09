import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import PromoBanner from "@/components/PromoBanner";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import CookieBanner from "@/components/CookieBanner";
import LanguageSuggestionBanner from "@/components/LanguageSuggestionBanner";
import DynamicScriptLoader from "@/components/DynamicScriptLoader";
import RouteTracker from "@/components/RouteTracker";
import GlobalErrorTracker from "@/components/GlobalErrorTracker";
import MaintenancePage from "@/components/MaintenancePage";
import { generateLocalBusinessJsonLd, generateOrganizationJsonLd, generateWebSiteJsonLd } from "@/lib/seo";
import ButterflyEffect from "@/components/animations/ButterflyEffect";
import { API_URL } from "@/lib/api";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vedashi — Premium Ayurvedic Wellness",
    template: "%s | Vedashi",
  },
  description:
    "Experience the healing power of authentic Ayurvedic remedies crafted from nature. Discover clinically tested herbal formulations for holistic wellness.",
  keywords: ["ayurveda", "ayurvedic wellness", "herbal remedies", "Vedashi", "natural healing", "dosha", "panchakarma"],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? {
      "msvalidate.01": [process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION],
    } : undefined,
  },
  openGraph: {
    type: "website",
    siteName: "Vedashi",
    title: "Vedashi — Premium Ayurvedic Wellness",
    description: "Experience the healing power of authentic Ayurvedic remedies crafted from nature.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vedashi — Premium Ayurvedic Wellness",
    description: "Experience the healing power of authentic Ayurvedic remedies crafted from nature.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check global maintenance status with a tight timeout to prevent site hangs
  let isMaintenance = false;
  let maintenanceMessage = "";
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s ceiling for health check
  
  try {
    const res = await fetch(`${API_URL}/health`, { 
      signal: controller.signal,
      next: { revalidate: 10 } 
    });
    const data = await res.json();
    if (data?.maintenance?.enabled) {
      isMaintenance = true;
      maintenanceMessage = data.maintenance.message || "The Vedashi experience is currently undergoing routine maintenance.";
    }
  } catch (error) {
    // If the health check times out or fails, we assume the site is NOT in maintenance
    // This prioritizes speed and prevents the "TimeoutError" crash in dev
  } finally {
    clearTimeout(timeoutId);
  }

  if (isMaintenance) {
    return (
      <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
        <body className={`min-h-screen bg-[#1A1814] ${inter.className}`}>
          <MaintenancePage message={maintenanceMessage} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className={`min-h-screen flex flex-col ${inter.className}`} suppressHydrationWarning>
        {/* GA4 — Set default consent BEFORE any gtag scripts load */}
        <Script id="ga4-default-consent" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('consent', 'default', { analytics_storage: 'denied' });
          `}
        </Script>
        <Script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationJsonLd()) }}
        />
        <Script
          id="structured-data-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessJsonLd()) }}
        />
        <Script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteJsonLd()) }}
        />


        <ClerkProvider>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="lazyOnload"
          />
          <CookieConsentProvider>
            <DynamicScriptLoader />
            <Suspense fallback={null}>
              <RouteTracker />
            </Suspense>
            <GlobalErrorTracker />
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Toaster
                    position="bottom-right"
                    containerStyle={{ zIndex: 999999 }}
                    toastOptions={{
                      duration: 3500,
                      className: 'modern-toast',
                      style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        color: '#2D2926',
                        borderRadius: '14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        padding: '8px 16px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                      },
                      success: {
                        iconTheme: { primary: '#3d5c3a', secondary: '#fff' },
                      },
                      error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fff' },
                      }
                    }}
                  />
                  <PromoBanner />
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <ButterflyEffect />
                  <CookieBanner />
                  <LanguageSuggestionBanner />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </CookieConsentProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

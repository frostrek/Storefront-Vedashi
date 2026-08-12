import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FrostyWidget from "@/components/FrostyWidget";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import CookieBanner from "@/components/CookieBanner";
import { CurrencyProvider } from "@/context/CurrencyContext";
import GeoTracker from "@/components/analytics/GeoTracker";
import DynamicScriptLoader from "@/components/DynamicScriptLoader";
import RouteTracker from "@/components/RouteTracker";
import GlobalErrorTracker from "@/components/GlobalErrorTracker";
import MaintenancePage from "@/components/MaintenancePage";
import { generateLocalBusinessJsonLd, generateOrganizationJsonLd, generateWebSiteJsonLd } from "@/lib/seo";
import { API_URL } from "@/lib/api";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
  display: "swap",
  weight: ["600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ВЕДАШИ ХЕРБАЛС — Индийские продукты и премиум велнес",
    template: "%s | Vedashi Herbals",
  },
  description: "Откройте для себя коллекцию премиальных аюрведических продуктов, натуральной косметики, специй и травяных сборов из Индии для здоровья и красоты.",
  keywords: [
    "аюрведа", "натуральная косметика", "здоровье", "Vedashi Herbals", "травы",
    "аюрведические продукты", "купить аюрведу", "индийские специи", "сухофрукты",
    "натуральный уход", "травяные средства", "аюрведические травы", "ашваганда",
    "трифала", "масала чай", "гхи", "куркума", "интернет-магазин аюрведы",
    "натуральная косметика из Индии", "ведаши хербалс", "велнес", "суперпродукты",
    "чаванпраш", "органические продукты", "безопасная косметика", "без парабенов",
    "органическая косметика из Индии", "аюрведический уход за кожей", "масло амлы",
    "сандал", "терапевтическая косметика", "специи для иммунитета", "настоящие индийские специи"
  ],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? {
      "msvalidate.01": [process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION],
    } : undefined,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ru-RU': SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Vedashi Herbals",
    locale: "ru_RU",
    title: "ВЕДАШИ ХЕРБАЛС — Индийские продукты и премиум велнес",
    description: "Откройте для себя коллекцию премиальных аюрведических продуктов, натуральной косметики, специй и травяных сборов из Индии для здоровья и красоты.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vedashi Herbals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ООО ВЕДАШИ ХЕРБАЛС — Премиальная Аюрведа",
    description: "Откройте для себя коллекцию премиальных аюрведических продуктов.",
    images: ["/opengraph-image"],
  },
  other: {
    "vk:image": `${SITE_URL}/opengraph-image`,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isMaintenance = false;
  let maintenanceMessage = "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

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
  } finally {
    clearTimeout(timeoutId);
  }

  if (isMaintenance) {
    return (
      <html lang="ru" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
        <body className={`min-h-screen bg-[#1A1814] ${inter.className}`}>
          <MaintenancePage message={maintenanceMessage} />
        </body>
      </html>
    );
  }

  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        <link rel="alternate" type="application/rss+xml" title="Vedashi Herbals — RSS" href={`${SITE_URL}/rss.xml`} />
        <link rel="alternate" type="application/rss+xml" title="Vedashi Herbals — Turbo Pages" href={`${SITE_URL}/turbo-rss.xml`} />
        <link rel="author" href="/humans.txt" />

        <Script
          id="ga4-default-consent"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('consent', 'default', { analytics_storage: 'denied' });
            `
          }}
        />

        <script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationJsonLd()) }}
        />
        <script
          id="structured-data-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessJsonLd()) }}
        />
        <script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteJsonLd()) }}
        />
      </head>
      <body className={`min-h-screen flex flex-col ${inter.className}`} suppressHydrationWarning>
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="lazyOnload"
          />

          <CookieConsentProvider>
            <DynamicScriptLoader />
            <Suspense fallback={null}>
              <RouteTracker />
            </Suspense>
            <GlobalErrorTracker />
            <Suspense fallback={null}>
              <AuthProvider>
                <CurrencyProvider countryCode="ru">
                  <GeoTracker country="ru" />
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
                            iconTheme: { primary: '#91C934', secondary: '#fff' },
                          },
                          error: {
                            iconTheme: { primary: '#ef4444', secondary: '#fff' },
                          }
                        }}
                      />
                      <Navbar />
                      <main className="flex-1">{children}</main>
                      <Footer />
                      <CookieBanner />
                      <FrostyWidget />
                    </WishlistProvider>
                  </CartProvider>
                </CurrencyProvider>
              </AuthProvider>
            </Suspense>
          </CookieConsentProvider>
        </>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import PromoBanner from "@/components/PromoBanner";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import CookieBanner from "@/components/CookieBanner";
import DynamicScriptLoader from "@/components/DynamicScriptLoader";
import MaintenancePage from "@/components/MaintenancePage";
import { generateOrganizationJsonLd, generateWebSiteJsonLd } from "@/lib/seo";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
  // Check global maintenance status
  let isMaintenance = false;
  let maintenanceMessage = "";
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Revalidate every 10 seconds to keep the maintenance status fresh without hammering the backend
    const res = await fetch(`${apiUrl}/health`, { next: { revalidate: 10 } });
    const data = await res.json();
    if (data?.maintenance?.enabled) {
      isMaintenance = true;
      maintenanceMessage = data.maintenance.message || "The KSP Wines experience is currently undergoing routine maintenance.";
    }
  } catch (error) {
    // Ignore network errors here; the app will naturally fail on API calls if backend is down
  }

  if (isMaintenance) {
    return (
      <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
        <body className="min-h-screen bg-[#1A1814]">
          <MaintenancePage message={maintenanceMessage} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationJsonLd()) }}
        />
        <script
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
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                      style: {
                        background: '#2D2926',
                        color: '#FAF7F2',
                        borderRadius: '12px',
                        fontSize: '14px',
                      },
                      success: {
                        iconTheme: { primary: '#722F37', secondary: '#FAF7F2' },
                      },
                    }}
                  />
                  {/* AgeVerificationModal disabled for Ayurvedic wellness site */}
                  {/* <AgeVerificationModal /> */}
                  <Navbar />
                  <PromoBanner />
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <CookieBanner />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </CookieConsentProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

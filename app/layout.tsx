import type { Metadata } from "next";
import { Manrope, Outfit, Cormorant_Garamond } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-base",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    const res = await fetch(`${apiUrl}/health`, { next: { revalidate: 10 } });
    const data = await res.json();
    if (data?.maintenance?.enabled) {
      isMaintenance = true;
      maintenanceMessage = data.maintenance.message || "The Vedashi experience is currently undergoing routine maintenance.";
    }
  } catch (error) {
    // Ignore network errors here
  }

  if (isMaintenance) {
    return (
      <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
        <body className="min-h-screen bg-[#1A1814]">
          <MaintenancePage message={maintenanceMessage} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <Script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationJsonLd()) }}
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
                  <Navbar />
                  <PromoBanner />
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

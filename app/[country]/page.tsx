import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import HomeClientPage from './HomeClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    
    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        languages[locale] = `${SITE_URL}/${c}`;
    });
    languages['x-default'] = `${SITE_URL}/in`;

    return {
        title: { absolute: "Vedashi — Premium Wellness & Natural Products" },
        description: "Discover Vedashi's curated collection of premium wellness products, natural skincare, and herbal remedies. Clinically tested formulations for holistic health.",
        alternates: {
            canonical: `${SITE_URL}/${country}`,
            languages: languages
        },
        openGraph: {
            title: "Vedashi — Premium Ayurvedic Wellness",
            description: "Experience the healing power of authentic Ayurvedic remedies crafted from nature.",
            url: `${SITE_URL}/${country}`,
        }
    };
}

import { getBestSellers, getNewArrivals, getCategories, API_URL, getHeroSlides, getHeroSettings } from '@/lib/api';

export default async function HomePage() {
    let heroSlides = [];
    let heroSettings = null;

    try {
        const [bestRes, newRes, catRes, slidesRes, settingsRes] = await Promise.all([
            getBestSellers({ limit: 10 }),
            getNewArrivals({ limit: 10 }),
            getCategories(true),
            getHeroSlides(),
            getHeroSettings()
        ]);

        if (slidesRes.success && slidesRes.data?.length > 0) {
            heroSlides = slidesRes.data;
        }
        // No hardcoded fallback — if API didn't return slides, heroSlides stays [].
        // HeroCarousel will show a loading skeleton and fetch real slides client-side.

        if (settingsRes.success && settingsRes.data) {
            heroSettings = settingsRes.data;
        }

        return (
            <HomeClientPage 
                initialBestSellers={bestRes.data || []}
                initialNewArrivals={newRes.data || []}
                initialCategories={catRes || []}
                initialHeroSlides={heroSlides}
                initialHeroSettings={heroSettings}
            />
        );
    } catch (e) {
        console.error("Failed to fetch initial SSR data for homepage", e);
        // If everything fails, render Client Component without initial data, so it fetches on mount
        return <HomeClientPage />;
    }
}

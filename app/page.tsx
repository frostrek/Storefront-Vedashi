import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import HomeClientPage from './HomeClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: { absolute: "ООО ВЕДАШИ ХЕРБАЛС — Премиальная Аюрведа" },
        description: "Откройте для себя коллекцию премиальных аюрведических продуктов, натуральной косметики и травяных сборов.",
        alternates: {
            canonical: SITE_URL,
        },
        openGraph: {
            title: "ООО ВЕДАШИ ХЕРБАЛС — Премиальная Аюрведа",
            description: "Откройте для себя коллекцию премиальных аюрведических продуктов, натуральной косметики и травяных сборов.",
            url: SITE_URL,
        }
    };
}

import { getBestSellers, getNewArrivals, getCategories, API_URL, getHeroSlides, getHeroSettings, getHomepageReels } from '@/lib/api';

export default async function HomePage() {
    let heroSlides = [];
    let heroSettings = null;

    try {
        const [bestRes, newRes, catRes, slidesRes, settingsRes, reelsRes] = await Promise.all([
            getBestSellers({ limit: 10 }),
            getNewArrivals({ limit: 10 }),
            getCategories(true),
            getHeroSlides(),
            getHeroSettings(),
            getHomepageReels()
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
                initialReels={reelsRes || []}
            />
        );
    } catch (e) {
        console.error("Failed to fetch initial SSR data for homepage", e);
        // If everything fails, render Client Component without initial data, so it fetches on mount
        return <HomeClientPage />;
    }
}

import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import HomeClientPage from './HomeClient';
import { generateHomePageJsonLd, generateFAQPageJsonLd } from '@/lib/seo';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

import { RU_DICTIONARY } from '@/content/ru';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: { absolute: RU_DICTIONARY.globalSeo.home.meta.title },
        description: RU_DICTIONARY.globalSeo.home.meta.description,
        alternates: {
            canonical: SITE_URL,
            languages: {
                'ru-RU': SITE_URL,
            },
        },
        openGraph: {
            title: RU_DICTIONARY.globalSeo.home.meta.title,
            description: RU_DICTIONARY.globalSeo.home.meta.description,
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
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateHomePageJsonLd()) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageJsonLd(RU_DICTIONARY.globalSeo.home.seoSection.faqs)) }}
                />
                <HomeClientPage 
                initialBestSellers={bestRes.data || []}
                initialNewArrivals={newRes.data || []}
                initialCategories={catRes || []}
                initialHeroSlides={heroSlides}
                initialHeroSettings={heroSettings}
                initialReels={reelsRes || []}
            />
                {/* Server-rendered static content for SEO, AI crawlers & LLM readability */}
                <section className="sr-only" aria-label={RU_DICTIONARY.globalSeo.home.seoSection.companyTitle}>
                    <h2>{RU_DICTIONARY.globalSeo.home.seoSection.companyTitle}</h2>
                    <p>{RU_DICTIONARY.globalSeo.home.seoSection.p1}</p>
                    <p>{RU_DICTIONARY.globalSeo.home.seoSection.p2}</p>
                    <p>{RU_DICTIONARY.globalSeo.home.seoSection.p3}</p>

                    <h2>{RU_DICTIONARY.globalSeo.home.seoSection.faqTitle}</h2>

                    {RU_DICTIONARY.globalSeo.home.seoSection.faqs.map((faq: any, i: number) => (
                        <div key={i}>
                            <h3>{faq.question}</h3>
                            <p>{faq.answer}</p>
                        </div>
                    ))}
                </section>
            </>
        );
    } catch (e) {
        console.error("Failed to fetch initial SSR data for homepage", e);
        // If everything fails, render Client Component without initial data, so it fetches on mount
        return <HomeClientPage />;
    }
}

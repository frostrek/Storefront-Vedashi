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
        } else {
            // Fallback default slides
            heroSlides = [
                {
                    id: 'default-1',
                    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=2000',
                    headings: [{ id: 'h1', text: 'Radiant Skin,', color: '#FFFFFF', fontSize: '64' }, { id: 'h2', text: 'Naturally.', color: '#C9B87A', fontSize: '64' }],
                    subheadings: [{ id: 's1', text: 'Discover our premium Ayurvedic skincare collection.', color: '#FFFFFF', fontSize: '24' }],
                    buttons: [{ id: 'b1', label: 'Shop Skincare', url: '/products?category=Skin Care', bgColor: '#C9B87A', textColor: '#000000', size: 'lg' }],
                    overlay_opacity: 0.4
                },
                {
                    id: 'default-2',
                    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fc100a867?auto=format&fit=crop&q=80&w=2000',
                    headings: [{ id: 'h1', text: 'Holistic Wellness', color: '#FFFFFF', fontSize: '64' }],
                    subheadings: [{ id: 's1', text: 'Authentic remedies for mind, body and soul.', color: '#FFFFFF', fontSize: '24' }],
                    buttons: [{ id: 'b1', label: 'Explore Remedies', url: '/products', bgColor: '#3B5D3B', textColor: '#FFFFFF', size: 'lg' }],
                    overlay_opacity: 0.4
                }
            ];
        }

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

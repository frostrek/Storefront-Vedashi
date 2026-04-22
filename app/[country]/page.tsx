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
        title: { absolute: "Vedashi — Premium Ayurvedic Wellness & Natural Products" },
        description: "Experience the healing power of authentic Ayurvedic remedies crafted from nature. Discover clinically tested herbal formulations for holistic wellness.",
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

export default async function HomePage() {
    return <HomeClientPage />;
}

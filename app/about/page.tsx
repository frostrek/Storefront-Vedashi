import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import AboutClientPage from './AboutClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    
    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        languages[locale] = `${SITE_URL}/${c}/about`;
    });
    languages['x-default'] = `${SITE_URL}/in/about`;

    const isRu = country === 'ru';

    return {
        title: isRu ? RU_DICTIONARY.about.meta.title : "Our Story",
        description: isRu
            ? RU_DICTIONARY.about.meta.description
            : "Discover the roots of Vedashi. From the foothills of the Himalayas to the spice gardens of Kerala, we bring authentic Ayurvedic wellness to the world.",
        alternates: {
            canonical: `${SITE_URL}/${country}/about`,
            languages: languages
        },
        openGraph: {
            title: isRu ? RU_DICTIONARY.about.meta.ogTitle : "Our Story",
            description: isRu
                ? RU_DICTIONARY.about.meta.ogDescription
                : "Discover the roots of Vedashi. Authentic Ayurvedic wellness.",
            url: `${SITE_URL}/${country}/about`,
        }
    };
}

export default async function AboutPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;
    const isRu = country === 'ru';
    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: isRu ? RU_DICTIONARY.about.breadcrumbs.home : 'Home', url: `${SITE_URL}/${country}` },
        { name: isRu ? RU_DICTIONARY.about.breadcrumbs.ourStory : 'Our Story', url: `${SITE_URL}/${country}/about` }
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <AboutClientPage />
        </>
    );
}

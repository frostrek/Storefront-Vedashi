import { Metadata } from 'next';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import AboutClientPage from './AboutClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata(): Promise<Metadata> {
    const canonicalUrl = `${SITE_URL}/o-nas`;

    return {
        title: RU_DICTIONARY.about.meta.title,
        description: RU_DICTIONARY.about.meta.description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'ru-RU': canonicalUrl,
                'x-default': canonicalUrl
            }
        },
        openGraph: {
            title: RU_DICTIONARY.about.meta.ogTitle,
            description: RU_DICTIONARY.about.meta.ogDescription,
            url: canonicalUrl,
            locale: 'ru_RU',
        }
    };
}

export default async function AboutPage() {
    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: RU_DICTIONARY.about.breadcrumbs.home, url: SITE_URL },
        { name: RU_DICTIONARY.about.breadcrumbs.ourStory, url: `${SITE_URL}/o-nas` }
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


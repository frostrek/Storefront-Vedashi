import { Metadata } from 'next';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import ContactClientPage from './ContactClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata(): Promise<Metadata> {
    const canonicalUrl = `${SITE_URL}/kontakty`;

    return {
        title: RU_DICTIONARY.contact.meta.title,
        description: RU_DICTIONARY.contact.meta.description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'ru-RU': canonicalUrl,
                'x-default': canonicalUrl
            }
        },
        openGraph: {
            title: RU_DICTIONARY.contact.meta.title,
            description: RU_DICTIONARY.contact.meta.description,
            url: canonicalUrl,
            locale: 'ru_RU',
        }
    };
}

export default async function ContactPage() {
    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: RU_DICTIONARY.about.breadcrumbs.home, url: SITE_URL },
        { name: RU_DICTIONARY.contact.breadcrumbs.contactUs, url: `${SITE_URL}/kontakty` }
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <ContactClientPage />
        </>
    );
}


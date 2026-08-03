import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import ContactClientPage from './ContactClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    
    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        languages[locale] = `${SITE_URL}/${c}/contact`;
    });
    languages['x-default'] = `${SITE_URL}/in/contact`;

    return {
        title: "Contact Us",
        description: "Get in touch with Vedashi. Whether you have questions about our Ayurvedic products or need support, our team is here to help.",
        alternates: {
            canonical: `${SITE_URL}/${country}/contact`,
            languages: languages
        },
        openGraph: {
            title: "Contact Us",
            description: "Get in touch with Vedashi. Whether you have questions about our Ayurvedic products or need support, our team is here to help.",
            url: `${SITE_URL}/${country}/contact`,
        }
    };
}

export default async function ContactPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;
    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: 'Home', url: `${SITE_URL}/${country}` },
        { name: 'Contact Us', url: `${SITE_URL}/${country}/contact` }
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

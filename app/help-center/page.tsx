import { Metadata } from 'next';
import HelpCenterClient from './HelpCenterClient';
import { generateFAQPageJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { getFaqs } from '@/lib/api';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata(): Promise<Metadata> {
    const canonicalUrl = `${SITE_URL}/pomoshch`;

    return {
        title: RU_DICTIONARY.helpCenter.meta?.title,
        description: RU_DICTIONARY.helpCenter.meta?.description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: RU_DICTIONARY.helpCenter.meta?.title,
            description: RU_DICTIONARY.helpCenter.meta?.description,
            url: canonicalUrl,
            type: 'website',
        }
    };
}

export default async function HelpCenterPage() {
    let initialFaqs = [];
    
    try {
        const data = await getFaqs();
        initialFaqs = (data?.faqs || []).slice(0, 5);
    } catch (e) {
        console.error('Failed to fetch initial FAQs for Help Center', e);
    }

    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: RU_DICTIONARY.nav?.home, url: SITE_URL },
        { name: RU_DICTIONARY.nav?.helpCenter, url: `${SITE_URL}/pomoshch` }
    ]);

    const faqSchema = initialFaqs.length > 0 
        ? generateFAQPageJsonLd(initialFaqs.map((faq: any) => ({
            question: faq.question,
            answer: faq.answer
        })))
        : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}
            <HelpCenterClient initialFaqs={initialFaqs} />
        </>
    );
}

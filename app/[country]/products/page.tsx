import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import ProductsClientPage from './ProductsClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    
    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        languages[locale] = `${SITE_URL}/${c}/products`;
    });
    languages['x-default'] = `${SITE_URL}/in/products`;

    return {
        title: "All Products",
        description: "Shop our full collection of premium Ayurvedic wellness products, herbal supplements, natural beauty, and traditional Indian spices.",
        alternates: {
            canonical: `${SITE_URL}/${country}/products`,
            languages: languages
        },
        openGraph: {
            title: "Products",
            description: "Shop our full collection of premium Ayurvedic wellness products.",
            url: `${SITE_URL}/${country}/products`,
        }
    };
}

export default async function ProductsPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;
    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: 'Home', url: `${SITE_URL}/${country}` },
        { name: 'Products', url: `${SITE_URL}/${country}/products` }
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <ProductsClientPage />
        </>
    );
}

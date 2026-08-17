import { notFound } from 'next/navigation';
import { getProduct, getProductDetails, searchFaqs } from '@/lib/api';
import { generateProductJsonLd, generateBreadcrumbJsonLd, generateFAQPageJsonLd } from '@/lib/seo';
import ProductClientPage from './ProductClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

// Enable ISR/cache for product pages if needed, otherwise rely on Next.js default fetching behavior.
export const revalidate = 3600; // revalidate at most every hour

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let product = await getProductDetails(id);
    if (!product) {
        const simple = await getProduct(id);
        if (simple) product = simple;
    }

    if (!product) {
        notFound();
    }

    const productSchema = generateProductJsonLd({
        ...product,
        review_count: Number(product.review_count || 0)
    } as any);

    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: RU_DICTIONARY.nav.home, url: `${SITE_URL}` },
        { name: RU_DICTIONARY.nav.products, url: `${SITE_URL}/katalog` },
        { name: product.category || 'Category', url: `${SITE_URL}/katalog/${(product as any).category_slug || product.category || ''}` },
        { name: product.product_name, url: `${SITE_URL}/tovar/${product.slug || product.product_id}` },
    ]);

    // Fetch FAQs related to this product for rich snippets
    const faqsData = await searchFaqs(product.product_name);
    const faqSchema = faqsData && faqsData.length > 0 ? generateFAQPageJsonLd(faqsData) : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
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
            <ProductClientPage id={id} country="ru" initialProduct={product} />
        </>
    );
}

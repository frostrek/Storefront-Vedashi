import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProductDetails } from '@/lib/api';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import ProductClientPage from './ProductClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

// Enable ISR/cache for product pages if needed, otherwise rely on Next.js default fetching behavior.
export const revalidate = 3600; // revalidate at most every hour

export async function generateMetadata({ params }: { params: Promise<{ country: string, id: string }> }): Promise<Metadata> {
    const { country, id } = await params;

    let product = await getProductDetails(id);
    if (!product) {
        const simple = await getProduct(id);
        if (simple) product = simple;
    }

    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

    const categoryTitle = product.category ? `${product.category} | ` : '';
    const title = `${product.product_name} | Buy Authentic Ayurvedic ${categoryTitle}Vedashi`;
    const description = product.short_description || `Buy ${product.product_name} directly from India. Authentic Ayurvedic wellness and natural remedies.`;
    const productUrl = `${SITE_URL}/${country}/products/${product.slug || product.product_id}`;

    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        languages[locale] = `${SITE_URL}/${c}/products/${product.slug || product.product_id}`;
    });
    languages['x-default'] = `${SITE_URL}/in/products/${product.slug || product.product_id}`;

    // Get a default image string
    let ogImage: string | undefined = product.thumbnail_url;
    if (!ogImage && product.assets && product.assets.length > 0) {
        const asset = product.assets[0];
        ogImage = typeof asset === 'string' ? asset : (asset.cdn_url || asset.asset_url);
    }
    if (!ogImage && product.images && product.images.length > 0) {
        const img = product.images[0];
        ogImage = typeof img === 'string' ? img : (img as any).url;
    }

    return {
        title: product.product_name,
        description: description,
        alternates: {
            canonical: productUrl,
            languages: languages
        },
        openGraph: {
            title: product.product_name,
            description: description,
            url: productUrl,
            images: ogImage ? [ogImage] : [],
        }
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ country: string, id: string }> }) {
    const { country, id } = await params;

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
        { name: 'Home', url: `${SITE_URL}/${country}` },
        { name: 'Shop', url: `${SITE_URL}/${country}/products` },
        { name: product.category || 'Category', url: `${SITE_URL}/${country}/products?category=${encodeURIComponent((product.category || '').toLowerCase().replace(/\s+/g, '-'))}` },
        { name: product.product_name, url: `${SITE_URL}/${country}/products/${product.slug || product.product_id}` },
    ]);

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
            <ProductClientPage id={id} country={country} initialProduct={product} />
        </>
    );
}

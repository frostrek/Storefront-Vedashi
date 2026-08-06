import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProductDetails } from '@/lib/api';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import ProductClientPage from './ProductClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

// Enable ISR/cache for product pages if needed, otherwise rely on Next.js default fetching behavior.
export const revalidate = 3600; // revalidate at most every hour

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    let product = await getProductDetails(id);
    if (!product) {
        const simple = await getProduct(id);
        if (simple) product = simple;
    }

    if (!product) {
        return {
            title: "Товар не найден — Vedashi Herbals",
        };
    }

    const categoryTitle = product.category ? `${product.category} | ` : '';
    const title = `${product.product_name} | ${categoryTitle}Купить онлайн — Vedashi Herbals`;
    const description = product.short_description || `Купите ${product.product_name} в интернет-магазине Vedashi Herbals. Премиальные аюрведические продукты с доставкой по России.`;
    const productUrl = `${SITE_URL}/tovar/${product.slug || product.product_id}`;

    // Russia-only: single canonical, no multi-country hreflang
    const languages: Record<string, string> = {
        'ru-RU': productUrl,
        'x-default': productUrl
    };

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
            locale: 'ru_RU',
            images: ogImage ? [ogImage] : [],
        }
    };
}

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
            <ProductClientPage id={id} country="ru" initialProduct={product} />
        </>
    );
}

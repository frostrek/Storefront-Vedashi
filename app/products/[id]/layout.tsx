/**
 * Product Detail Page — Server layout
 * Provides dynamic SEO metadata via generateMetadata().
 * The actual PDP UI is the client-side page.tsx child.
 */

import type { Metadata } from 'next';
import { buildProductMeta, generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

/** Server-side fetch of product data for metadata (no auth needed) */
async function fetchProductForMeta(id: string) {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}`, {
            next: { revalidate: 300 }, // cache for 5 minutes
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? json.data : null;
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const product = await fetchProductForMeta(id);

    if (!product) {
        return {
            title: 'Product Not Found | Vedashi',
            description: 'The formulation you are looking for could not be found.',
        };
    }

    return buildProductMeta({
        product_id: product.product_id,
        product_name: product.product_name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        price: Number(product.price) || 0,
        original_price: Number(product.original_price) || undefined,
        is_on_sale: product.is_on_sale,
        stock_quantity: Number(product.stock_quantity) || 0,
        thumbnail_url: product.thumbnail_url,
        slug: product.slug,
        sku: product.sku,
        alcohol_percentage: product.alcohol_percentage,
        vintage_year: product.vintage_year,
        variants: product.variants,
        seo: product.seo,
    });
}

export default function ProductLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    // We render JSON-LD here on the server side
    // The actual product data fetch happens async via generateMetadata
    // For JSON-LD, we use a parallel server-side fetch
    return (
        <>
            <ProductJsonLd paramsPromise={params} />
            {children}
        </>
    );
}

/** Server component that injects JSON-LD structured data */
async function ProductJsonLd({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
    const { id } = await paramsPromise;
    const product = await fetchProductForMeta(id);

    if (!product) return null;

    const productJsonLd = generateProductJsonLd({
        product_id: product.product_id,
        product_name: product.product_name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        price: Number(product.price) || 0,
        stock_quantity: Number(product.stock_quantity) || 0,
        thumbnail_url: product.thumbnail_url,
        sku: product.sku,
        rating_average: product.rating_average,
        review_count: product.review_count,
        variants: product.variants,
    });

    const breadcrumbItems = [
        { name: 'Home', url: SITE_URL },
        { name: 'Shop', url: `${SITE_URL}/products` },
    ];
    if (product.category) {
        breadcrumbItems.push({ name: product.category, url: `${SITE_URL}/products?category=${encodeURIComponent(product.category)}` });
    }
    breadcrumbItems.push({ name: product.product_name, url: `${SITE_URL}/product/${product.slug || product.product_id}` });

    const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
        </>
    );
}

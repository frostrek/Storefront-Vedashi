/**
 * Product Detail Page — Server layout
 * Provides dynamic SEO metadata via generateMetadata().
 * The actual PDP UI is the client-side page.tsx child.
 */

import type { Metadata } from 'next';
import { buildProductMeta, generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { API_URL } from '@/lib/api';

// API_URL imported from @/lib/api
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

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

async function fetchSiteConfig(keys: string[]) {
    try {
        const res = await fetch(`${API_URL}/api/site-config/batch?keys=${keys.join(',')}`, {
            next: { revalidate: 3600 }, // cache for 1 hour
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
    params: Promise<any>;
}): Promise<Metadata> {
    const { id, country } = await params;
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
        variants: product.variants,
        seo: product.seo,
    }, country);
}

export default function ProductLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<any>;
}) {
    // We render JSON-LD here on the server si  de
    // The actual product data fetch hap  pens async via generateMetadata
    // For JSON-LD, we use a parallel server-side fetch
    return (
        <>
            <ProductJsonLd paramsPromise={params} />
            {children}
        </>
    );
}

/** Fetch the full category ancestor path for breadcrumbs (fail-silent) */
async function fetchCategoryBreadcrumb(categoryId: string): Promise<Array<{ category_id: string; name: string; slug: string }>> {
    try {
        const res = await fetch(`${API_URL}/api/categories/${categoryId}/breadcrumb`, {
            next: { revalidate: 3600 }, // cache for 1 hour — hierarchy changes rarely
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.success ? (json.data?.breadcrumb ?? []) : [];
    } catch {
        return [];
    }
}

/** Server component that injects JSON-LD structured data */
async function ProductJsonLd({ paramsPromise }: { paramsPromise: Promise<any> }) {
    const { id, country } = await paramsPromise;
    const currentCountry = country || 'in';
    const product = await fetchProductForMeta(id);

    if (!product) return null;

    const siteConfigs = await fetchSiteConfig(['merchant_shipping', 'merchant_returns']);

    const currencyMap: Record<string, string> = {
        in: 'INR',
        ru: 'RUB',
        kr: 'KRW',
        us: 'USD',
        gb: 'GBP',
        ae: 'AED',
    };
    const currency = currencyMap[currentCountry] || 'INR';

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
    }, siteConfigs?.merchant_shipping, siteConfigs?.merchant_returns, currency);

    // Build breadcrumb from full category hierarchy (closure table)
    const breadcrumbItems = [
        { name: 'Home', url: `${SITE_URL}/${currentCountry}` },
        { name: 'Shop', url: `${SITE_URL}/${currentCountry}/products` },
    ];

    // Fetch real ancestor path when category_id is available
    if (product.category_id) {
        const ancestors = await fetchCategoryBreadcrumb(product.category_id);
        for (const cat of ancestors) {
            breadcrumbItems.push({
                name: cat.name,
                url: `${SITE_URL}/${currentCountry}/products?category=${encodeURIComponent(cat.slug)}`,
            });
        }
    }

    breadcrumbItems.push({ 
        name: product.product_name, 
        url: `${SITE_URL}/${currentCountry}/products/${product.slug || product.product_id}` 
    });

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

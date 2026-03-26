/**
 * SEO Utility Library
 * Provides metadata builders, fallback templates, sanitization,
 * and JSON-LD structured data generators for the storefront.
 */

import type { Metadata } from 'next';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeoData {
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    canonical_url?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    twitter_title?: string | null;
    twitter_description?: string | null;
    twitter_image?: string | null;
    robots?: string | null;
}

export interface ProductSeoInput {
    product_id: string;
    product_name: string;
    brand?: string;
    category?: string;
    description?: string;
    price?: number;
    original_price?: number;
    is_on_sale?: boolean;
    stock_quantity?: number;
    thumbnail_url?: string;
    images?: string[];
    slug?: string;
    sku?: string;
    rating_average?: number;
    review_count?: number;
    variants?: Array<{
        variant_name?: string;
        size_label?: string;
        volume_ml?: number;
        price?: number;
        stock_quantity?: number;
        variant_sku?: string;
    }>;
    seo?: SeoData;
}

export interface CategorySeoInput {
    category_id: string;
    name: string;
    slug?: string;
    description?: string;
    image_url?: string;
    seo?: SeoData;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_NAME = 'Vedashi';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

// ─── Sanitization ─────────────────────────────────────────────────────────────

/** Strip HTML tags, normalize whitespace, trim to MAX characters */
export function sanitizeMetaText(text: string, maxLength = 160): string {
    return text
        .replace(/<[^>]*>/g, '')       // strip HTML
        .replace(/\s+/g, ' ')          // collapse whitespace
        .replace(/[|]+/g, '|')         // dedupe separators
        .trim()
        .slice(0, maxLength);
}

// ─── Fallback Templates ──────────────────────────────────────────────────────

function productFallbackTitle(p: ProductSeoInput): string {
    const parts = [p.product_name];
    if (p.brand) parts.push(p.brand);
    parts.push('Buy Online');
    return sanitizeMetaText(parts.join(' | '), 60);
}

function productFallbackDescription(p: ProductSeoInput): string {
    const parts = [`Buy ${p.product_name}`];
    if (p.brand) parts[0] += ` by ${p.brand}`;
    parts[0] += '.';
    if (p.category) parts.push(`Premium authentic ${p.category}.`);
    parts.push('Fast delivery and secure checkout.');
    return sanitizeMetaText(parts.join(' '), 160);
}

function categoryFallbackTitle(c: CategorySeoInput): string {
    return sanitizeMetaText(`Buy ${c.name} Online | Premium Ayurvedic Wellness`, 60);
}

function categoryFallbackDescription(c: CategorySeoInput): string {
    return sanitizeMetaText(
        c.description ||
        `Explore our collection of premium ${c.name}. Discover clinically tested Ayurvedic remedies and natural wellness solutions.`,
        160
    );
}

// ─── Metadata Builders ───────────────────────────────────────────────────────

/** Build Next.js Metadata for a product page */
export function buildProductMeta(product: ProductSeoInput): Metadata {
    const seo = product.seo;
    const title = seo?.meta_title || productFallbackTitle(product);
    const description = seo?.meta_description || productFallbackDescription(product);
    const canonical = seo?.canonical_url || `${SITE_URL}/products/${product.slug || product.product_id}`;
    const ogImage = seo?.og_image || product.thumbnail_url || DEFAULT_OG_IMAGE;
    const keywords = seo?.meta_keywords || [product.product_name, product.brand, product.category, SITE_NAME].filter(Boolean).join(', ');

    const robotsValue = seo?.robots || 'index, follow';
    const [indexDirective, followDirective] = robotsValue.split(',').map(s => s.trim());

    return {
        title,
        description,
        keywords,
        alternates: { canonical },
        robots: {
            index: indexDirective !== 'noindex',
            follow: followDirective !== 'nofollow',
        },
        openGraph: {
            title: seo?.og_title || title,
            description: seo?.og_description || description,
            url: canonical,
            siteName: SITE_NAME,
            images: [{ url: ogImage, width: 800, height: 800, alt: product.product_name }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: seo?.twitter_title || title,
            description: seo?.twitter_description || description,
            images: [seo?.twitter_image || ogImage],
        },
    };
}

/** Build Next.js Metadata for a category page */
export function buildCategoryMeta(category: CategorySeoInput): Metadata {
    const seo = category.seo;
    const title = seo?.meta_title || categoryFallbackTitle(category);
    const description = seo?.meta_description || categoryFallbackDescription(category);
    const canonical = seo?.canonical_url || `${SITE_URL}/categories/${category.slug || category.category_id}`;
    const ogImage = seo?.og_image || category.image_url || DEFAULT_OG_IMAGE;

    const robotsValue = seo?.robots || 'index, follow';
    const [indexDirective, followDirective] = robotsValue.split(',').map(s => s.trim());

    return {
        title,
        description,
        alternates: { canonical },
        robots: {
            index: indexDirective !== 'noindex',
            follow: followDirective !== 'nofollow',
        },
        openGraph: {
            title: seo?.og_title || title,
            description: seo?.og_description || description,
            url: canonical,
            siteName: SITE_NAME,
            images: [{ url: ogImage, width: 1200, height: 630, alt: category.name }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: seo?.twitter_title || title,
            description: seo?.twitter_description || description,
            images: [seo?.twitter_image || ogImage],
        },
    };
}

/** Build Next.js Metadata for the product listing page */
export function buildPLPMeta(hasFilters = false): Metadata {
    return {
        title: 'Shop Premium Ayurvedic Wellness | Vedashi',
        description: 'Browse our curated collection of premium Ayurvedic remedies and wellness formulations. Filter by category, benefit, and more. Fast delivery across India.',
        robots: hasFilters
            ? { index: false, follow: true }   // noindex filtered pages
            : { index: true, follow: true },
        openGraph: {
            title: 'Shop Premium Ayurvedic Wellness | Vedashi',
            description: 'Browse our curated collection of premium Ayurvedic remedies and wellness formulations.',
            siteName: SITE_NAME,
            type: 'website',
        },
    };
}

// ─── JSON-LD Structured Data ─────────────────────────────────────────────────

/** Product schema (JSON-LD) */
export function generateProductJsonLd(product: ProductSeoInput): Record<string, unknown> {
    const defaultVariant = product.variants?.find((v: any) => v.is_default) || product.variants?.[0];
    const price = defaultVariant?.price || product.price || 0;
    const sku = defaultVariant?.variant_sku || product.sku || '';
    const inStock = (defaultVariant?.stock_quantity ?? product.stock_quantity ?? 0) > 0;

    const imageSet = new Set<string>();
    if (product.thumbnail_url) imageSet.add(product.thumbnail_url);
    if (product.images) product.images.forEach(img => imageSet.add(img));
    if (imageSet.size === 0) imageSet.add(DEFAULT_OG_IMAGE);

    const schema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.product_name,
        description: product.description || productFallbackDescription(product),
        sku,
        image: Array.from(imageSet),
        url: `${SITE_URL}/products/${product.slug || product.product_id}`,
        offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'INR',
            availability: inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/products/${product.slug || product.product_id}`,
        },
    };

    if (product.brand) {
        schema.brand = { '@type': 'Brand', name: product.brand };
    }

    if (product.rating_average && product.review_count) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: product.rating_average,
            reviewCount: product.review_count,
            bestRating: 5,
            worstRating: 1,
        };
    }

    return schema;
}

/** FAQPage schema (JSON-LD) */
export function generateFAQPageJsonLd(faqs: Array<{ question: string; answer: string }>): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
            }
        }))
    };
}

/** BlogPosting schema (JSON-LD) */
export function generateBlogPostingJsonLd(post: any): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || '',
        image: post.cover_image ? [post.cover_image] : [DEFAULT_OG_IMAGE],
        datePublished: post.published_at || new Date().toISOString(),
        dateModified: post.updated_at || post.published_at || new Date().toISOString(),
        author: {
            '@type': 'Person',
            name: post.author_name || 'Vedashi Editorial',
            url: post.author_avatar || undefined
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${post.slug}`
        }
    };
}

/** BreadcrumbList schema (JSON-LD) */
export function generateBreadcrumbJsonLd(
    items: Array<{ name: string; url: string }>
): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/** Organization schema (JSON-LD) — used in layout */
export function generateOrganizationJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: [],
    };
}

/** WebSite schema with SearchAction (JSON-LD) — used in layout */
export function generateWebSiteJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

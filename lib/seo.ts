/**
 * SEO Utility Library
 * Provides metadata builders, fallback templates, sanitization,
 * and JSON-LD structured data generators for the storefront.
 */

import type { Metadata } from 'next';
import { ROUTES } from './routes';

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

const SITE_NAME = 'Vedashi Herbals';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/vedashi-social-banner.png`;

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
    parts.push('Купить онлайн');
    return sanitizeMetaText(parts.join(' | '), 60);
}

function productFallbackDescription(p: ProductSeoInput): string {
    const parts = [`Купите ${p.product_name}`];
    if (p.brand) parts[0] += ` от ${p.brand}`;
    parts[0] += '.';
    if (p.category) parts.push(`Премиальная аюрведическая ${p.category}.`);
    parts.push('Быстрая доставка и безопасная оплата.');
    return sanitizeMetaText(parts.join(' '), 160);
}

function categoryFallbackTitle(c: CategorySeoInput): string {
    return sanitizeMetaText(`Купить ${c.name} онлайн | Премиальная Аюрведа`, 60);
}

function categoryFallbackDescription(c: CategorySeoInput): string {
    return sanitizeMetaText(
        c.description ||
        `Откройте коллекцию ${c.name}. Клинически проверенные аюрведические средства и натуральные решения для здоровья.`,
        160
    );
}

// ─── Metadata Builders ───────────────────────────────────────────────────────

/** Generates alternate languages maps based on our supported regions. */
export function buildHreflang(pathStrategy: string): Record<string, string> {
    // Russia-only setup: single canonical URL, no multi-country hreflang
    const url = `${SITE_URL}/${pathStrategy}`;
    return {
        'ru-RU': url,
        'x-default': url
    };
}

/** Build Next.js Metadata for a product page */
export function buildProductMeta(product: ProductSeoInput, currentCountry: string = 'ru'): Metadata {
    const seo = product.seo;
    const title = seo?.meta_title || productFallbackTitle(product);
    const description = seo?.meta_description || productFallbackDescription(product);
    
    const pathStrategy = ROUTES.tovar(product.slug || product.product_id).slice(1);
    const canonical = seo?.canonical_url || `${SITE_URL}/${pathStrategy}`;
    
    const ogImage = seo?.og_image || `${SITE_URL}/${pathStrategy}/opengraph-image`;
    const keywords = seo?.meta_keywords || [product.product_name, product.brand, product.category, SITE_NAME].filter(Boolean).join(', ');

    const robotsValue = seo?.robots || 'index, follow';
    const [indexDirective, followDirective] = robotsValue.split(',').map((s: string) => s.trim());

    return {
        title,
        description,
        keywords,
        alternates: { 
            canonical,
            languages: buildHreflang(pathStrategy)
        },
        robots: {
            index: indexDirective !== 'noindex',
            follow: followDirective !== 'nofollow',
        },
        openGraph: {
            title: seo?.og_title || title,
            description: seo?.og_description || description,
            url: canonical,
            siteName: SITE_NAME,
            locale: 'ru_RU',
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
export function buildCategoryMeta(category: CategorySeoInput, currentCountry: string = 'ru'): Metadata {
    const seo = category.seo;
    const title = seo?.meta_title || categoryFallbackTitle(category);
    const description = seo?.meta_description || categoryFallbackDescription(category);
    
    const pathStrategy = ROUTES.katalogPath(category.slug || category.category_id).slice(1);
    const canonical = seo?.canonical_url || `${SITE_URL}/${pathStrategy}`;
    
    const ogImage = seo?.og_image || category.image_url || DEFAULT_OG_IMAGE;

    const robotsValue = seo?.robots || 'index, follow';
    const [indexDirective, followDirective] = robotsValue.split(',').map((s: string) => s.trim());

    return {
        title,
        description,
        alternates: { 
            canonical,
            languages: buildHreflang(pathStrategy)
        },
        robots: {
            index: indexDirective !== 'noindex',
            follow: followDirective !== 'nofollow',
        },
        openGraph: {
            title: seo?.og_title || title,
            description: seo?.og_description || description,
            url: canonical,
            siteName: SITE_NAME,
            locale: 'ru_RU',
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
export function buildPLPMeta(hasFilters = false, currentCountry: string = 'ru'): Metadata {
    const pathStrategy = ROUTES.katalog.slice(1);
    return {
        title: 'Каталог — Премиальная Аюрведа | Vedashi Herbals',
        description: 'Откройте нашу коллекцию премиальных аюрведических средств и натуральных формул. Фильтруйте по категории, бренду и цене. Быстрая доставка.',
        alternates: {
            canonical: `${SITE_URL}/${pathStrategy}`,
            languages: buildHreflang(pathStrategy)
        },
        robots: hasFilters
            ? { index: false, follow: true }   // noindex filtered pages
            : { index: true, follow: true },
        openGraph: {
            title: 'Каталог — Премиальная Аюрведа | Vedashi Herbals',
            description: 'Откройте нашу коллекцию премиальных аюрведических средств и натуральных формул.',
            url: `${SITE_URL}/${pathStrategy}`,
            siteName: SITE_NAME,
            locale: 'ru_RU',
            type: 'website',
        },
    };
}

// ─── JSON-LD Structured Data ─────────────────────────────────────────────────

/** Product schema (JSON-LD) */
export function generateProductJsonLd(
    product: ProductSeoInput,
    shippingConfig?: any,
    returnConfig?: any,
    currency: string = 'RUB',
    country: string = 'ru'
): Record<string, unknown> {
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
        mpn: sku,
        image: Array.from(imageSet),
        url: `${SITE_URL}${ROUTES.tovar(product.slug || product.product_id)}`,
        brand: {
            '@type': 'Brand',
            name: product.brand || SITE_NAME
        },
        offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: currency,
            availability: inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}${ROUTES.tovar(product.slug || product.product_id)}`,
            priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            itemCondition: 'https://schema.org/NewCondition',
            seller: {
                '@type': 'Organization',
                name: SITE_NAME
            }
        },
    };

    // Add Shipping Details if config is provided
    if (shippingConfig && schema.offers) {
        (schema.offers as any).shippingDetails = {
            '@type': 'OfferShippingDetails',
            shippingRate: {
                '@type': 'MonetaryAmount',
                value: shippingConfig.is_free ? 0 : (shippingConfig.flat_rate || 0),
                currency: shippingConfig.currency || 'RUB'
            },
            deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                    '@type': 'QuantitativeValue',
                    minValue: shippingConfig.handling_time_days_min || 1,
                    maxValue: shippingConfig.handling_time_days_max || 2,
                    unitCode: 'd'
                },
                transitTime: {
                    '@type': 'QuantitativeValue',
                    minValue: shippingConfig.transit_time_days_min || 3,
                    maxValue: shippingConfig.transit_time_days_max || 5,
                    unitCode: 'd'
                }
            },
            shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'RU'
            }
        };

        if (shippingConfig.description) {
            (schema.offers as any).description = shippingConfig.description;
        }
    }

    // Add Return Policy ONLY if real data is provided
    if (returnConfig && returnConfig.policy_days) {
        schema.hasMerchantReturnPolicy = {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'RU',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnPeriod',
            merchantReturnDays: returnConfig.policy_days,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: returnConfig.return_fees === 'free' 
                ? 'https://schema.org/FreeReturn' 
                : 'https://schema.org/ReturnShippingFeesCustomerPays',
            url: returnConfig.policy_url
        };

        if (returnConfig.description) {
            (schema.hasMerchantReturnPolicy as any).description = returnConfig.description;
        }
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

/** LocalBusiness schema (JSON-LD) */
export function generateLocalBusinessJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/vedashi-logo.png`,
        image: `${SITE_URL}/vedashi-social-banner.png`,
        description: 'Премиальные аюрведические продукты и натуральные травяные средства. Vedashi Herbals — ООО ВЕДАШИ ХЕРБАЛС.',
        email: 'info@vedashiherbals.com',
        priceRange: '₽₽',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'вн.тер.г. муниципальный округ Академический, ул. Шверника, д. 6, к. 1, помещ. 8П',
            addressLocality: 'Москва',
            addressRegion: 'Москва',
            postalCode: '117292',
            addressCountry: 'RU'
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: '55.6794',
            longitude: '37.5859'
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '09:00',
                closes: '18:00'
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Saturday'],
                opens: '10:00',
                closes: '16:00'
            }
        ],
    };
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
                url: `${SITE_URL}/vedashi-logo.png`
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
            item: {
                '@id': item.url,
                name: item.name
            }
        })),
    };
}

/** ItemList schema (JSON-LD) for product listings */
export function generateItemListJsonLd(
    items: Array<{ name: string; url: string; image?: string; price?: number }>
): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: item.url,
            item: {
                '@type': 'Product',
                name: item.name,
                image: item.image || DEFAULT_OG_IMAGE,
                url: item.url,
                offers: item.price ? {
                    '@type': 'Offer',
                    price: item.price,
                    priceCurrency: 'RUB'
                } : undefined
            }
        }))
    };
}

/** CollectionPage schema (JSON-LD) for category pages */
export function generateCollectionPageJsonLd(
    name: string,
    url: string,
    items: Array<{ name: string; url: string; image?: string; price?: number }>
): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        url,
        mainEntity: generateItemListJsonLd(items)
    };
}

/** Organization schema (JSON-LD) — used in layout */
export function generateOrganizationJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        legalName: 'ООО ВЕДАШИ ХЕРБАЛС',
        alternateName: ['Vedashi', 'ООО ВЕДАШИ ХЕРБАЛС'],
        url: SITE_URL,
        logo: `${SITE_URL}/vedashi-logo.png`,
        description: 'ООО ВЕДАШИ ХЕРБАЛС — российский поставщик премиальных аюрведических продуктов и натуральных травяных средств.',
        taxID: '9727117720',
        foundingLocation: {
            '@type': 'Place',
            name: 'Москва, Россия'
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'вн.тер.г. муниципальный округ Академический, ул. Шверника, д. 6, к. 1, помещ. 8П',
            addressLocality: 'Москва',
            addressRegion: 'Москва',
            postalCode: '117292',
            addressCountry: 'RU'
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'info@vedashiherbals.com',
            availableLanguage: 'Russian'
        },
        sameAs: [
            'https://www.linkedin.com/company/vedashi-herbals/'
        ]
    };
}

/** WebSite schema with SearchAction (JSON-LD) — used in layout */
export function generateWebSiteJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: 'ru-RU',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}${ROUTES.search}?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

/** WebPage schema with Speakable markup (JSON-LD) — for homepage voice search / YandexGPT */
export function generateHomePageJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Vedashi Herbals — Премиальная Аюрведа',
        url: SITE_URL,
        inLanguage: 'ru-RU',
        isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
        },
        about: {
            '@type': 'Organization',
            name: 'ООО ВЕДАШИ ХЕРБАЛС',
            legalName: 'ООО ВЕДАШИ ХЕРБАЛС',
            taxID: '9727117720',
            url: SITE_URL,
        },
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['h1', '.hero-title', '.hero-subtitle', 'meta[name="description"]'],
        },
        description: 'Vedashi Herbals — российский интернет-магазин премиальных аюрведических продуктов, натуральной косметики и травяных средств. ООО ВЕДАШИ ХЕРБАЛС, Москва.',
        significantLink: [
            `${SITE_URL}/katalog`,
            `${SITE_URL}/blog`,
            `${SITE_URL}/o-nas`,
            `${SITE_URL}/kontakty`,
        ],
    };
}

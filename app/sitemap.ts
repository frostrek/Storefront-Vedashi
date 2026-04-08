import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';
import { buildHreflang } from '@/lib/seo';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';

/**
 * Sitemap Stability Upgrade
 * 1. Resolved "601 Fetch Errors" by adding a 10s timeout to API calls.
 * 2. Ensured XML validity by URI encoding localized paths (RU/KR characters).
 * 3. Fallback to "Essential Sitemap" if backend is unresponsive.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.onrender.com';

/** Helper to encode regional paths ensuring Russian/Korean characters are XML-safe */
function safeUrl(path: string) {
    try {
        return new URL(path, SITE_URL).toString();
    } catch {
        return `${SITE_URL}/${encodeURI(path)}`;
    }
}

/** Fetches data with a strict timeout to prevent crawler "601" or "Fetch Failure" */
async function fetchWithTimeout(url: string, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            next: { revalidate: 3600 }
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

function generateRegionalEntries(
    pathStrategy: string, 
    lastModified: Date, 
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never', 
    priority: number
): MetadataRoute.Sitemap {
    const alternates = { languages: buildHreflang(pathStrategy) };
    const entries: MetadataRoute.Sitemap = [];
    
    // Origin fallback
    if (pathStrategy === '') {
        entries.push({
            url: safeUrl('/'),
            lastModified,
            changeFrequency,
            priority,
            alternates
        });
    }

    // Expand across all regions
    Object.values(SUPPORTED_COUNTRIES).forEach((c) => {
        entries.push({
            url: safeUrl(`/${c.code}/${pathStrategy}`),
            lastModified,
            changeFrequency,
            priority,
            alternates
        });
    });
    
    return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let products: any[] = [];
    let categories: any[] = [];

    // Critical: Fetch from API with Timeout & Graceful degradation
    try {
        const [productsRes, categoriesRes] = await Promise.all([
            fetchWithTimeout(`${API_URL}/api/sitemap/products`),
            fetchWithTimeout(`${API_URL}/api/sitemap/categories`),
        ]);

        if (productsRes.ok) products = await productsRes.json();
        if (categoriesRes.ok) categories = await categoriesRes.json();
    } catch (error) {
        // Log locally, but do NOT fail the sitemap build (avoids 601 errors)
        console.warn('Sitemap: Failed to fetch dynamic entities, serving Essential Sitemap only.');
    }

    const staticPages: MetadataRoute.Sitemap = [
        ...generateRegionalEntries('', new Date(), 'daily', 1.0),
        ...generateRegionalEntries('shop', new Date(), 'daily', 0.9),
        ...generateRegionalEntries('about', new Date(), 'monthly', 0.7),
        ...generateRegionalEntries('contact', new Date(), 'monthly', 0.6),
        ...generateRegionalEntries('blog', new Date(), 'weekly', 0.8),
        ...generateRegionalEntries('privacy-policy', new Date(), 'yearly', 0.3),
    ];

    const productUrls: MetadataRoute.Sitemap = products.flatMap((p) => 
        generateRegionalEntries(`products/${p.slug}`, new Date(p.updated_at || new Date()), 'weekly', 0.8)
    );

    const categoryUrls: MetadataRoute.Sitemap = categories.flatMap((c) => 
        generateRegionalEntries(`categories/${c.slug}`, new Date(c.updated_at || new Date()), 'weekly', 0.7)
    );

    return [...staticPages, ...productUrls, ...categoryUrls];
}

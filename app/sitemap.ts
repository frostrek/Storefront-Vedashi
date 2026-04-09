import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

/**
 * Fetch data for sitemap generation
 */
async function fetchSitemapData() {
    try {
        const [pRes, cRes] = await Promise.all([
            fetch(`${API_URL}/api/sitemap/products`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/api/sitemap/categories`, { next: { revalidate: 3600 } }),
        ]);
        return {
            products: pRes.ok ? await pRes.json() : [],
            categories: cRes.ok ? await cRes.json() : []
        };
    } catch (e) {
        console.error('[Sitemap] Fetch error:', e);
        return { products: [], categories: [] };
    }
}

/**
 * Next.js Sitemap Generator
 * Automatically serves as /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const { products, categories } = await fetchSitemapData();
    const lastMod = new Date();
    const countries = Object.keys(SUPPORTED_COUNTRIES);

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Loop through each country to generate localized entries
    for (const country of countries) {
        // Static Pages
        const staticPages = ['', '/shop', '/about', '/contact', '/blog'];
        staticPages.forEach(p => {
            sitemapEntries.push({
                url: `${SITE_URL}/${country}${p}`,
                lastModified: lastMod,
                changeFrequency: p === '' ? 'daily' : 'weekly',
                priority: p === '' ? 1.0 : 0.8,
            });
        });

        // Category Pages
        categories.forEach((c: any) => {
            sitemapEntries.push({
                url: `${SITE_URL}/${country}/categories/${c.slug}`,
                lastModified: lastMod,
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        });

        // Product Pages
        products.forEach((p: any) => {
            sitemapEntries.push({
                url: `${SITE_URL}/${country}/products/${p.slug}`,
                lastModified: p.updated_at ? new Date(p.updated_at) : lastMod,
                changeFrequency: 'weekly',
                priority: 0.9,
            });
        });
    }

    return sitemapEntries;
}

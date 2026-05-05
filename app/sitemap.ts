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
    } catch (e: any) {
        if (e.code === 'ECONNREFUSED' || e.message?.includes('fetch failed')) {
            console.warn('[Sitemap] Fetch failed: API is unreachable. Sitemap will be empty.');
        } else {
            console.error('[Sitemap] Fetch error:', e);
        }
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
            const languages: Record<string, string> = {};
            countries.forEach(c => {
                const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
                languages[locale] = `${SITE_URL}/${c}${p}`;
            });
            
            // Base language fallbacks for broader SEO matching
            languages['en'] = `${SITE_URL}/in${p}`;
            languages['ru'] = `${SITE_URL}/ru${p}`;
            languages['ko'] = `${SITE_URL}/kr${p}`;
            languages['ar'] = `${SITE_URL}/ae${p}`;
            languages['x-default'] = `${SITE_URL}/in${p}`;

            sitemapEntries.push({
                url: `${SITE_URL}/${country}${p}`,
                lastModified: lastMod,
                changeFrequency: p === '' ? 'daily' : 'weekly',
                priority: p === '' ? 1.0 : 0.8,
                alternates: { languages }
            });
        });

        // Category Pages
        categories.forEach((c: any) => {
            const languages: Record<string, string> = {};
            countries.forEach(cc => {
                const locale = SUPPORTED_COUNTRIES[cc as keyof typeof SUPPORTED_COUNTRIES].locale;
                languages[locale] = `${SITE_URL}/${cc}/products?category=${c.slug}`;
            });
            
            languages['en'] = `${SITE_URL}/in/products?category=${c.slug}`;
            languages['ru'] = `${SITE_URL}/ru/products?category=${c.slug}`;
            languages['ko'] = `${SITE_URL}/kr/products?category=${c.slug}`;
            languages['ar'] = `${SITE_URL}/ae/products?category=${c.slug}`;
            languages['x-default'] = `${SITE_URL}/in/products?category=${c.slug}`;

            sitemapEntries.push({
                url: `${SITE_URL}/${country}/products?category=${c.slug}`,
                lastModified: lastMod,
                changeFrequency: 'weekly',
                priority: 0.7,
                alternates: { languages }
            });
        });

        // Product Pages
        products.forEach((p: any) => {
            const languages: Record<string, string> = {};
            countries.forEach(cc => {
                const locale = SUPPORTED_COUNTRIES[cc as keyof typeof SUPPORTED_COUNTRIES].locale;
                languages[locale] = `${SITE_URL}/${cc}/products/${p.slug}`;
            });
            
            languages['en'] = `${SITE_URL}/in/products/${p.slug}`;
            languages['ru'] = `${SITE_URL}/ru/products/${p.slug}`;
            languages['ko'] = `${SITE_URL}/kr/products/${p.slug}`;
            languages['ar'] = `${SITE_URL}/ae/products/${p.slug}`;
            languages['x-default'] = `${SITE_URL}/in/products/${p.slug}`;

            sitemapEntries.push({
                url: `${SITE_URL}/${country}/products/${p.slug}`,
                lastModified: p.updated_at ? new Date(p.updated_at) : lastMod,
                changeFrequency: 'weekly',
                priority: 0.9,
                alternates: { languages }
            });
        });
    }

    return sitemapEntries;
}

import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';
import { buildHreflang } from '@/lib/seo';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';

// API_URL imported from @/lib/api
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

function generateRegionalEntries(
    pathStrategy: string, 
    lastModified: Date, 
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never', 
    priority: number
): MetadataRoute.Sitemap {
    const alternates = { languages: buildHreflang(pathStrategy) };
    const entries: MetadataRoute.Sitemap = [];
    
    // Add default route fallback (usually points to /in/ implicitly by router, but explicitly in canonicals)
    if (pathStrategy === '') {
        entries.push({
            url: `${SITE_URL}/`,
            lastModified,
            changeFrequency,
            priority,
            alternates
        });
    }

    Object.values(SUPPORTED_COUNTRIES).forEach((c) => {
        entries.push({
            url: `${SITE_URL}/${c.code}/${pathStrategy}`,
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

    try {
        const [productsRes, categoriesRes] = await Promise.all([
            fetch(`${API_URL}/api/sitemap/products`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/api/sitemap/categories`, { next: { revalidate: 3600 } }),
        ]);

        if (productsRes.ok) products = await productsRes.json();
        if (categoriesRes.ok) categories = await categoriesRes.json();
    } catch (error) {
        console.error('Sitemap generation failed to fetch from API:', error);
    }

    const staticPages: MetadataRoute.Sitemap = [
        ...generateRegionalEntries('', new Date(), 'daily', 1.0),
        ...generateRegionalEntries('shop', new Date(), 'daily', 0.9), // PLP
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

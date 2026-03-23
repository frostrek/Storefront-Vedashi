import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';

// API_URL imported from @/lib/api
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
        { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ];

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
        url: `${SITE_URL}/products/${p.slug}`,
        lastModified: new Date(p.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
        url: `${SITE_URL}/categories/${c.slug}`,
        lastModified: new Date(c.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    // Capped by next.js convention usually, but we assume active catalog size is manageable.
    return [...staticPages, ...productUrls, ...categoryUrls];
}

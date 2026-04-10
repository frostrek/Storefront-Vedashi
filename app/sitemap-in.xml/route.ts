import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.onrender.com';

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
        return { products: [], categories: [] };
    }
}

export async function GET() {
    const { products, categories } = await fetchSitemapData();
    const lastMod = new Date().toISOString();

    const staticPages = ['', '/about', '/contact', '/blog'].map(p => ({
        loc: `${SITE_URL}/in${p}`,
        lastmod: lastMod,
        changefreq: 'daily',
        priority: p === '' ? '1.0' : '0.8'
    }));

    const categoryPages = categories.map((c: any) => ({
        loc: `${SITE_URL}/in/categories/${c.slug}`,
        lastmod: lastMod,
        changefreq: 'weekly',
        priority: '0.7'
    }));

    const productPages = products.map((p: any) => ({
        loc: `${SITE_URL}/in/products/${p.slug}`,
        lastmod: p.updated_at || lastMod,
        changefreq: 'weekly',
        priority: '0.9'
    }));

    const allPages = [...staticPages, ...categoryPages, ...productPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `    <url>
        <loc>${page.loc}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
        },
    });
}

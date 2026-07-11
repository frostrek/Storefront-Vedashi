import { API_URL } from '@/lib/api';
import { SUPPORTED_COUNTRIES, buildPath } from '@/lib/currency';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

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
    } catch (error) {
        const e = error as { code?: string; message?: string };
        if (e.code === 'ECONNREFUSED' || e.message?.includes('fetch failed')) {
            console.warn('[Sitemap] Fetch failed: API is unreachable. Sitemap will be empty.');
        } else {
            console.error('[Sitemap] Fetch error:', error);
        }
        return { products: [], categories: [] };
    }
}

const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&apos;');

function addHreflangLinks(
    countries: string[],
    pathBuilder: (countryCode: string) => string
): string {
    let links = '';
    countries.forEach(c => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        links += `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(pathBuilder(c))}"/>\n`;
    });
    links += `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(pathBuilder('us'))}"/>\n`;
    links += `    <xhtml:link rel="alternate" hreflang="ru" href="${escapeXml(pathBuilder('ru'))}"/>\n`;
    links += `    <xhtml:link rel="alternate" hreflang="ko" href="${escapeXml(pathBuilder('kr'))}"/>\n`;
    links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(pathBuilder('us'))}"/>\n`;
    return links;
}

/**
 * Custom sitemap route handler.
 * Outputs properly formatted, indented XML with an XSL stylesheet reference
 * so the sitemap renders as a readable table for human visitors, while
 * remaining fully standards-compliant for crawlers.
 */
export async function GET() {
    const { products, categories } = await fetchSitemapData();
    const lastMod = new Date().toISOString();
    const countries = Object.keys(SUPPORTED_COUNTRIES);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    for (const country of countries) {
        // Static Pages
        const staticPages = ['', '/about', '/contact', '/blog'];
        for (const p of staticPages) {
            const loc = `${SITE_URL}${buildPath(country, p)}`;
            const changefreq = p === '' ? 'daily' : 'weekly';
            const priority = p === '' ? '1.0' : '0.8';

            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>${changefreq}</changefreq>\n`;
            xml += `    <priority>${priority}</priority>\n`;
            xml += addHreflangLinks(countries, (c) => `${SITE_URL}${buildPath(c, p)}`);
            xml += `  </url>\n`;
        }

        // Category Pages
        for (const c of categories) {
            const loc = `${SITE_URL}${buildPath(country, `/products?category=${c.slug}`)}`;
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += addHreflangLinks(countries, (cc) => `${SITE_URL}${buildPath(cc, `/products?category=${c.slug}`)}`);
            xml += `  </url>\n`;
        }

        // Product Pages
        for (const p of products) {
            const loc = `${SITE_URL}${buildPath(country, `/products/${p.slug}`)}`;
            const pMod = p.updated_at ? new Date(p.updated_at).toISOString() : lastMod;
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${pMod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;
            xml += addHreflangLinks(countries, (cc) => `${SITE_URL}${buildPath(cc, `/products/${p.slug}`)}`);
            xml += `  </url>\n`;
        }
    }

    xml += `</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}

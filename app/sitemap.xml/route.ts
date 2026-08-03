import { API_URL, getLegalDocumentsList } from '@/lib/api';
import { SUPPORTED_COUNTRIES, buildPath } from '@/lib/currency';
import { ROUTES } from '@/lib/routes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

interface StaticPageEntry {
    path: string;
    changefreq: string;
    priority: string;
}

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

async function fetchBlogPosts(): Promise<Array<{ slug: string; updated_at?: string }>> {
    try {
        const res = await fetch(`${API_URL}/api/blogs?limit=500&status=published`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const json = await res.json();
        return json.success ? (json.data?.posts || json.data || []) : [];
    } catch {
        return [];
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
    const [{ products, categories }, blogPosts, legalDocs] = await Promise.all([
        fetchSitemapData(),
        fetchBlogPosts(),
        getLegalDocumentsList(),
    ]);
    const lastMod = new Date().toISOString();
    const countries = Object.keys(SUPPORTED_COUNTRIES);

    // All indexable static pages with their Russian paths
    const staticPages: StaticPageEntry[] = [
        { path: '', changefreq: 'daily', priority: '1.0' },
        { path: ROUTES.katalog.slice(1), changefreq: 'daily', priority: '0.9' },
        { path: ROUTES.about.slice(1), changefreq: 'monthly', priority: '0.6' },
        { path: ROUTES.contact.slice(1), changefreq: 'monthly', priority: '0.5' },
        { path: ROUTES.blog.slice(1), changefreq: 'daily', priority: '0.8' },
        { path: ROUTES.helpCenter.slice(1), changefreq: 'monthly', priority: '0.5' },
        { path: ROUTES.helpCenterFaq.slice(1), changefreq: 'monthly', priority: '0.5' },
        { path: ROUTES.helpCenterKnowledgeBase.slice(1), changefreq: 'weekly', priority: '0.5' },
        // Legal documents — dynamically fetched from DB
        ...legalDocs.map(doc => ({ path: doc.slug, changefreq: 'monthly', priority: '0.4' })),
        { path: ROUTES.vendorRegistration.slice(1), changefreq: 'monthly', priority: '0.3' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    for (const country of countries) {
        // Static Pages
        for (const sp of staticPages) {
            const loc = `${SITE_URL}${buildPath(country, sp.path)}`;

            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>${sp.changefreq}</changefreq>\n`;
            xml += `    <priority>${sp.priority}</priority>\n`;
            xml += addHreflangLinks(countries, (c) => `${SITE_URL}${buildPath(c, sp.path)}`);
            xml += `  </url>\n`;
        }

        // Category Pages
        for (const c of categories) {
            const catPath = ROUTES.katalogPath(c.full_path || c.slug).slice(1);
            const loc = `${SITE_URL}${buildPath(country, catPath)}`;
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += addHreflangLinks(countries, (cc) => `${SITE_URL}${buildPath(cc, catPath)}`);
            xml += `  </url>\n`;
        }

        // Product Pages
        for (const p of products) {
            const prodPath = ROUTES.tovar(p.slug).slice(1);
            const loc = `${SITE_URL}${buildPath(country, prodPath)}`;
            const pMod = p.updated_at ? new Date(p.updated_at).toISOString() : lastMod;
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${pMod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;
            xml += addHreflangLinks(countries, (cc) => `${SITE_URL}${buildPath(cc, prodPath)}`);
            xml += `  </url>\n`;
        }

        // Blog Posts
        for (const post of blogPosts) {
            const blogPath = `${ROUTES.blog.slice(1)}/${post.slug}`;
            const loc = `${SITE_URL}${buildPath(country, blogPath)}`;
            const bMod = post.updated_at ? new Date(post.updated_at).toISOString() : lastMod;
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(loc)}</loc>\n`;
            xml += `    <lastmod>${bMod}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.6</priority>\n`;
            xml += addHreflangLinks(countries, (cc) => `${SITE_URL}${buildPath(cc, blogPath)}`);
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

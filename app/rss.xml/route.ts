import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function GET() {
    try {
        // Fetch products and blog posts in parallel
        const [productsRes, blogRes] = await Promise.all([
            fetch(`${API_URL}/api/sitemap/products`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/api/blogs?limit=100&status=published`, { next: { revalidate: 3600 } }),
        ]);

        const products = productsRes.ok ? await productsRes.json() : [];

        let blogPosts: any[] = [];
        if (blogRes.ok) {
            const blogJson = await blogRes.json();
            blogPosts = blogJson.success ? (blogJson.data?.posts || blogJson.data || []) : [];
        }

        // Build standard RSS feed — fully localized to Russian
        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${RU_DICTIONARY.rss.title}</title>
    <link>${SITE_URL}</link>
    <description>${RU_DICTIONARY.rss.description}</description>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

        // ── Product items ────────────────────────────────────────
        for (const p of products) {
            const productUrl = `${SITE_URL}${ROUTES.tovar(p.slug || p.product_id)}`;
            const rawDescription = p.short_description || p.description || p.product_name;
            const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').substring(0, 300);

            rss += `
    <item>
      <title><![CDATA[${p.product_name}]]></title>
      <link>${productUrl}</link>
      <description><![CDATA[${cleanDescription}]]></description>
      <guid isPermaLink="true">${productUrl}</guid>
      <pubDate>${new Date(p.created_at || new Date()).toUTCString()}</pubDate>
    </item>`;
        }

        // ── Blog post items ──────────────────────────────────────
        for (const post of blogPosts) {
            const blogUrl = `${SITE_URL}/blog/${post.slug}`;
            const rawExcerpt = post.excerpt || post.title;
            const cleanExcerpt = rawExcerpt.replace(/<[^>]*>?/gm, '').substring(0, 300);

            rss += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${blogUrl}</link>
      <description><![CDATA[${cleanExcerpt}]]></description>
      <guid isPermaLink="true">${blogUrl}</guid>
      <pubDate>${new Date(post.published_at || post.created_at || new Date()).toUTCString()}</pubDate>
    </item>`;
        }

        rss += `
  </channel>
</rss>`;

        return new NextResponse(rss, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate',
            },
        });
    } catch (error) {
        console.error('[RSS API] Error:', error);
        return new NextResponse('Error generating RSS', { status: 500 });
    }
}

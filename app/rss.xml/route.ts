import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

export async function GET() {
    try {
        // Fetch products that we already use for the sitemap
        const res = await fetch(`${API_URL}/api/sitemap/products`, { next: { revalidate: 3600 } });
        const products = res.ok ? await res.json() : [];

        // Build standard RSS feed
        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vedashi — Premium Ayurvedic Wellness</title>
    <link>${SITE_URL}</link>
    <description>Shop authentic Ayurvedic wellness products from Vedashi.</description>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

        for (const p of products) {
            // Pick a default country for global RSS (e.g., IN)
            const productUrl = `${SITE_URL}/products/${p.slug || p.product_id}`;
            const description = p.short_description || p.description || p.product_name;
            const cleanDescription = description.replace(/<[^>]*>?/gm, '').substring(0, 300);

            rss += `
    <item>
      <title><![CDATA[${p.product_name}]]></title>
      <link>${productUrl}</link>
      <description><![CDATA[${cleanDescription}]]></description>
      <guid isPermaLink="true">${productUrl}</guid>
      <pubDate>${new Date(p.created_at || new Date()).toUTCString()}</pubDate>
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

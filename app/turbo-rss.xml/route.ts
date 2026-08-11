import { getBlogPosts, BlogPost } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

/**
 * Yandex Turbo Pages RSS Feed.
 *
 * Turbo Pages are ultra-fast, cached versions of your content served
 * directly inside Yandex Search results on mobile devices.
 *
 * Spec: https://yandex.ru/dev/turbo/doc/rss/markup.html
 *
 * This feed exposes blog posts in the Turbo-compatible RSS 2.0 format
 * with `turbo:content` CDATA blocks containing clean HTML.
 * Submit this URL in Yandex Webmaster → Turbo Pages → RSS feeds.
 */

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Strip HTML tags and return plain text (for <description>).
 */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitise the blog body HTML for Turbo Pages.
 * Turbo only allows a subset of HTML tags (h1-h6, p, br, ul, ol, li,
 * b, strong, i, em, img, a, figure, figcaption, blockquote, table, etc.)
 * We keep the body as-is since our CMS already produces clean HTML,
 * but wrap it in the required <turbo:content> CDATA block.
 */
function buildTurboContent(post: BlogPost): string {
    const image = post.featured_image || post.cover_image;
    const header = image
        ? `<header><h1>${escapeXml(post.title)}</h1><figure><img src="${escapeXml(image)}" /><figcaption>${escapeXml(post.title)}</figcaption></figure></header>`
        : `<header><h1>${escapeXml(post.title)}</h1></header>`;

    // post.body is HTML from the CMS — wrap it as turbo content
    const body = post.body || '';

    return `${header}\n${body}`;
}

function buildRssItem(post: BlogPost): string {
    const link = `${SITE_URL}/blog/${post.slug}`;
    const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date(post.created_at).toUTCString();
    const description = post.excerpt || post.meta_description || stripHtml(post.body).slice(0, 300);
    const author = post.author_name || 'Vedashi Herbals';
    const category = post.category_name ? `<category>${escapeXml(post.category_name)}</category>` : '';
    const image = post.featured_image || post.cover_image;
    const enclosure = image
        ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />`
        : '';

    return `    <item turbo="true">
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(author)}</author>
      ${category}
      ${enclosure}
      <description>${escapeXml(description)}</description>
      <turbo:content><![CDATA[
        ${buildTurboContent(post)}
      ]]></turbo:content>
    </item>`;
}

export async function GET() {
    try {
        // Fetch up to 50 latest published blog posts for the feed
        const { posts } = await getBlogPosts({ limit: 50 });
        const publishedPosts = posts.filter(p => p.status === 'published');

        const items = publishedPosts.map(buildRssItem).join('\n');

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:yandex="http://news.yandex.ru"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:turbo="http://turbo.yandex.ru"
     version="2.0">
  <channel>
    <title>Vedashi Herbals — Блог об аюрведе и натуральной косметике</title>
    <link>${SITE_URL}</link>
    <description>Советы по аюрведе, натуральной косметике и здоровому образу жизни от Vedashi Herbals</description>
    <language>ru</language>
    <turbo:analytics type="Yandex" id="${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || ''}"></turbo:analytics>
${items}
  </channel>
</rss>`;

        return new Response(rss, {
            status: 200,
            headers: {
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('Turbo RSS feed error:', error);
        return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title></channel></rss>', {
            status: 500,
            headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
        });
    }
}

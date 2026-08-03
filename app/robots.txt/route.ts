import { ROUTES } from '@/lib/routes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

export async function GET() {
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldIndex = isProduction && process.env.NEXT_PUBLIC_NO_INDEX !== 'true';

    if (!shouldIndex) {
        return new Response(
            `User-agent: *\nDisallow: /\nSitemap: ${SITE_URL}/sitemap.xml\nHost: ${SITE_URL}\n`,
            { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
    }

    const disallowedPaths = [
        '/admin/', '/api/',
        ROUTES.korzina + '/', '/ru' + ROUTES.korzina + '/', '/kr' + ROUTES.korzina + '/',
        ROUTES.checkout + '/', '/ru' + ROUTES.checkout + '/', '/kr' + ROUTES.checkout + '/',
        ROUTES.account + '/', '/ru' + ROUTES.account + '/', '/kr' + ROUTES.account + '/',
        ROUTES.search + '?*', '/ru' + ROUTES.search + '?*', '/kr' + ROUTES.search + '?*',
        ROUTES.login + '/', '/ru' + ROUTES.login + '/', '/kr' + ROUTES.login + '/',
        '/podtverzhdenie-*', '/ru/podtverzhdenie-*', '/kr/podtverzhdenie-*',
    ];

    const disallowBlock = disallowedPaths.map(p => `Disallow: ${p}`).join('\n');

    const lines = [
        '# Major search engine crawlers',
        'User-agent: Googlebot',
        'User-agent: Bingbot',
        'User-agent: Applebot',
        'User-agent: DuckDuckBot',
        'User-agent: YandexBot',
        'Allow: /',
        disallowBlock,
        '',
        '# AI crawlers',
        'User-agent: GPTBot',
        'User-agent: ChatGPT-User',
        'User-agent: ClaudeBot',
        'User-agent: anthropic-ai',
        'User-agent: PerplexityBot',
        'User-agent: cohere-ai',
        'Allow: /',
        disallowBlock,
        '',
        '# All other crawlers',
        'User-agent: *',
        'Allow: /',
        disallowBlock,
        '',
        '# Yandex-specific directives',
        `Host: ${SITE_URL}`,
        `Clean-param: sort&min_price&max_price&brand&page&per_page ${ROUTES.katalog}`,
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
    ];

    return new Response(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}

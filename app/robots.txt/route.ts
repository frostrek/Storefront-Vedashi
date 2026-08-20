import { ROUTES } from '@/lib/routes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function GET() {
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldIndex = isProduction && process.env.NEXT_PUBLIC_NO_INDEX !== 'true';

    if (!shouldIndex) {
        return new Response(
            `User-agent: *\nDisallow: /\nSitemap: ${SITE_URL}/sitemap.xml\nHost: ${SITE_URL}\n`,
            { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
    }

    // Russia-only site — no /ru or /kr prefixes needed
    const disallowedPaths = [
        '/admin/',
        '/api/',
        ROUTES.korzina + '/',
        ROUTES.checkout + '/',
        ROUTES.account + '/',
        ROUTES.search + '?*',
        ROUTES.login + '/',
        '/podtverzhdenie-*',
        '/zabyly-parol',
        '/sbros-parolya',
        '/podtverzhdenie-email',
        '/podtverzhdenie-otp',
    ];

    const disallowBlock = disallowedPaths.map(p => `Disallow: ${p}`).join('\n');

    const lines = [
        '# ═══════════════════════════════════════════════════════════',
        '# Vedashi Herbals (vedashiherbals.com) — Robots.txt',
        '# Russia-only site, optimized for Google, Yandex, and AI engines',
        '# ═══════════════════════════════════════════════════════════',
        '',
        '# ─── Major Search Engine Crawlers ─────────────────────────',
        'User-agent: Googlebot',
        'User-agent: Googlebot-Image',
        'User-agent: Googlebot-News',
        'User-agent: Googlebot-Video',
        'User-agent: Bingbot',
        'User-agent: Applebot',
        'User-agent: DuckDuckBot',
        'User-agent: YandexBot',
        'User-agent: Yandex',
        'User-agent: YandexImages',
        'User-agent: YandexMedia',
        'Allow: /',
        'Allow: /llms.txt',
        'Allow: /llms-full.txt',
        disallowBlock,
        '',
        '# ─── AI / LLM / Generative Engine Crawlers (GEO/AEO) ────',
        '# Maximum access for AI readability and answer engine indexing',
        'User-agent: GPTBot',
        'User-agent: ChatGPT-User',
        'User-agent: OAI-SearchBot',
        'User-agent: ChatGPT',
        'User-agent: ClaudeBot',
        'User-agent: anthropic-ai',
        'User-agent: Claude-Web',
        'User-agent: Microsoft-Bing',
        'User-agent: Copilot',
        'User-agent: PerplexityBot',
        'User-agent: cohere-ai',
        'User-agent: Google-Extended',
        'User-agent: Applebot-Extended',
        'User-agent: YandexAdditional',
        'User-agent: Amazonbot',
        'User-agent: meta-externalagent',
        'User-agent: FacebookExternalHit',
        'Allow: /',
        'Allow: /llms.txt',
        'Allow: /llms-full.txt',
        'Allow: /blog/',
        'Allow: /katalog/',
        'Allow: /tovar/',
        'Allow: /o-nas',
        'Allow: /pomoshch/',
        disallowBlock,
        '',
        '# ─── All Other Crawlers ──────────────────────────────────',
        'User-agent: *',
        'Allow: /',
        disallowBlock,
        '',
        '# ─── Yandex-specific Directives ──────────────────────────',
        `Host: ${SITE_URL}`,
        `Clean-param: sort&min_price&max_price&brand&page&per_page ${ROUTES.katalog}`,
        '',
        '# ─── Sitemaps ────────────────────────────────────────────',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        `Sitemap: ${SITE_URL}/turbo-rss.xml`,
        `Sitemap: ${SITE_URL}/rss.xml`,
    ];

    return new Response(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}

import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

export default function robots(): MetadataRoute.Robots {
    const isProduction = process.env.NODE_ENV === 'production';

    // Allow easy toggling via an env var overriding NODE_ENV if needed
    const shouldIndex = isProduction && process.env.NEXT_PUBLIC_NO_INDEX !== 'true';

    if (!shouldIndex) {
        return {
            rules: {
                userAgent: '*',
                disallow: '/',
            },
            sitemap: `${SITE_URL}/sitemap.xml`,
        };
    }

    return {
        rules: [
            {
                userAgent: ['Googlebot', 'Bingbot', 'Applebot', 'DuckDuckBot', 'YandexBot'],
                allow: '/',
                disallow: [
                    '/admin/', '/cart/', '/ru/cart/', '/kr/cart/',
                    '/checkout/', '/ru/checkout/', '/kr/checkout/',
                    '/account/', '/ru/account/', '/kr/account/',
                    '/api/',
                    '/search?*', '/ru/search?*', '/kr/search?*',
                    '/login/', '/ru/login/', '/kr/login/',
                    '/verify-*', '/ru/verify-*', '/kr/verify-*',
                ],
            },
            {
                userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'cohere-ai'],
                allow: '/',
                disallow: [
                    '/admin/', '/cart/', '/ru/cart/', '/kr/cart/',
                    '/checkout/', '/ru/checkout/', '/kr/checkout/',
                    '/account/', '/ru/account/', '/kr/account/',
                    '/api/',
                    '/search?*', '/ru/search?*', '/kr/search?*',
                    '/login/', '/ru/login/', '/kr/login/',
                    '/verify-*', '/ru/verify-*', '/kr/verify-*',
                ],
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/', '/cart/', '/ru/cart/', '/kr/cart/',
                    '/checkout/', '/ru/checkout/', '/kr/checkout/',
                    '/account/', '/ru/account/', '/kr/account/',
                    '/api/',
                    '/search?*', '/ru/search?*', '/kr/search?*',
                    '/login/', '/ru/login/', '/kr/login/',
                    '/verify-*', '/ru/verify-*', '/kr/verify-*',
                ],
            }
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}

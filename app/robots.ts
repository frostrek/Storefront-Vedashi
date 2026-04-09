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
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/*/cart/',
                '/*/checkout/',
                '/*/account/',
                '/api/',
                '/*/search?*',
                '/*/login/',
                '/*/verify-*',
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}

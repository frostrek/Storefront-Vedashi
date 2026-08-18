import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';
import { SUPPORTED_COUNTRIES, buildPath } from '@/lib/currency';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';
const INDEXNOW_KEY = 'f8028a276d1d4a099131bec65b74d3b9';
const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

// Secure endpoint with a simple token to prevent abuse
const INDEXNOW_SECRET = process.env.INDEXNOW_SECRET || 'vedashi_indexnow_2026';

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
        console.error('[IndexNow] Fetch error:', error);
        return { products: [], categories: [] };
    }
}

export async function POST(request: Request) {
    // 1. Verify Secret Token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('secret');

    if (token !== INDEXNOW_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all products and categories
    const { products, categories } = await fetchSitemapData();
    const countries = Object.keys(SUPPORTED_COUNTRIES);
    const urlList: string[] = [];

    // 3. Construct all localized URLs (matching sitemap)
    for (const country of countries) {
        // Static Pages
        const staticPages = ['', '/about', '/contact', '/blog'];
        for (const p of staticPages) {
            urlList.push(`${SITE_URL}${buildPath(country, p)}`);
        }

        // Category Pages
        for (const c of categories) {
            urlList.push(`${SITE_URL}${buildPath(country, `/products?category=${c.slug}`)}`);
        }

        // Product Pages
        for (const p of products) {
            urlList.push(`${SITE_URL}${buildPath(country, `/products/${p.slug}`)}`);
        }
    }

    // IndexNow limit is 10,000 URLs per request
    const batchList = urlList.slice(0, 10000);

    // 4. Submit to IndexNow API
    try {
        const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                host: new URL(SITE_URL).hostname,
                key: INDEXNOW_KEY,
                keyLocation: INDEXNOW_KEY_LOCATION,
                urlList: batchList,
            }),
        });

        if (response.status === 200) {
            return NextResponse.json({
                success: true,
                message: 'URLs submitted successfully to IndexNow',
                urlsCount: batchList.length,
            });
        } else {
            const errText = await response.text();
            console.error('[IndexNow] API responded with error:', response.status, errText);
            return NextResponse.json({
                success: false,
                error: `IndexNow API error: ${response.status}`,
                details: errText,
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[IndexNow] Submission failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to connect to IndexNow API',
        }, { status: 500 });
    }
}

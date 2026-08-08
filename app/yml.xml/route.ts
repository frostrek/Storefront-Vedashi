import { API_URL } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

/**
 * Yandex Market Language (YML) product feed.
 *
 * Spec: https://yandex.ru/support/market/yml-fields.html
 *
 * This route fetches products and categories from the backend sitemap
 * endpoints and outputs valid YML XML that can be submitted to
 * Yandex.Market via the Yandex.Webmaster panel.
 */

interface SitemapProduct {
    product_id: string;
    slug: string;
    product_name: string;
    short_description?: string;
    description?: string;
    price?: number;
    original_price?: number;
    category_id?: string;
    category_name?: string;
    category_slug?: string;
    brand?: string;
    thumbnail_url?: string;
    images?: string[];
    stock_quantity?: number;
    is_active?: boolean;
    updated_at?: string;
    sku?: string;
    variants?: Array<{
        price?: number;
        stock_quantity?: number;
        variant_sku?: string;
    }>;
}

interface SitemapCategory {
    category_id: string;
    name: string;
    slug: string;
    full_path?: string;
    parent_id?: string;
}

const escapeXml = (str: string): string =>
    str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const stripHtml = (html: string): string =>
    html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export async function GET() {
    try {
        const [pRes, cRes] = await Promise.all([
            fetch(`${API_URL}/api/sitemap/products`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/api/sitemap/categories`, { next: { revalidate: 3600 } }),
        ]);

        const products: SitemapProduct[] = pRes.ok ? await pRes.json() : [];
        const categories: SitemapCategory[] = cRes.ok ? await cRes.json() : [];

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        // ── Build YML XML ──────────────────────────────────────────
        let yml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        yml += `<!DOCTYPE yml_catalog SYSTEM "shops.dtd">\n`;
        yml += `<yml_catalog date="${now}">\n`;
        yml += `  <shop>\n`;
        yml += `    <name>${escapeXml(RU_DICTIONARY.yml.shopName)}</name>\n`;
        yml += `    <company>${escapeXml(RU_DICTIONARY.yml.companyName)}</company>\n`;
        yml += `    <url>${SITE_URL}</url>\n`;

        // Currencies
        yml += `    <currencies>\n`;
        yml += `      <currency id="RUB" rate="1"/>\n`;
        yml += `    </currencies>\n`;

        // Categories
        yml += `    <categories>\n`;
        for (const cat of categories) {
            const parentAttr = cat.parent_id ? ` parentId="${escapeXml(cat.parent_id)}"` : '';
            yml += `      <category id="${escapeXml(cat.category_id)}"${parentAttr}>${escapeXml(cat.name)}</category>\n`;
        }
        yml += `    </categories>\n`;

        // Offers (products)
        yml += `    <offers>\n`;
        for (const p of products) {
            // Skip products without a price
            const price = p.variants?.[0]?.price || p.price;
            if (!price || price <= 0) continue;

            const inStock = (p.variants?.[0]?.stock_quantity ?? p.stock_quantity ?? 0) > 0;
            const productUrl = `${SITE_URL}${ROUTES.tovar(p.slug || p.product_id)}`;
            const description = stripHtml(p.short_description || p.description || p.product_name).slice(0, 3000);

            yml += `      <offer id="${escapeXml(p.product_id)}" available="${inStock}">\n`;
            yml += `        <url>${escapeXml(productUrl)}</url>\n`;
            yml += `        <price>${price}</price>\n`;

            // Old price (if on sale)
            if (p.original_price && p.original_price > price) {
                yml += `        <oldprice>${p.original_price}</oldprice>\n`;
            }

            yml += `        <currencyId>RUB</currencyId>\n`;

            // Category
            if (p.category_id) {
                yml += `        <categoryId>${escapeXml(p.category_id)}</categoryId>\n`;
            } else if (categories.length > 0) {
                // Attempt to match by category_slug or category_name
                const matchedCat = categories.find(
                    c => c.slug === p.category_slug || c.name === p.category_name
                );
                if (matchedCat) {
                    yml += `        <categoryId>${escapeXml(matchedCat.category_id)}</categoryId>\n`;
                }
            }

            // Images
            const images: string[] = [];
            if (p.thumbnail_url) images.push(p.thumbnail_url);
            if (p.images) images.push(...p.images);
            // Deduplicate and limit to 10
            const uniqueImages = [...new Set(images)].slice(0, 10);
            for (const img of uniqueImages) {
                yml += `        <picture>${escapeXml(img)}</picture>\n`;
            }

            yml += `        <name>${escapeXml(p.product_name)}</name>\n`;

            if (p.brand) {
                yml += `        <vendor>${escapeXml(p.brand)}</vendor>\n`;
            }

            if (description) {
                yml += `        <description>${escapeXml(description)}</description>\n`;
            }

            if (p.sku || p.variants?.[0]?.variant_sku) {
                yml += `        <vendorCode>${escapeXml(p.sku || p.variants![0].variant_sku!)}</vendorCode>\n`;
            }

            yml += `      </offer>\n`;
        }
        yml += `    </offers>\n`;

        yml += `  </shop>\n`;
        yml += `</yml_catalog>`;

        return new Response(yml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('[YML Feed] Error:', error);
        return new Response('Error generating YML feed', { status: 500 });
    }
}

import { Metadata } from 'next';
import { generateBreadcrumbJsonLd, generateCollectionPageJsonLd } from '@/lib/seo';
import { getCategories, getFilteredProducts } from '@/lib/api';
import ProductsClientPage from './ProductsClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const sParams = await searchParams;
    const categorySlug = typeof sParams.category === 'string' ? sParams.category : undefined;
    
    // Fetch categories to find the display name
    const categories = await getCategories(true);
    const findCategory = (cats: any[], slug: string): any => {
        for (const cat of cats) {
            if (cat.slug === slug) return cat;
            if (cat.children) {
                const found = findCategory(cat.children, slug);
                if (found) return found;
            }
        }
        return null;
    };

    const category = categorySlug ? findCategory(categories, categorySlug) : null;
    const categoryName = category ? category.name : null;

    const title = categoryName 
        ? RU_DICTIONARY.plp.seo.buyOnline.replace('{category}', categoryName) 
        : RU_DICTIONARY.plp.seo.allProductsTitle;
    
    const description = categoryName
        ? RU_DICTIONARY.plp.seo.categoryDesc.replace('{category}', categoryName)
        : RU_DICTIONARY.plp.seo.allProductsDesc;

    // Flat Russian URL — no country prefix per developer architecture
    const canonicalPath = categorySlug ? `/katalog?category=${categorySlug}` : '/katalog';
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'ru-RU': canonicalUrl,
                'x-default': canonicalUrl
            }
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            locale: 'ru_RU',
        }
    };
}

export default async function ProductsPage({ searchParams }: Props) {
    const sParams = await searchParams;
    const categorySlug = typeof sParams.category === 'string' ? sParams.category : undefined;

    // Fetch categories to find the display name for breadcrumbs
    const categories = await getCategories(true);
    const findCategory = (cats: any[], slug: string): any => {
        for (const cat of cats) {
            if (cat.slug === slug) return cat;
            if (cat.children) {
                const found = findCategory(cat.children, slug);
                if (found) return found;
            }
        }
        return null;
    };
    const category = categorySlug ? findCategory(categories, categorySlug) : null;

    const breadcrumbItems = [
        { name: RU_DICTIONARY.nav.home, url: SITE_URL },
        { name: RU_DICTIONARY.nav.products, url: `${SITE_URL}/katalog` }
    ];

    if (category) {
        breadcrumbItems.push({ 
            name: category.name, 
            url: `${SITE_URL}/katalog?category=${category.slug}` 
        });
    }

    const breadcrumbs = generateBreadcrumbJsonLd(breadcrumbItems);

    // Fetch initial products for CollectionPage schema
    const { data: products } = await getFilteredProducts({ category: categorySlug, limit: 12 });
    
    const collectionSchema = generateCollectionPageJsonLd(
        category ? category.name : RU_DICTIONARY.plp.seo.allProductsTitle,
        category ? `${SITE_URL}/katalog?category=${category.slug}` : `${SITE_URL}/katalog`,
        products.map(p => ({
            name: p.product_name,
            url: `${SITE_URL}/tovar/${p.slug || p.product_id}`,
            image: p.thumbnail_url || (p.images && p.images[0]) || '',
            price: p.price
        }))
    );

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
            />
            <ProductsClientPage />
        </>
    );
}


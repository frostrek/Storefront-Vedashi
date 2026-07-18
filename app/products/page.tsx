import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCategories } from '@/lib/api';
import ProductsClientPage from './ProductsClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashi.com';

type Props = {
    params: Promise<{ country: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { country } = await params;
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

    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        const query = categorySlug ? `?category=${categorySlug}` : '';
        languages[locale] = `${SITE_URL}/${c}/katalog${query}`;
    });
    languages['x-default'] = `${SITE_URL}/in/katalog${categorySlug ? `?category=${categorySlug}` : ''}`;

    const title = categoryName 
        ? RU_DICTIONARY.plp.seo.buyOnline.replace('{category}', categoryName) 
        : RU_DICTIONARY.plp.seo.allProductsTitle;
    
    const description = categoryName
        ? RU_DICTIONARY.plp.seo.categoryDesc.replace('{category}', categoryName)
        : RU_DICTIONARY.plp.seo.allProductsDesc;

    const canonicalPath = categorySlug ? `/katalog?category=${categorySlug}` : '/katalog';

    return {
        title,
        description,
        alternates: {
            canonical: `${SITE_URL}/${country}${canonicalPath}`,
            languages: languages
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${country}${canonicalPath}`,
        }
    };
}

export default async function ProductsPage({ params, searchParams }: Props) {
    const { country } = await params;
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
        { name: 'Home', url: `${SITE_URL}/${country}` },
        { name: 'Products', url: `${SITE_URL}/${country}/katalog` }
    ];

    if (category) {
        breadcrumbItems.push({ 
            name: category.name, 
            url: `${SITE_URL}/${country}/katalog?category=${category.slug}` 
        });
    }

    const breadcrumbs = generateBreadcrumbJsonLd(breadcrumbItems);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <ProductsClientPage />
        </>
    );
}

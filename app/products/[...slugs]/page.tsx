import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCategories } from '@/lib/api';
import ProductsClientPage from '../ProductsClient';
import { RU_DICTIONARY } from '@/content/ru';
import { ROUTES } from '@/lib/routes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

type Props = {
    params: Promise<{ country: string, slugs: string[] }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, slugs } = await params;
    const fullPath = slugs.join('/');

    // Fetch category from API using the full path
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/categories/path/${fullPath}`);
    const category = res.ok ? (await res.json()).data : null;
    const categoryName = category ? category.name : null;

    const languages: Record<string, string> = {};
    Object.keys(SUPPORTED_COUNTRIES).forEach((c) => {
        const locale = SUPPORTED_COUNTRIES[c as keyof typeof SUPPORTED_COUNTRIES].locale;
        languages[locale] = `${SITE_URL}/${c}/katalog/${fullPath}`;
    });
    languages['x-default'] = `${SITE_URL}/in/katalog/${fullPath}`;

    const title = categoryName 
        ? RU_DICTIONARY.plp.seo.buyOnline.replace('{category}', categoryName) 
        : RU_DICTIONARY.plp.seo.allProductsTitle;
    
    const description = categoryName
        ? RU_DICTIONARY.plp.seo.categoryDesc.replace('{category}', categoryName)
        : RU_DICTIONARY.plp.seo.allProductsDesc;

    return {
        title,
        description,
        alternates: {
            canonical: `${SITE_URL}/${country}/katalog/${fullPath}`,
            languages: languages
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${country}/katalog/${fullPath}`,
        }
    };
}

export default async function CategoryPage({ params }: Props) {
    const { country, slugs } = await params;
    const fullPath = slugs.join('/');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/categories/path/${fullPath}`);
    const categoryData = res.ok ? (await res.json()).data : null;

    const breadcrumbItems = [
        { name: RU_DICTIONARY.nav.home, url: `${SITE_URL}/${country}` },
        { name: RU_DICTIONARY.nav.products, url: `${SITE_URL}/${country}/katalog` }
    ];

    if (categoryData) {
        breadcrumbItems.push({ 
            name: categoryData.name, 
            url: `${SITE_URL}/${country}/katalog/${fullPath}` 
        });
    }

    const breadcrumbs = generateBreadcrumbJsonLd(breadcrumbItems);

    let categoryContext = {};
    if (slugs.length === 1) categoryContext = { category: slugs[0] };
    if (slugs.length === 2) categoryContext = { category: slugs[0], sub_category: slugs[1] };
    if (slugs.length === 3) categoryContext = { category: slugs[0], sub_category: slugs[1], sub_sub_category: slugs[2] };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <ProductsClientPage categoryContext={categoryContext} />
        </>
    );
}

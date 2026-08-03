import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import SearchClientPage from './SearchClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    
    return {
        title: 'Search Products',
        description: 'Search and filter our collection of authentic Indian wellness, spices, and beauty products.',
        alternates: {
            canonical: `${SITE_URL}/${country}/search`,
            languages: Object.keys(SUPPORTED_COUNTRIES).reduce((acc, code) => {
                acc[code] = `${SITE_URL}/${code}/search`;
                return acc;
            }, {} as Record<string, string>),
        },
    };
}

export default async function SearchPage({ params }: { params: Promise<{ country: string }> }) {
    return (
        <>
            <SearchClientPage />
        </>
    );
}

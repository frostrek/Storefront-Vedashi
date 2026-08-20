import { Metadata } from 'next';
import SearchClientPage from './SearchClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

import { RU_DICTIONARY } from '@/content/ru';

export const metadata: Metadata = {
    title: RU_DICTIONARY.globalSeo.search.meta.title,
    description: RU_DICTIONARY.globalSeo.search.meta.description,
    alternates: {
        canonical: `${SITE_URL}/poisk`,
        languages: {
            'ru-RU': `${SITE_URL}/poisk`,
            'x-default': `${SITE_URL}/poisk`,
        },
    },
    robots: { index: false, follow: true }, // Search result pages should not be indexed
};

export default async function SearchPage() {
    return (
        <>
            <SearchClientPage />
        </>
    );
}

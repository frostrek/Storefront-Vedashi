'use client';

import BlogNewsletterCard from './BlogNewsletterCard';
import TrendingList from './TrendingList';
import QuoteBlock from './QuoteBlock';

export default function BlogSidebar() {
    return (
        <aside className="space-y-10 lg:w-[320px] shrink-0">
            <BlogNewsletterCard />
            <TrendingList />
            <QuoteBlock />
        </aside>
    );
}

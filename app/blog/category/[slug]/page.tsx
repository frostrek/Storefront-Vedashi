import { Metadata } from 'next';
import { getBlogPostsByCategory } from '@/lib/api';
import BlogCategoryClient from '@/components/blog/BlogCategoryClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const categoryUrl = `${SITE_URL}/blog/category/${slug}`;

    const title = RU_DICTIONARY.blog.seo.categoryTitleTemplate.replace('{category}', categoryName);
    const description = RU_DICTIONARY.blog.seo.categoryDescriptionTemplate.replace('{category}', categoryName);
    const ogDescription = RU_DICTIONARY.blog.seo.categoryOgDescriptionTemplate.replace('{category}', categoryName);

    return {
        title,
        description,
        alternates: {
            canonical: categoryUrl,
        },
        openGraph: {
            title,
            description: ogDescription,
            url: categoryUrl,
            siteName: 'Vedashi Herbals',
            locale: 'ru_RU',
            type: 'website',
        },
    };
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const res = await getBlogPostsByCategory(slug, { limit: 12 });
    const posts = res.posts || [];

    return (
        <BlogCategoryClient
            initialPosts={posts}
            categorySlug={slug}
            categoryName={categoryName}
            initialNextCursor={res.nextCursor}
            initialHasMore={res.hasMore}
        />
    );
}

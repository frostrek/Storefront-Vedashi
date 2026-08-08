import { Metadata } from 'next';
import { getBlogPosts, getFeaturedBlogPosts, getBlogCategories } from '@/lib/api';
import BlogListingClient from '@/components/blog/BlogListingClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: RU_DICTIONARY.blog.seo.listingTitle,
    description: RU_DICTIONARY.blog.seo.listingDescription,
    alternates: {
        canonical: `${SITE_URL}/blog`,
    },
    openGraph: {
        title: RU_DICTIONARY.blog.seo.listingTitle,
        description: RU_DICTIONARY.blog.seo.listingOgDescription,
        url: `${SITE_URL}/blog`,
        siteName: 'Vedashi Herbals',
        locale: 'ru_RU',
        type: 'website',
    },
};

export default async function BlogPage() {
    const [postsRes, featuredRes, catsRes] = await Promise.all([
        getBlogPosts({ limit: 50 }),
        getFeaturedBlogPosts(1),
        getBlogCategories(),
    ]);

    const posts = postsRes.posts || [];
    const featuredPost = featuredRes?.[0] || null;
    const categories = catsRes || [];

    return (
        <BlogListingClient
            initialPosts={posts}
            featuredPost={featuredPost}
            categories={categories}
        />
    );
}

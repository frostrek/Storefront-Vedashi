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
        <>
            <h1 className="sr-only">{RU_DICTIONARY.blog.seo.listingTitle}</h1>
            <BlogListingClient
                initialPosts={posts}
                featuredPost={featuredPost}
                categories={categories}
            />
            {/* Server-rendered content for AI crawlers & screen readers */}
            <section className="sr-only" aria-label="Блог Vedashi Herbals">
                <h2>Блог Vedashi Herbals — Аюрведа, здоровье и натуральный уход</h2>
                <p>Блог Vedashi Herbals (ООО ВЕДАШИ ХЕРБАЛС) — статьи об аюрведе, здоровом образе жизни, натуральной косметике и травяных средствах. Советы экспертов по уходу за кожей, волосами и здоровью с использованием натуральных ингредиентов из Индии.</p>
                {posts.length > 0 && (
                    <ul>
                        {posts.slice(0, 20).map((post: any) => (
                            <li key={post.slug}>
                                <a href={`${SITE_URL}/blog/${post.slug}`}>{post.title}</a>
                                {post.excerpt && <p>{post.excerpt}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

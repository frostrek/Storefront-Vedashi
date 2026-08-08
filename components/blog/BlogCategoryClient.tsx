'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getBlogPostsByCategory, BlogPost } from '@/lib/api';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { RU_DICTIONARY } from '@/content/ru';

interface BlogCategoryClientProps {
    initialPosts: BlogPost[];
    categorySlug: string;
    categoryName: string;
    initialNextCursor: string | null;
    initialHasMore: boolean;
}

export default function BlogCategoryClient({
    initialPosts,
    categorySlug,
    categoryName,
    initialNextCursor,
    initialHasMore,
}: BlogCategoryClientProps) {
    const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
    const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const res = await getBlogPostsByCategory(categorySlug, { cursor: nextCursor, limit: 12 });
        setPosts(prev => [...prev, ...(res.posts || [])]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setLoadingMore(false);
    };

    const dict = RU_DICTIONARY.blog;

    const articleWord = (count: number) => {
        if (count === 1) return dict.category.articleOne;
        if (count >= 2 && count <= 4) return dict.category.articleFew;
        return dict.category.articleMany;
    };

    return (
        <div className="min-h-screen bg-cream">
            {/* Category Header */}
            <section className="relative py-14 md:py-20">
                <div className="absolute inset-0 herbal-gradient opacity-95" />
                <div className="relative max-w-6xl mx-auto px-4 text-center">
                    <nav className="flex items-center justify-center gap-2 text-sm text-white/60 mb-4">
                        <Link href="/blog" className="hover:text-white transition-colors">{dict.detail.blog}</Link>
                        <span>/</span>
                        <span className="text-white">{categoryName}</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        {categoryName}
                    </h1>
                    <p className="text-white/60 text-sm">
                        {posts.length} {articleWord(posts.length)}
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-10">
                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-warm-gray text-lg mb-4">{dict.category.noPosts}</p>
                        <Link href="/blog" className="text-burgundy font-semibold hover:underline">{dict.category.allPosts}</Link>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map(post => (
                                <BlogPostCard key={post.post_id} post={post} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="text-center mt-10">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="px-8 py-3 rounded-full bg-white border border-light-border text-charcoal font-medium hover:border-burgundy/30 hover:text-burgundy transition-all duration-300 disabled:opacity-50"
                                >
                                    {loadingMore ? dict.category.loadingMore : dict.category.showMore}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

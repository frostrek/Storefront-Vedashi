'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getBlogPostsByCategory, BlogPost } from '@/lib/api';
import BlogPostCard from '@/components/blog/BlogPostCard';

export default function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const categoryName = resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await getBlogPostsByCategory(resolvedParams.slug, { limit: 12 });
            setPosts(res.posts || []);
            setNextCursor(res.nextCursor);
            setHasMore(res.hasMore);
            setLoading(false);
        })();
    }, [resolvedParams.slug]);

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const res = await getBlogPostsByCategory(resolvedParams.slug, { cursor: nextCursor, limit: 12 });
        setPosts(prev => [...prev, ...(res.posts || [])]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setLoadingMore(false);
    };

    return (
        <div className="min-h-screen bg-cream">
            {/* Category Header */}
            <section className="relative py-14 md:py-20">
                <div className="absolute inset-0 wine-gradient opacity-95" />
                <div className="relative max-w-6xl mx-auto px-4 text-center">
                    <nav className="flex items-center justify-center gap-2 text-sm text-white/60 mb-4">
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <span>/</span>
                        <span className="text-white">{categoryName}</span>
                    </nav>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
                        {categoryName}
                    </h1>
                    <p className="text-white/60 text-sm">
                        {posts.length} article{posts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-10">
                {loading ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="rounded-2xl border border-light-border bg-white overflow-hidden">
                                <div className="h-52 bg-cream-dark animate-shimmer" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 w-3/4 bg-cream-dark animate-shimmer rounded" />
                                    <div className="h-4 w-full bg-cream-dark animate-shimmer rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-warm-gray text-lg mb-4">No articles in this category yet.</p>
                        <Link href="/blog" className="text-burgundy font-semibold hover:underline">← Back to all posts</Link>
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
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

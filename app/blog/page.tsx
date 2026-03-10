'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBlogPosts, getFeaturedBlogPosts, getBlogCategories, getPopularBlogTags, BlogPost, BlogCategory, BlogTag } from '@/lib/api';
import BlogPostCard from '@/components/blog/BlogPostCard';

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [featured, setFeatured] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [postsRes, featuredRes, categoriesRes, tagsRes] = await Promise.all([
                getBlogPosts({ limit: 9 }),
                getFeaturedBlogPosts(3),
                getBlogCategories(),
                getPopularBlogTags(12),
            ]);
            setPosts(postsRes.posts);
            setNextCursor(postsRes.nextCursor);
            setHasMore(postsRes.hasMore);
            setFeatured(featuredRes);
            setCategories(categoriesRes);
            setTags(tagsRes);
            setLoading(false);
        })();
    }, []);

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const res = await getBlogPosts({ cursor: nextCursor, limit: 9 });
        setPosts(prev => [...prev, ...res.posts]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setLoadingMore(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-cream pt-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="h-8 w-48 bg-cream-dark animate-shimmer rounded mb-8" />
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="rounded-2xl border border-light-border bg-white overflow-hidden">
                                <div className="h-52 bg-cream-dark animate-shimmer" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 w-3/4 bg-cream-dark animate-shimmer rounded" />
                                    <div className="h-4 w-full bg-cream-dark animate-shimmer rounded" />
                                    <div className="h-4 w-2/3 bg-cream-dark animate-shimmer rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream">
            {/* ── Hero Section ───────────────────────────────────── */}
            <section className="relative overflow-hidden py-16 md:py-24">
                <div className="absolute inset-0 wine-gradient opacity-95" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23C9A96E\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
                />
                <div className="relative max-w-6xl mx-auto px-4 text-center">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
                        Wine Journal
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Discover wine guides, food pairings, vineyard stories, and tasting notes from our sommeliers.
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
                {/* ── Featured Posts ────────────────────────────────── */}
                {featured.length > 0 && (
                    <section className="mb-12">
                        <div className="grid md:grid-cols-3 gap-4">
                            {featured.map((post, i) => (
                                <BlogPostCard key={post.post_id} post={post} featured={i === 0} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Category Pills ───────────────────────────────── */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === 'all'
                                ? 'bg-burgundy text-white shadow-md shadow-burgundy/20'
                                : 'bg-white border border-light-border text-charcoal hover:border-burgundy/30 hover:text-burgundy'
                                }`}
                        >
                            All Posts
                        </button>
                        {categories.map(cat => (
                            <Link
                                key={cat.category_id}
                                href={`/blog/category/${cat.slug}`}
                                className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-light-border text-charcoal hover:border-burgundy/30 hover:text-burgundy transition-all duration-300"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── Post Grid + Sidebar ──────────────────────────── */}
                <div className="grid lg:grid-cols-[1fr_280px] gap-8">
                    {/* Posts Grid */}
                    <div>
                        {posts.length === 0 ? (
                            <div className="text-center py-16">
                                <svg className="w-16 h-16 text-warm-gray/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                <p className="text-warm-gray">No posts published yet. Check back soon!</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {posts.map(post => (
                                    <BlogPostCard key={post.post_id} post={post} />
                                ))}
                            </div>
                        )}

                        {/* Load More */}
                        {hasMore && (
                            <div className="text-center mt-10">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="px-8 py-3 rounded-full bg-white border border-light-border text-charcoal font-medium hover:border-burgundy/30 hover:text-burgundy transition-all duration-300 disabled:opacity-50"
                                >
                                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Popular Tags */}
                        {tags.length > 0 && (
                            <div className="rounded-2xl border border-light-border bg-white p-5">
                                <h3 className="font-serif text-lg font-bold text-charcoal mb-4">Popular Topics</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <Link
                                            key={tag.tag_id}
                                            href={`/blog/tag/${tag.slug}`}
                                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-dark text-charcoal border border-light-border hover:border-burgundy/30 hover:text-burgundy hover:bg-burgundy/5 transition-all duration-300"
                                        >
                                            #{tag.name}
                                            {tag.post_count != null && <span className="ml-1 text-warm-gray/60">({tag.post_count})</span>}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Newsletter CTA */}
                        <div className="rounded-2xl overflow-hidden">
                            <div className="wine-gradient p-6 text-center">
                                <h3 className="font-serif text-lg font-bold text-white mb-2">Stay Updated</h3>
                                <p className="text-white/70 text-sm mb-4">Get the latest wine guides and tasting notes delivered to your inbox.</p>
                                <div className="space-y-2">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full rounded-lg px-4 py-2.5 text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-wine-gold focus:outline-none"
                                    />
                                    <button className="w-full rounded-lg py-2.5 text-sm font-semibold bg-wine-gold text-charcoal hover:bg-wine-gold-light transition-colors">
                                        Subscribe
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="h-16" />
        </div>
    );
}

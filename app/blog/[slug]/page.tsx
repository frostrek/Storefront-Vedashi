'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getBlogPostBySlug, getRelatedBlogPosts, getBlogComments, recordBlogView, BlogPost, BlogComment } from '@/lib/api';
import SocialShareBar from '@/components/blog/SocialShareBar';
import BlogCommentSection from '@/components/blog/BlogCommentSection';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { generateBlogPostingJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { RU_DICTIONARY } from '@/content/ru';

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [related, setRelated] = useState<BlogPost[]>([]);
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const p = await getBlogPostBySlug(resolvedParams.slug);
            setPost(p);
            if (p) {
                recordBlogView(p.post_id);
                const [rel, comm] = await Promise.all([
                    getRelatedBlogPosts(p.post_id, 3),
                    getBlogComments(p.post_id),
                ]);
                setRelated(rel);
                setComments(comm);
            }
            setLoading(false);
        })();
    }, [resolvedParams.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-8">
                <div className="max-w-3xl mx-auto px-4 space-y-6">
                    <div className="h-6 w-32 bg-gray-100 animate-shimmer rounded" />
                    <div className="h-10 w-3/4 bg-gray-100 animate-shimmer rounded" />
                    <div className="h-64 bg-gray-100 animate-shimmer rounded-2xl" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-4 bg-gray-100 animate-shimmer rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-charcoal mb-3">{RU_DICTIONARY.blog.detail.notFoundTitle}</h1>
                    <p className="text-warm-gray mb-6">{RU_DICTIONARY.blog.detail.notFoundDesc}</p>
                    <Link href="/blog" className="px-6 py-3 rounded-full bg-burgundy text-white font-semibold hover:bg-burgundy-dark transition-colors">
                        {RU_DICTIONARY.blog.detail.backToBlog}
                    </Link>
                </div>
            </div>
        );
    }

    const publishDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';

    const categoryName = post.category_name
        ? ((RU_DICTIONARY.blog.categoriesMap as Record<string, string>)[post.category_name] || post.category_name)
        : null;

    return (
        <div className="min-h-screen bg-white">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBlogPostingJsonLd(post)) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateBreadcrumbJsonLd([
                        { name: RU_DICTIONARY.about.breadcrumbs.home || 'Home', url: '/' },
                        { name: RU_DICTIONARY.blog.detail.blog, url: '/blog' },
                        { name: categoryName || 'Category', url: `/blog/category/${post.category_slug}` },
                        { name: post.title, url: `/blog/${post.slug}` },
                    ]))
                }}
            />
            {/* ── Header ──────────────────────────────────────────── */}
            <article className="max-w-3xl mx-auto px-4 pt-8 pb-16">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-warm-gray mb-6">
                    <Link href="/blog" className="hover:text-burgundy transition-colors">{RU_DICTIONARY.blog.detail.blog}</Link>
                    <span>/</span>
                    {categoryName && (
                        <>
                            <Link href={`/blog/category/${post.category_slug}`} className="hover:text-burgundy transition-colors">{categoryName}</Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-charcoal truncate max-w-[200px]">{post.title}</span>
                </nav>

                {/* Category + Blog Type */}
                <div className="flex items-center gap-3 mb-4">
                    {categoryName && (
                        <Link href={`/blog/category/${post.category_slug}`} className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-burgundy/10 text-burgundy hover:bg-burgundy/20 transition-colors">
                            {categoryName}
                        </Link>
                    )}
                    {post.blog_type && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-warm-gray border border-light-border">
                            {post.blog_type.replace(/_/g, ' ')}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-4 animate-fade-in-up">
                    {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                    <p className="text-lg text-warm-gray leading-relaxed mb-6">{post.excerpt}</p>
                )}

                {/* Author & Meta */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-light-border">
                    <div className="w-11 h-11 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy font-bold text-lg flex-shrink-0">
                        {post.author_avatar ? (
                            <img src={post.author_avatar} alt={post.author_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            post.author_name?.charAt(0) || '?'
                        )}
                    </div>
                    <div>
                        {post.author_name && <p className="text-sm font-semibold text-charcoal">{post.author_name}</p>}
                        <div className="flex items-center gap-2 text-xs text-warm-gray">
                            {publishDate && <span>{publishDate}</span>}
                            {post.reading_time && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-warm-gray/40" />
                                    <span>{post.reading_time} {RU_DICTIONARY.blog.meta.minRead}</span>
                                </>
                            )}
                            {(post.view_count ?? 0) > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-warm-gray/40" />
                                    <span>{post.view_count?.toLocaleString()} {RU_DICTIONARY.blog.meta.views}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="ml-auto">
                        <SocialShareBar shareUrls={post.share_urls} postId={post.post_id} title={post.title} />
                    </div>
                </div>

                {/* Hero Image – use featured_image first (same source as the card thumbnail) */}
                {(post.featured_image || post.cover_image) && (
                    <div className="rounded-2xl overflow-hidden mb-8 border border-light-border">
                        <img 
                            src={post.featured_image || post.cover_image!} 
                            alt={post.title} 
                            className="w-full h-auto" 
                            onError={(e) => { e.currentTarget.src = '/hero-ayurveda.png'; }}
                        />
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map(tag => (
                            <Link
                                key={tag.tag_id}
                                href={`/blog/tag/${tag.slug}`}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-charcoal border border-light-border hover:border-burgundy/30 hover:text-burgundy transition-all"
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Article Body */}
                <div
                    className="prose prose-lg max-w-none text-charcoal/90 leading-relaxed
                        prose-headings:prose-headings:text-charcoal
                        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                        prose-p:mb-5
                        prose-a:text-burgundy prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-burgundy/40 prose-blockquote:bg-gray-100 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-5
                        prose-img:rounded-xl prose-img:border prose-img:border-light-border
                        prose-strong:text-charcoal"
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />

                {/* Bottom Share Bar */}
                <div className="mt-10 pt-6 border-t border-light-border">
                    <SocialShareBar shareUrls={post.share_urls} postId={post.post_id} title={post.title} />
                </div>

                {/* Author Bio */}
                {post.author_bio && (
                    <div className="mt-8 rounded-2xl border border-light-border bg-white p-6 flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy font-bold text-xl flex-shrink-0">
                            {post.author_avatar ? (
                                <img src={post.author_avatar} alt={post.author_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                post.author_name?.charAt(0) || '?'
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-charcoal mb-1">{RU_DICTIONARY.blog.detail.aboutAuthor} {post.author_name}</p>
                            <p className="text-sm text-warm-gray leading-relaxed">{post.author_bio}</p>
                        </div>
                    </div>
                )}

                {/* Related Posts */}
                {related.length > 0 && (
                    <section className="mt-12">
                        <h3 className="text-xl font-bold text-charcoal mb-6">{RU_DICTIONARY.blog.detail.youMightLike}</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {related.map(p => (
                                <BlogPostCard key={p.post_id} post={p} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Comments */}
                <BlogCommentSection postId={post.post_id} initialComments={comments} />
            </article>
        </div>
    );
}

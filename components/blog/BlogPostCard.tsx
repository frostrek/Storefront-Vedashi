'use client';

import Link from 'next/link';
import { BlogPost } from '@/lib/api';

interface BlogPostCardProps {
    post: BlogPost;
    featured?: boolean;
}

export default function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
    const date = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <Link
            href={`/blog/${post.slug}`}
            className={`group block rounded-2xl border border-light-border bg-white overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-burgundy/5 hover:-translate-y-1 ${featured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''}`}
        >
            {/* Cover Image */}
            <div className={`relative overflow-hidden bg-cream-dark ${featured ? 'md:h-full h-52' : 'h-52'}`}>
                {post.featured_image || post.cover_image ? (
                    <img
                        src={post.featured_image || post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.src = '/hero-ayurveda.png'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-herbal-green/10 to-vedic-gold/10">
                        <svg className="w-12 h-12 text-burgundy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                )}

                {/* Category Badge */}
                {post.category_name && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-burgundy/90 text-white backdrop-blur-sm">
                        {post.category_name}
                    </span>
                )}

                {/* Blog Type Badge */}
                {post.blog_type && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-medium bg-white/90 text-charcoal backdrop-blur-sm">
                        {post.blog_type.replace(/_/g, ' ')}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className={`p-5 ${featured ? 'flex flex-col justify-center' : ''}`}>
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map(tag => (
                            <span key={tag.tag_id} className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-cream-dark text-warm-gray border border-light-border">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h3 className={`font-serif font-bold text-charcoal group-hover:text-burgundy transition-colors duration-300 leading-snug ${featured ? 'text-xl md:text-2xl mb-3' : 'text-lg mb-2'}`}>
                    {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                    <p className={`text-warm-gray leading-relaxed ${featured ? 'line-clamp-3 text-sm' : 'line-clamp-2 text-sm'}`}>
                        {post.excerpt}
                    </p>
                )}

                {/* Meta Row */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-light-border/60">
                    {/* Author */}
                    {post.author_name && (
                        <span className="text-xs font-medium text-charcoal/80">{post.author_name}</span>
                    )}

                    {date && (
                        <>
                            <span className="w-[3px] h-[3px] rounded-full bg-warm-gray/40" />
                            <span className="text-xs text-warm-gray">{date}</span>
                        </>
                    )}

                    {post.reading_time && (
                        <>
                            <span className="w-[3px] h-[3px] rounded-full bg-warm-gray/40" />
                            <span className="text-xs text-warm-gray">{post.reading_time} min read</span>
                        </>
                    )}

                    {/* View count */}
                    {(post.view_count ?? 0) > 0 && (
                        <span className="ml-auto text-xs text-warm-gray/60">{post.view_count?.toLocaleString()} views</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

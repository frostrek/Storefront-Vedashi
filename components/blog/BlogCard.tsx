'use client';

import Link from 'next/link';
import { BlogPost } from '@/lib/api';

interface BlogCardProps {
    post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
    const slug = post.slug || `post-${post.post_id}`;
    const image = post.featured_image || post.cover_image || '/trust-lab.png';
    const categoryName = post.category_name || 'Wellness';
    const readTime = post.reading_time ? `${post.reading_time} min` : '5 min';
    
    return (
        <div className="group flex flex-col pt-4">
            {/* Image Container */}
            <Link 
                href={`/blog/${slug}`}
                className="relative block w-full aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 bg-cream-dark"
            >
                {/* Category Badge - Floating on image */}
                <div className="absolute top-4 right-4 z-10">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/90 text-charcoal backdrop-blur-md shadow-sm">
                        {categoryName}
                    </span>
                </div>
                
                <img 
                    src={image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = '/trust-lab.png'; }}
                />
            </Link>

            {/* Content Container */}
            <div className="flex flex-col flex-1 px-2">
                {/* Meta Header */}
                <div className="flex items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B9F8B]">
                        {post.content_type || 'Article'}
                    </span>
                    <span className="mx-3 w-6 h-[1px] bg-light-border"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-gray">
                        {readTime}
                    </span>
                </div>

                {/* Title */}
                <Link href={`/blog/${slug}`} className="block group-hover:text-burgundy transition-colors duration-300">
                    <h3 className="font-serif text-2xl lg:text-3xl font-bold text-charcoal leading-snug mb-3">
                        {post.title}
                    </h3>
                </Link>

                {/* Excerpt */}
                <p className="text-warm-gray text-sm md:text-base leading-relaxed mb-6 line-clamp-2">
                    {post.excerpt || 'Read this beautiful piece on our Ayurveda wisdom...'}
                </p>

                {/* Keep Reading CTA */}
                <div className="mt-auto">
                    <Link 
                        href={`/blog/${slug}`}
                        className="inline-flex items-center text-sm font-bold tracking-wide text-charcoal group-hover:text-burgundy transition-colors"
                    >
                        Keep Reading
                        <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}

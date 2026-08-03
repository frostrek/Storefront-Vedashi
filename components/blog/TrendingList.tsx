'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBlogPosts, BlogPost } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { RU_DICTIONARY } from '@/content/ru';

export default function TrendingList() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBlogPosts({ limit: 3 }).then(data => {
            setPosts(data.posts || []);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-vedic-gold" />
            </div>
        );
    }

    if (posts.length === 0) return null;

    return (
        <div className="py-2">
            <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-vedic-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h3 className="text-lg font-bold text-charcoal">{RU_DICTIONARY.blog.trending.title}</h3>
            </div>
            
            <ul className="space-y-6">
                {posts.map((post, index) => (
                    <li key={post.post_id} className="group flex gap-4">
                        <span className="text-3xl font-bold text-vedic-gold/50 group-hover:text-vedic-gold transition-colors duration-300">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <Link href={`/blog/${post.slug}`} className="pt-1.5 flex-1">
                            <h4 className="font-sans font-medium text-sm text-charcoal leading-snug group-hover:text-burgundy transition-colors duration-300">
                                {post.title}
                            </h4>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

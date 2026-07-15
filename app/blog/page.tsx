'use client';

import { useState, useEffect } from 'react';
import BlogHeroSection from '@/components/blog/BlogHeroSection';
import BlogCategoryFilters from '@/components/blog/BlogCategoryFilters';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import FallingLeafBackground from '@/components/blog/FallingLeafBackground';
import { getBlogPosts, getFeaturedBlogPosts, getBlogCategories, BlogPost, BlogCategory } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function BlogPage() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
    const [categories, setCategories] = useState<BlogCategory[]>([]);

    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsToShow, setItemsToShow] = useState(6);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // Fetch basic data
                const [postsRes, featuredRes, catsRes] = await Promise.all([
                    getBlogPosts({ limit: 50 }), // Get a good batch for client-side filtering
                    getFeaturedBlogPosts(1),
                    getBlogCategories()
                ]);
                
                setPosts(postsRes.posts || []);
                setFeaturedPost(featuredRes?.[0] || null);
                setCategories(catsRes || []);
            } catch (err) {
                console.error("Failed to fetch blog data", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Filter local blog data
    const filteredBlogs = posts.filter((post) => {
        const matchesCategory = activeCategory === 'All' || post.category_name === activeCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (post.excerpt?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const blogsToRender = filteredBlogs.slice(0, itemsToShow);
    const hasMore = itemsToShow < filteredBlogs.length;

    const loadMore = () => {
        setItemsToShow(prev => prev + 4);
    };

    const categoryNames = categories.map(c => c.name);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-vedic-gold" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white selection:bg-burgundy selection:text-white relative">
            
            <FallingLeafBackground />
            
            <div className="relative z-10 font-sans">
                <BlogHeroSection featuredPost={featuredPost} />

                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <BlogCategoryFilters 
                        categories={categoryNames}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />

                    {/* ── Post Grid + Sidebar ──────────────────────────── */}
                    <div className="mt-12 flex flex-col lg:flex-row gap-12 lg:gap-20 pb-24">
                        
                        {/* Main Posts Area */}
                        <div className="flex-1">
                            {blogsToRender.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[2rem] border border-light-border/40 w-full shadow-sm">
                                    <svg className="w-16 h-16 text-warm-gray/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                    <p className="text-warm-gray text-lg">No wisdom found matching your search.</p>
                                    <button 
                                        onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
                                        className="mt-4 text-vedic-gold hover:text-vedic-gold-light underline underline-offset-4"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-16">
                                    {blogsToRender.map(post => (
                                        <BlogCard key={post.post_id} post={post} />
                                    ))}
                                </div>
                            )}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="text-center mt-20">
                                    <button
                                        onClick={loadMore}
                                        className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal/90 transition-colors duration-300 shadow-xl shadow-charcoal/10"
                                    >
                                        Load More Wisdom
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Component */}
                        <BlogSidebar />
                        
                    </div>
                </div>
            </div>
        </div>
    );
}

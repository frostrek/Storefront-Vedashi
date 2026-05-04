'use client';

import Link from 'next/link';
import { BlogPost } from '@/lib/api';

interface BlogHeroSectionProps {
    featuredPost: BlogPost | null;
}

export default function BlogHeroSection({ featuredPost }: BlogHeroSectionProps) {
    if (!featuredPost) return null;

    const readTime = featuredPost.reading_time ? `${featuredPost.reading_time} min` : '5 min';
    const mainImage = featuredPost.featured_image || featuredPost.cover_image || '/hero-ayurveda.png';
    return (
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left: Image Collage */}
                    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full max-w-2xl mx-auto lg:mx-0">
                        {/* Main large image */}
                        <div className="absolute left-0 top-0 w-2/3 h-5/6 rounded-[2.5rem] overflow-hidden shadow-2xl z-10">
                            <img
                                src={mainImage}
                                alt={featuredPost.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = '/hero-ayurveda.png'; }}
                            />
                        </div>

                        {/* Top right smaller image */}
                        <div className="absolute right-0 top-[5%] w-5/12 h-2/5 rounded-[2rem] overflow-hidden shadow-xl z-20">
                            <img
                                src="/trust-lab.png"
                                alt="Herbal Ingredients"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Bottom right smaller image */}
                        <div className="absolute right-[5%] bottom-[5%] w-[45%] h-[45%] rounded-[2rem] overflow-hidden shadow-xl z-30">
                            <img
                                src="/trust-healing.png"
                                alt="Healing Tea"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Decorative blob/blur behind images */}
                        <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 bg-vedic-gold/20 blur-[80px] rounded-full z-0" />
                    </div>

                    {/* Right: Featured Content */}
                    <div className="flex flex-col justify-center max-w-xl animate-fade-in-up md:pl-8">
                        <div className="mb-6">
                            <span className="inline-block border border-[#91C934] text-[#91C934] font-semibold uppercase tracking-widest text-[10px] sm:text-xs px-4 py-1.5 rounded-full mb-4">
                                Featured Wisdom
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl text-charcoal font-bold leading-[1.15] mb-6">
                            {featuredPost.title}
                        </h1>

                        <p className="text-lg text-warm-gray mb-8 leading-relaxed line-clamp-3">
                            {featuredPost.excerpt || 'Dive into our latest featured wisdom on holistic health.'}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <Link
                                href={`/blog/${featuredPost.slug}`}
                                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#91C934] hover:bg-[#7bb42c] text-white font-medium transition-colors duration-300 shadow-lg shadow-herbal-green/20"
                            >
                                Read Article
                                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>

                            <div className="flex items-center text-sm text-warm-gray font-medium">
                                <svg className="w-5 h-5 mr-2 text-vedic-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {readTime} read
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

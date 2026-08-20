import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug, getRelatedBlogPosts, getBlogComments } from '@/lib/api';
import SocialShareBar from '@/components/blog/SocialShareBar';
import BlogCommentSection from '@/components/blog/BlogCommentSection';
import BlogPostCard from '@/components/blog/BlogPostCard';
import BlogViewTracker from '@/components/blog/BlogViewTracker';
import { generateBlogPostingJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: RU_DICTIONARY.blog.seo.postNotFoundTitle,
            robots: { index: false, follow: true },
        };
    }

    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt || RU_DICTIONARY.blog.seo.postFallbackDescription.replace('{title}', post.title);
    const postUrl = `${SITE_URL}/blog/${post.slug}`;
    const ogImage = post.featured_image || post.cover_image || undefined;

    return {
        title,
        description,
        alternates: {
            canonical: postUrl,
        },
        openGraph: {
            title,
            description,
            url: postUrl,
            siteName: 'Vedashi Herbals',
            locale: 'ru_RU',
            type: 'article',
            publishedTime: post.published_at || undefined,
            authors: post.author_name ? [post.author_name] : undefined,
            section: (post as any).category?.name || (post as any).category || RU_DICTIONARY.globalSeo.blog.defaultSection,
            tags: (post as any).tags ? (Array.isArray((post as any).tags) ? (post as any).tags : (post as any).tags.split(',').map((t: string) => t.trim())) : RU_DICTIONARY.globalSeo.blog.defaultTags,
            images: ogImage ? [ogImage] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ogImage ? [ogImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const [related, comments] = await Promise.all([
        getRelatedBlogPosts(post.post_id, 3),
        getBlogComments(post.post_id),
    ]);

    const publishDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
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
                        { name: RU_DICTIONARY.about.breadcrumbs.home || RU_DICTIONARY.nav.home, url: SITE_URL },
                        { name: RU_DICTIONARY.blog.detail.blog, url: `${SITE_URL}/blog` },
                        ...(categoryName ? [{ name: categoryName, url: `${SITE_URL}/blog/category/${post.category_slug}` }] : []),
                        { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
                    ]))
                }}
            />

            {/* Fire-and-forget view tracking (client-side) */}
            <BlogViewTracker postId={post.post_id} />

            {/* ── Article ──────────────────────────────────────────── */}
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
                    <div className="w-11 h-11 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy font-bold text-lg flex-shrink-0 relative overflow-hidden">
                        {post.author_avatar ? (
                            <Image src={post.author_avatar} alt={post.author_name || ''} fill sizes="44px" className="object-cover" />
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

                {/* Hero Image */}
                {(post.featured_image || post.cover_image) && (
                    <div className="rounded-2xl overflow-hidden mb-8 border border-light-border relative">
                        <Image
                            src={post.featured_image || post.cover_image!}
                            alt={post.title}
                            width={1200}
                            height={630}
                            className="w-full h-auto object-cover"
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
                        <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy font-bold text-xl flex-shrink-0 relative overflow-hidden">
                            {post.author_avatar ? (
                                <Image src={post.author_avatar} alt={post.author_name || ''} fill sizes="56px" className="object-cover" />
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

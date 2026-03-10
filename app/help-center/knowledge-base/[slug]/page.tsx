'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, BookOpen, Eye, Clock, ChevronRight } from 'lucide-react';
import { getKBArticle } from '@/lib/api';

export default function KBArticlePage() {
    const params = useParams();
    const slug = params.slug as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            getKBArticle(slug).then((d) => { setData(d); setLoading(false); });
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2]">
                <div className="max-w-3xl mx-auto px-6 py-20">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="space-y-3 mt-8">
                            {[...Array(8)].map((_, i) => <div key={i} className="h-3 bg-gray-200 rounded"></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data?.article) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Article not found</h2>
                    <Link href="/help-center/knowledge-base" className="text-[#722F37] text-sm font-semibold hover:underline">
                        ← Back to Knowledge Base
                    </Link>
                </div>
            </div>
        );
    }

    const { article, related } = data;

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            <section className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] py-10 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link href="/help-center/knowledge-base" className="inline-flex items-center gap-1 text-[#C6A75E] text-sm mb-4 hover:text-white transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Knowledge Base
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">{article.title}</h1>
                    <div className="flex items-center gap-4 text-xs text-[#C6A75E]/80">
                        {article.category_name && (
                            <span className="bg-white/10 px-2 py-0.5 rounded-full">{article.category_name}</span>
                        )}
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count} views</span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(article.updated_at || article.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-6 py-10">
                <article className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div
                        className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-a:text-[#722F37]"
                        dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
                    />
                </article>

                {/* Related Articles */}
                {related && related.length > 0 && (
                    <div className="mt-10">
                        <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Related Articles</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {related.map((r: any) => (
                                <Link
                                    key={r.article_id}
                                    href={`/help-center/knowledge-base/${r.slug}`}
                                    className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-[#C6A75E]/30 hover:shadow-sm transition-all flex items-center justify-between"
                                >
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#722F37] transition-colors">
                                            {r.title}
                                        </h4>
                                        {r.excerpt && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.excerpt}</p>}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

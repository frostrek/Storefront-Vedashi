'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, BookOpen, Eye, Clock, ChevronRight } from 'lucide-react';
import { getKBArticle } from '@/lib/api';
import { RU_DICTIONARY } from '@/content/ru';
import { ROUTES } from '@/lib/routes';

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
            <div className="min-h-screen bg-[#FDFBF7]">
                <div className="max-w-4xl mx-auto px-6 py-20">
                    <div className="animate-pulse space-y-8">
                        <div className="h-10 bg-gray-100 rounded-2xl w-3/4"></div>
                        <div className="h-4 bg-gray-50 rounded-full w-1/4"></div>
                        <div className="space-y-6 mt-12 bg-white rounded-[40px] p-10 border border-[#4A5D23]/5">
                            {[...Array(12)].map((_, i) => <div key={i} className={`h-4 bg-gray-50 rounded-full ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-2/3'}`}></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data?.article) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
                <div className="text-center bg-white rounded-[60px] p-16 border border-[#4A5D23]/5 shadow-2xl max-w-lg w-full">
                    <div className="w-24 h-24 rounded-[30px] bg-[#4A5D23]/10 flex items-center justify-center mx-auto mb-10">
                        <BookOpen className="h-10 w-10 text-[#4A5D23]" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1a2408] mb-4">{RU_DICTIONARY.helpCenter.knowledgeBase.detail.notFoundTitle}</h2>
                    <p className="text-[#5B4A31] mb-10 font-medium">{RU_DICTIONARY.helpCenter.knowledgeBase.detail.notFoundDesc}</p>
                    <Link href={ROUTES.helpCenterKnowledgeBase} className="inline-flex items-center gap-3 bg-[#4A5D23] text-white px-10 py-5 rounded-[20px] font-black uppercase tracking-widest text-sm hover:bg-[#3a491b] transition-all shadow-xl">
                        <ChevronLeft className="h-5 w-5" /> {RU_DICTIONARY.helpCenter.knowledgeBase.detail.returnArchive}
                    </Link>
                </div>
            </div>
        );
    }

    const { article, related } = data;

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* ═══════════════ ARTICLE HEADER ═══════════════ */}
            <section className="relative overflow-hidden py-24 px-6 border-b border-[#4A5D23]/10">
                {/* Ayurvedic Texture Background (Subtle) */}
                <div 
                    className="absolute inset-0 z-0 opacity-20 bg-repeat bg-center"
                    style={{ 
                        backgroundImage: "url('/ayurvedic-texture.png')",
                        backgroundSize: '400px',
                        filter: 'sepia(0.2) contrast(1.1)'
                    }}
                ></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <Link href={ROUTES.helpCenterKnowledgeBase} className="inline-flex items-center gap-3 text-[#4A5D23] text-sm font-black uppercase tracking-widest mb-10 hover:text-[#3a491b] transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:bg-[#4A5D23] group-hover:text-white transition-all">
                            <ChevronLeft className="h-5 w-5" />
                        </div>
                        {RU_DICTIONARY.helpCenter.knowledgeBase.detail.backHub}
                    </Link>
                    
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1a2408] mb-8 leading-tight">
                        {article.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-8 text-xs font-black uppercase tracking-[0.2em]">
                        {article.category_name && (
                            <span className="bg-[#4A5D23] text-white px-5 py-2 rounded-full shadow-lg shadow-[#4A5D23]/20">
                                {(RU_DICTIONARY.helpCenter.knowledgeBase.categories as Record<string, string>)[article.category_name] || article.category_name}
                            </span>
                        )}
                        <span className="flex items-center gap-2 text-[#5B4A31]/60">
                            <Eye className="h-4 w-4" />
                            {article.view_count} {RU_DICTIONARY.helpCenter.knowledgeBase.detail.enlightened}
                        </span>
                        <span className="flex items-center gap-2 text-[#5B4A31]/60">
                            <Clock className="h-4 w-4" />
                            {RU_DICTIONARY.helpCenter.knowledgeBase.detail.updated} {new Date(article.updated_at || article.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 py-16">
                <article className="bg-white rounded-[60px] p-12 md:p-20 border border-[#4A5D23]/5 shadow-[0_32px_64px_-16px_rgba(74,93,35,0.08)]">
                    <div
                        className="prose prose-lg max-w-none prose-headings:prose-headings:text-[#1a2408] prose-p:text-[#5B4A31] prose-p:leading-relaxed prose-a:text-[#4A5D23] prose-strong:text-[#1a2408] prose-img:rounded-[30px] prose-img:shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
                    />
                </article>

                {/* Related Articles */}
                {related && related.length > 0 && (
                    <div className="mt-20">
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-3xl font-bold text-[#1a2408]">{RU_DICTIONARY.helpCenter.knowledgeBase.detail.relatedWisdom}</h3>
                            <div className="flex-1 h-px bg-[#4A5D23]/10"></div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {related.map((r: any) => (
                                <Link
                                    key={r.article_id}
                                    href={ROUTES.helpCenterKnowledgeBaseArticle(r.slug)}
                                    className="group bg-white rounded-[32px] p-8 border border-[#4A5D23]/5 hover:border-[#4A5D23]/20 hover:shadow-xl transition-all flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-[#1a2408] group-hover:text-[#4A5D23] transition-colors mb-2">
                                            {r.title}
                                        </h4>
                                        {r.excerpt && <p className="text-sm text-[#5B4A31]/60 line-clamp-1 font-medium italic">{r.excerpt}</p>}
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#4A5D23] group-hover:text-white transition-all ml-4 shrink-0">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


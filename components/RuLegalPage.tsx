import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, Scale } from 'lucide-react';
import type { RuLegalDocument } from '@/lib/ru-legal-content';

// ─── Icon map by page type ──────────────────────────────────────────
const PAGE_ICONS: Record<string, React.ElementType> = {
    'Публичная оферта': Scale,
    'Политика возврата и обмена': FileText,
    'Условия доставки и оплаты': FileText,
    'Политика обработки персональных данных': ShieldCheck,
};

interface RuLegalPageProps {
    doc: RuLegalDocument;
}

export default function RuLegalPage({ doc }: RuLegalPageProps) {
    const Icon = PAGE_ICONS[doc.title] || FileText;

    return (
        <div className="min-h-screen bg-page-bg relative overflow-hidden pb-32">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-muted/10 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20">

                {/* Header Section */}
                <div className="mb-12 sm:mb-20 text-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-gold/10 text-gold mb-6 border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.15)] ring-1 ring-white/5 mx-auto">
                        <Icon className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 tracking-tight">
                        {doc.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-muted font-medium">
                        <span className="bg-card-bg px-4 py-1.5 rounded-full border border-border-subtle shadow-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gold" />
                            ООО &quot;ВЕДАШИ ХЕРБАЛС&quot;
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <article className="bg-card-bg/80 backdrop-blur-md rounded-3xl sm:rounded-[40px] border border-border-subtle p-6 sm:p-12 lg:p-16 shadow-2xl shadow-black/5 animate-fade-in-up relative z-10">
                    <div className="prose prose-lg sm:prose-xl max-w-none text-text-secondary marker:text-gold prose-headings:font-serif prose-headings:text-text-primary prose-a:text-gold hover:prose-a:text-gold-soft prose-strong:text-text-primary prose-p:leading-relaxed prose-headings:tracking-tight">
                        {doc.blocks.map((block, index) => {
                            if (block.type === 'heading') {
                                return (
                                    <h2 key={index} className="flex items-center gap-3 mt-12 mb-6 group first:mt-0">
                                        <span className="text-gold opacity-50 font-sans text-xl font-light select-none group-hover:opacity-100 transition-opacity">§</span>
                                        {block.text}
                                    </h2>
                                );
                            }
                            if (block.type === 'pre') {
                                return (
                                    <pre
                                        key={index}
                                        className="bg-page-bg/60 border border-border-subtle rounded-2xl p-5 sm:p-6 text-sm sm:text-base text-text-secondary font-mono whitespace-pre-wrap leading-relaxed mb-6"
                                    >
                                        {block.text}
                                    </pre>
                                );
                            }
                            return (
                                <p key={index} className="mb-6 whitespace-pre-wrap text-base sm:text-lg">
                                    {block.text}
                                </p>
                            );
                        })}
                    </div>
                </article>

                {/* Back to Home */}
                <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <Link href="/ru" className="inline-flex items-center gap-2 text-text-muted hover:text-gold transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4" />
                        Вернуться на главную
                    </Link>
                </div>

            </main>
        </div>
    );
}

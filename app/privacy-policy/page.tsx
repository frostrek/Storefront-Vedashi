import { Metadata } from 'next';
import { getLegalDocument } from '@/lib/api';
import { ArrowLeft, ShieldCheck, Mail, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RuLegalPage from '@/components/RuLegalPage';
import { privacyPolicy } from '@/lib/ru-legal-content';

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country } = await params;
    if (country === 'ru') {
        return {
            title: privacyPolicy.metaTitle,
            description: privacyPolicy.metaDescription,
        };
    }
    const doc = await getLegalDocument('privacy-policy');
    return {
        title: doc ? `${doc.title} | Vedashi` : 'Privacy Policy | Vedashi',
        description: 'Read the privacy policy of Vedashi to understand how we collect, use, and protect your data.',
    };
}

export default async function PrivacyPolicyPage({ params }: Props) {
    const { country } = await params;

    // ─── Russia: show Russian privacy policy ───
    if (country === 'ru') {
        return <RuLegalPage doc={privacyPolicy} />;
    }

    // Fetch the live legal document with slug "privacy-policy"
    const doc = await getLegalDocument('privacy-policy');

    if (!doc) {
        return (
            <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-4">
                <ShieldCheck className="h-16 w-16 text-text-muted mb-4" />
                <h1 className="text-2xl font-bold text-text-primary mb-2">Privacy Policy Not Found</h1>
                <p className="text-text-muted mb-6">We could not find the active privacy policy document.</p>
                <Link href="/" className="bg-gold text-white px-6 py-2 rounded-xl font-medium hover:bg-gold-soft transition">
                    Return Home
                </Link>
            </div>
        );
    }

    // Parse the blocks
    let blocks: { type: string, text: string }[] = [];
    try {
        blocks = JSON.parse(doc.content || '[]');
        if (!Array.isArray(blocks)) blocks = [];
    } catch {
        // legacy fallback if it's not JSON
        blocks = [{ type: 'paragraph', text: doc.content }];
    }

    // Split blocks for an optional sidebar index or just pure content
    // We'll render beautifully with nice spacing and glassmorphism.

    return (
        <div className="min-h-screen bg-page-bg relative overflow-hidden pb-32">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-muted/10 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20">
                
                {/* Header Section */}
                <div className="mb-12 sm:mb-20 text-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-gold/10 text-gold mb-6 border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.15)] ring-1 ring-white/5 mx-auto">
                        <ShieldCheck className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 tracking-tight">
                        {doc.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-muted font-medium">
                        <span className="bg-card-bg px-4 py-1.5 rounded-full border border-border-subtle shadow-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gold" />
                            Version {doc.version}
                        </span>
                        <span className="bg-card-bg px-4 py-1.5 rounded-full border border-border-subtle shadow-sm">
                            Last Updated: {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <article className="bg-card-bg/80 backdrop-blur-md rounded-3xl sm:rounded-[40px] border border-border-subtle p-6 sm:p-12 lg:p-16 shadow-2xl shadow-black/5 animate-fade-in-up relative z-10">
                    <div className="prose prose-lg sm:prose-xl max-w-none text-text-secondary marker:text-gold prose-headings:font-serif prose-headings:text-text-primary prose-a:text-gold hover:prose-a:text-gold-soft prose-strong:text-text-primary prose-p:leading-relaxed prose-headings:tracking-tight">
                        
                        {blocks.map((block, index) => {
                            if (block.type === 'heading') {
                                return (
                                    <h2 key={index} className="flex items-center gap-3 mt-12 mb-6 group">
                                        <span className="text-gold opacity-50 font-sans text-xl font-light select-none group-hover:opacity-100 transition-opacity">§</span>
                                        {block.text}
                                    </h2>
                                );
                            } else {
                                // Provide nice formatting for paragraphs
                                // Handle potential line breaks within the paragraph
                                return (
                                    <p key={index} className="mb-6 whitespace-pre-wrap text-base sm:text-lg">
                                        {block.text}
                                    </p>
                                );
                            }
                        })}

                    </div>

                    {/* Bottom contact card inside document */}
                    <div className="mt-16 pt-10 border-t border-border-subtle">
                        <div className="bg-page-bg/50 rounded-2xl p-6 sm:p-8 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left transition-all hover:border-gold/30 hover:bg-page-bg hover:shadow-lg">
                            <div>
                                <h3 className="font-serif text-xl font-bold text-text-primary mb-2">Have questions about your privacy?</h3>
                                <p className="text-text-secondary text-sm">We are committed to protecting your data. Reach out if you need clarification.</p>
                            </div>
                            <Link href="/contact" className="shrink-0 flex items-center gap-2 bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:bg-emerald-800 shadow-xl shadow-emerald-700/20">
                                <Mail className="h-4 w-4" />
                                Contact Privacy Team
                            </Link>
                        </div>
                    </div>
                </article>

                {/* Back to Home */}
                <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-gold transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4" />
                        Return to Storefront
                    </Link>
                </div>

            </main>
        </div>
    );
}

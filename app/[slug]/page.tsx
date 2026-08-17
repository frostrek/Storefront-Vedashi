import React from 'react';
import Link from 'next/link';
import { getLegalDocument, getLegalDocumentByType } from '@/lib/api';
import LegalContentRenderer from '@/components/ui/LegalContentRenderer';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { RU_DICTIONARY } from '@/content/ru';

type Props = { params: Promise<{ slug: string }> };

// Map of legacy hardcoded URLs to their new dynamic document_type system roles
const LEGACY_SLUG_MAP: Record<string, string> = {
    'dostavka': 'shipping_policy',
    'vozvrat': 'return_policy',
    'usloviya': 'terms_of_service',
    'politika-konfidentsialnosti': 'privacy_policy',
    'politika-obrabotki-personalnykh-dannykh': 'privacy_policy'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const doc = await getLegalDocument(slug);
    
    if (!doc) return {};
    
    const fallbackDescription = RU_DICTIONARY.globalSeo.legal.meta.fallbackDescription.replace('{title}', doc.title);
    
    return {
        title: `${doc.title} | Vedashi Herbals`,
        description: doc.meta_description || fallbackDescription,
        alternates: {
            canonical: `https://vedashiherbals.com/${slug}`,
        },
        openGraph: {
            title: `${doc.title} | Vedashi Herbals`,
            description: doc.meta_description || fallbackDescription,
            url: `https://vedashiherbals.com/${slug}`,
            siteName: 'Vedashi Herbals',
            locale: 'ru_RU',
            type: 'website',
        },
    };
}

export default async function DynamicLegalPage({ params }: Props) {
    const { slug } = await params;
    
    // Fetch document dynamically based on the slug from the URL
    const doc = await getLegalDocument(slug);

    if (!doc) {
        // If the slug doesn't exist, check if it's a known legacy URL (e.g. from a bookmark or Google)
        if (LEGACY_SLUG_MAP[slug]) {
            const documentType = LEGACY_SLUG_MAP[slug];
            const activeDoc = await getLegalDocumentByType(documentType);
            
            // If we found the new document that represents this policy, issue a 301 Permanent Redirect!
            if (activeDoc && activeDoc.slug) {
                redirect(`/${activeDoc.slug}`);
            }
        }
        
        // If it's not a legacy URL or the document type doesn't exist, return 404
        notFound();
    }

    return (
        <div className="min-h-screen bg-white py-20 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16">
                <div className="mb-12 border-b border-gray-100 pb-8 cursor-pointer">
                    <Link href="/">
                        <img src="/vedashi-logo.png" alt="Vedashi" className="h-16 w-auto object-contain mb-8" />
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        {doc.title}
                    </h1>
                    {doc.published_at && (
                        <p className="text-gray-500">Last Updated: {new Date(doc.published_at).toLocaleDateString()}</p>
                    )}
                </div>

                <LegalContentRenderer content={doc.content || ''} />
            </div>
        </div>
    );
}

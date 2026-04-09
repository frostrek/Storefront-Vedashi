import React from 'react';
import Link from 'next/link';
import { getLegalDocument } from '@/lib/api';
import LegalContentRenderer from '@/components/ui/LegalContentRenderer';

export const metadata = {
    title: 'Terms of Service | Vedashi',
    description: 'Terms of Service and Conditions for Vedashi.',
};

export default async function TermsPage() {
    const doc = await getLegalDocument('terms-of-service');
    
    return (
        <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16">
                <div className="mb-12 border-b border-gray-100 pb-8 cursor-pointer">
                    <Link href="/">
                        <img src="/vedashi-logo.png" alt="Vedashi" className="h-16 w-auto object-contain mb-8" />
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        {doc?.title || 'Terms of Service'}
                    </h1>
                    {doc?.published_at && (
                        <p className="text-gray-500">Last Updated: {new Date(doc.published_at).toLocaleDateString()}</p>
                    )}
                </div>

                <LegalContentRenderer content={doc?.content || ''} />
            </div>
        </div>
    );
}

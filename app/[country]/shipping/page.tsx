import React from 'react';
import Link from 'next/link';
import { getLegalDocument } from '@/lib/api';

import LegalContentRenderer from '@/components/ui/LegalContentRenderer';

export const metadata = {
    title: 'Shipping Policy | Vedashi',
    description: 'Learn about Vedashi shipping rates, delivery timelines, and our shipping policy.',
};

export default async function ShippingPolicyPage() {
    const doc = await getLegalDocument('shipping-policy');
    
    return (
        <div className="min-h-screen bg-white py-20 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16">
                <div className="mb-12 border-b border-gray-100 pb-8 cursor-pointer">
                    <Link href="/">
                        <img src="/vedashi-logo.png" alt="Vedashi" className="h-16 w-auto object-contain mb-8" />
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        {doc?.title || 'Shipping Policy'}
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

import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Terms of Service | Vedashi',
    description: 'Terms of Service and Conditions for Vedashi.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16">
                <div className="mb-12 border-b border-gray-100 pb-8 cursor-pointer">
                    <Link href="/">
                        <img src="/vedashi-logo.png" alt="Vedashi" className="h-16 w-auto object-contain mb-8" />
                    </Link>
                    <h1 className="font-serif text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-gray-500">Last Updated: March 2026</p>
                </div>

                <div className="prose prose-lg prose-[#3d5c3a] max-w-none text-gray-600">
                    <p className="lead text-xl text-gray-800 font-serif mb-8">
                        Welcome to Vedashi. By accessing or using our website and services, you agree to be bound by these Terms of Service.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing this website, we assume you accept these terms and conditions. Do not continue to use Vedashi if you do not agree to take all of the terms and conditions stated on this page.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">2. Medical Disclaimer</h2>
                    <p>
                        The content provided by Vedashi, including text, graphics, images, and information, is for informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">3. User Accounts</h2>
                    <p>
                        When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                    </p>
                    
                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">4. Intellectual Property Rights</h2>
                    <p>
                        Other than the content you own, under these Terms, Vedashi and/or its licensors own all the intellectual property rights and materials contained in this website. You are granted limited license only for purposes of viewing the material contained on this website.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">5. Governing Law</h2>
                    <p>
                        These Terms will be governed by and interpreted in accordance with the laws of the jurisdiction in which Vedashi operates, and you submit to the non-exclusive jurisdiction of the state and federal courts located in that jurisdiction for the resolution of any disputes.
                    </p>

                    <hr className="my-12 border-gray-100" />
                    <p className="text-sm text-gray-500 italic">
                        If you have any questions about these Terms, please contact us at legal@vedashi.com.
                    </p>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy | Vedashi',
    description: 'Privacy Policy for Vedashi.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16">
                <div className="mb-12 border-b border-gray-100 pb-8 cursor-pointer">
                    <Link href="/">
                        <img src="/vedashi-logo.png" alt="Vedashi" className="h-16 w-auto object-contain mb-8" />
                    </Link>
                    <h1 className="font-serif text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-500">Last Updated: March 2026</p>
                </div>

                <div className="prose prose-lg prose-[#3d5c3a] max-w-none text-gray-600">
                    <p className="lead text-xl text-gray-800 font-serif mb-8">
                        Vedashi is committed to protecting your privacy and developing technology that gives you the most powerful and safe online experience.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">1. Information Collection and Use</h2>
                    <p>
                        We collect several different types of information for various purposes to provide and improve our Service to you:
                    </p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong>Personal Data:</strong> Email address, first name, last name, phone number, address, state, province, ZIP/Postal code, city.</li>
                        <li><strong>Usage Data:</strong> How the Service is accessed and used, such as IP address, browser type, pages visited, time spent, and unique device identifiers.</li>
                    </ul>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">2. Cookies Data</h2>
                    <p>
                        We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">3. Use of Data</h2>
                    <p>
                        Vedashi uses the collected data for various purposes:
                    </p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li>To provide and maintain the Service</li>
                        <li>To notify you about changes to our Service</li>
                        <li>To provide customer care and support</li>
                        <li>To monitor the usage of the Service</li>
                        <li>To detect, prevent and address technical issues</li>
                    </ul>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">4. Transfer Of Data</h2>
                    <p>
                        Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
                    </p>

                    <h2 className="font-serif text-2xl font-bold text-gray-900 mt-10 mb-4">5. Security Of Data</h2>
                    <p>
                        The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                    </p>

                    <hr className="my-12 border-gray-100" />
                    <p className="text-sm text-gray-500 italic">
                        If you have any questions about this Privacy Policy, please contact us at privacy@vedashi.com.
                    </p>
                </div>
            </div>
        </div>
    );
}

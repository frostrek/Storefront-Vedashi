import Link from 'next/link';
import { Leaf } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found — Vedashi',
    description: 'Oops! The sanctuary you are looking for could not be found. Browse our premium Ayurvedic wellness collection instead.',
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <section className="relative flex h-[calc(100vh-100px)] flex-col items-center justify-center px-4 overflow-hidden">
            {/* Decorative background blurs */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#3B5D3B]/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#C9B87A]/5 blur-3xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up mt-[-60px]">
                {/* Ayurvedic Symbol */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 -mb-8">
                    <div className="w-full h-full flex items-center justify-center bg-[#F5F2E8] rounded-full">
                        <Leaf className="w-24 h-24 text-[#3B5D3B]" />
                    </div>
                </div>

                {/* 404 number */}
                <h1
                    className="text-7xl md:text-8xl font-black tracking-tight mb-1 text-[#3B5D3B] select-none"
                    aria-label="Error 404"
                >
                    404
                </h1>

                {/* Message */}
                <h2 className="text-lg md:text-xl text-[#2C2C2C] mb-2">
                    Oops! This path is out of balance
                </h2>
                <p className="max-w-md text-warm-gray text-xs md:text-sm leading-relaxed mb-6">
                    Sorry, the page you&apos;re looking for can&apos;t be loaded right now.
                    It may have been moved, removed, or perhaps it never existed.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white bg-[#3B5D3B] shadow-lg shadow-[#3B5D3B]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#3B5D3B]/30 hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Back to Home
                    </Link>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#3B5D3B]/20 bg-[#FAF7F2] px-6 py-2.5 text-sm font-semibold text-[#3B5D3B] transition-all duration-300 hover:border-[#3B5D3B]/40 hover:bg-[#3B5D3B]/5 hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                        </svg>
                        Browse Collection
                    </Link>
                </div>

                {/* Ornamental divider */}
                <div className="mt-12 flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#8B7A3D]/40" />
                    <Leaf className="w-4 h-4 text-[#8B7A3D]/40" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#8B7A3D]/40" />
                </div>
            </div>
        </section>
    );
}

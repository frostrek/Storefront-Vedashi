import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found — KSP Wines',
    description: 'Oops! The page you are looking for could not be found. Browse our curated collection of premium Vietnamese wines instead.',
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <section className="relative flex h-[calc(100vh-100px)] flex-col items-center justify-center px-4 overflow-hidden">
            {/* Decorative background blurs */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-burgundy/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-wine-gold/5 blur-3xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up mt-[-60px]">
                {/* Spilled wine glass image */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 -mb-8">
                    <img
                        src="/spilled-wine.png"
                        alt="Spilled wine glass"
                        className="w-full h-full object-contain"
                        width={256}
                        height={256}
                    />
                </div>

                {/* 404 number */}
                <h1
                    className="font-serif text-7xl md:text-8xl font-black tracking-tight mb-1 text-[#601421] select-none"
                    aria-label="Error 404"
                >
                    404
                </h1>

                {/* Message */}
                <h2 className="font-serif text-lg md:text-xl text-charcoal mb-2">
                    Oops! This wine has been spilled
                </h2>
                <p className="max-w-md text-warm-gray text-xs md:text-sm leading-relaxed mb-6">
                    Sorry, the page you&apos;re looking for can&apos;t be loaded right now.
                    It may have been moved, removed, or perhaps it never existed.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-cream wine-gradient shadow-lg shadow-burgundy/20 transition-all duration-300 hover:shadow-xl hover:shadow-burgundy/30 hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Back to Home
                    </Link>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-burgundy/20 bg-cream px-6 py-2.5 text-sm font-semibold text-burgundy transition-all duration-300 hover:border-burgundy/40 hover:bg-burgundy/5 hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                        </svg>
                        Browse Collection
                    </Link>
                </div>

                {/* Ornamental divider */}
                <div className="mt-12 flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-wine-gold/40" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-wine-gold/40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 7.5c0 3.13 2.87 6 6 6h1V11h-1c-2.07 0-4-1.79-4-3.5C9 5.79 10.93 4 13 4h1V2h-1C9.87 2 7 4.37 7 7.5z" />
                        <path d="M17 2v2h-1c-2.07 0-4 1.79-4 3.5 0 1.71 1.93 3.5 4 3.5h1v2h-1c-3.13 0-6-2.87-6-6 0-3.13 2.87-5.5 6-5.5h1z" opacity="0.4" />
                    </svg>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-wine-gold/40" />
                </div>
            </div>
        </section>
    );
}

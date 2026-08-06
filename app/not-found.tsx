import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { RU_DICTIONARY } from '@/content/ru';

export const metadata: Metadata = {
    title: RU_DICTIONARY.notFoundPage.meta.title,
    description: RU_DICTIONARY.notFoundPage.meta.description,
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <section className="min-h-[calc(100vh-100px)] flex flex-col md:flex-row items-center justify-center px-8 py-12 md:py-0 bg-[#FFFFFF] gap-12 md:gap-24 overflow-hidden">
            {/* Left side: Illustration */}
            <div className="w-full max-w-sm md:max-w-md lg:max-w-lg animate-fade-in-up">
                <div className="relative w-full aspect-square">
                    <Image
                        src="/images/404-detective-clear.png"
                        alt={RU_DICTIONARY.notFoundPage.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Right side: Typography and Actions */}
            <div className="flex flex-col justify-center items-center max-w-md animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black text-[#2C2C2C] tracking-tighter mb-4 leading-none">
                    404
                </h1>

                <h2 className="text-lg md:text-xl text-[#2C2C2C] font-semibold mb-8 uppercase tracking-widest leading-relaxed">
                    {RU_DICTIONARY.notFoundPage.heading}<br className="hidden md:block" /> {RU_DICTIONARY.notFoundPage.subheading}
                </h2>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-[#2C2C2C] text-[#2C2C2C] font-bold text-sm tracking-[0.2em] uppercase bg-[#91C934] border-[#91C934] text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                    {RU_DICTIONARY.notFoundPage.backHome}
                </Link>
            </div>
        </section>
    );
}



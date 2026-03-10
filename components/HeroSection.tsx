'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, Award, FlaskConical, ShieldCheck } from 'lucide-react';

const trustBadges = [
    { icon: ShieldCheck, label: 'CLINICAL GRADE PURITY' },
    { icon: Award, label: "GLOBAL EXCELLENCE '24" },
    { icon: FlaskConical, label: '250K+ PROTOCOLS ADMINISTERED' },
    { icon: Leaf, label: 'LAB-VERIFIED FORMULATIONS' },
];

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden">
            {/* ── Background Image ── */}
            <div className="absolute inset-0">
                <img
                    src="/hero-ayurveda.png"
                    alt="Ayurvedic herbs and botanicals"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F0]/95 via-[#FAF8F0]/70 to-transparent" />
            </div>

            {/* ── Hero Content ── */}
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[560px] sm:min-h-[620px] py-16 sm:py-20 lg:py-24">

                    {/* Left Column — Text */}
                    <div className="max-w-xl">
                        {/* Badge */}
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#3B5D3B] text-white text-[11px] font-bold tracking-widest uppercase mb-6 animate-fade-in">
                            ESTD 1984
                        </span>

                        {/* Headline */}
                        <h1 className="font-serif leading-[1.1] animate-fade-in-up">
                            <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#2C2C2C]">
                                Ancient
                            </span>
                            <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold italic text-[#3B5D3B]">
                                Wisdom,
                            </span>
                            <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#2C2C2C]">
                                Modern
                            </span>
                            <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#2C2C2C]">
                                Wellness.
                            </span>
                        </h1>

                        {/* Subtext */}
                        <p
                            className="mt-6 text-base sm:text-lg text-[#6B6B60] leading-relaxed max-w-md animate-fade-in-up"
                            style={{ animationDelay: '0.15s' }}
                        >
                            Experience the healing power of authentic Ayurvedic remedies crafted from nature&apos;s most sacred botanicals.
                        </p>

                        {/* CTA Buttons */}
                        <div
                            className="mt-8 flex flex-wrap gap-4 animate-fade-in-up"
                            style={{ animationDelay: '0.3s' }}
                        >
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2.5 rounded-lg bg-[#3B5D3B] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#2D4A2D] hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Shop Remedies
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#3B5D3B] px-7 py-3.5 text-sm font-semibold text-[#3B5D3B] transition-all duration-300 hover:bg-[#3B5D3B] hover:text-white hover:-translate-y-0.5"
                            >
                                Book Consultation
                            </Link>
                        </div>
                    </div>

                    {/* Right Column — Decorative Feature Card */}
                    <div className="hidden lg:flex justify-center items-center">
                        <div className="relative">
                            {/* Floating Card */}
                            <div className="relative w-[340px] h-[420px] rounded-2xl overflow-hidden shadow-2xl animate-float">
                                <img
                                    src="/hero-ayurveda.png"
                                    alt="Ayurvedic preparation"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                {/* Watch Our Story pill */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex items-center gap-3 rounded-xl bg-white/90 backdrop-blur-md px-4 py-3 shadow-lg">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B5D3B]/10">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="#3B5D3B">
                                                <polygon points="5,3 13,8 5,13" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#6B6B60]">The Vedashi Method</p>
                                            <p className="text-sm font-semibold text-[#2C2C2C]">WATCH OUR STORY</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Background decorative elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#3B5D3B]/10 -z-10" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-[#8B7A3D]/10 -z-10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Trust Bar ── */}
            <div className="relative z-10 bg-[#3B5D3B]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 py-4 sm:py-5">
                        {trustBadges.map((badge, i) => (
                            <div key={i} className="flex items-center gap-2.5 flex-1 min-w-[200px] justify-center">
                                <badge.icon className="h-4 w-4 text-[#C9B87A] flex-shrink-0" />
                                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-[#E8DCAF] uppercase whitespace-nowrap">
                                    {badge.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

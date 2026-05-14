'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, ShieldCheck, MapPin, BookOpen, Globe, Rocket, ShoppingBag, TrendingUp } from 'lucide-react';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';
import { useParams } from 'next/navigation';

export default function AboutClientPage() {
    const params = useParams();
    const country = (params.country as string) || 'in';
    return (
        <div className="min-h-screen bg-[#FDFCFB] relative">
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{
                backgroundImage: `url("/ayurvedic-texture.png")`,
                backgroundSize: '400px 400px',
                backgroundRepeat: 'repeat'
            }} />

            {/* ═══════════════════════════════════════════════════════════
          HERO — Our Story
      ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(30, 41, 30, 0.60), rgba(30, 41, 30, 0.85)), url('/about-hero.png')`,
                    }}
                />
                <div className="relative mx-auto max-w-4xl px-4 py-28 lg:py-44 text-center">
                    <AnimateOnScroll animation="fadeIn" duration={0.8}>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#C9B87A] font-medium mb-4">
                            Our Story
                        </p>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.1} duration={0.9}>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                            The Ancient Wisdom of India,<br />
                            <em className="italic text-[#C9B87A]">Belongs to the World</em>
                        </h1>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.25} duration={0.9}>
                        <p className="mt-8 text-base sm:text-lg text-[#E8DCAF]/90 max-w-2xl mx-auto leading-relaxed">
                            Rooted in the Sanskrit words <strong>Veda</strong> (knowledge) and <strong>Ashi</strong> (blessing), we bring you authentic herbal wellness, pure spices, and natural beauty products sourced directly from India.
                        </p>
                        <p className="mt-4 text-base sm:text-lg text-[#E8DCAF]/90 max-w-2xl mx-auto leading-relaxed">
                            From the foothills of the Himalayas to the spice gardens of Kerala, we work with trusted farmers, artisans, and certified manufacturers to deliver products that honor tradition while meeting the highest global standards.
                        </p>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.4}>
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Link
                                href={`/${country}/products`}
                                className="inline-flex items-center gap-2.5 rounded-full bg-[#5F6F52] px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#4A5A3E] hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Explore Collections
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </AnimateOnScroll>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          MISSION
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 lg:py-32 px-4 relative z-10 bg-white">
                <div className="mx-auto max-w-7xl grid grid-cols-1 gap-12 lg:gap-20 lg:grid-cols-2 items-center">
                    {/* Image */}
                    <AnimateOnScroll animation="fadeLeft" duration={0.9}>
                        <div className="relative">
                            <div className="rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="/about-mission.png"
                                    alt="Our Mission"
                                    className="w-full h-[450px] object-cover transition-transform duration-700 hover:scale-105"
                                />
                            </div>
                            <div className="absolute -bottom-8 -right-4 sm:right-8 rounded-2xl bg-white shadow-xl p-6 border border-[#F0EBE1] max-w-xs">
                                <Leaf className="h-8 w-8 text-[#5F6F52] mb-3" />
                                <p className="text-sm font-bold tracking-wide text-[#2C2C2C]">
                                    Bridging the gap between traditional origins and conscious consumers globally.
                                </p>
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* Text */}
                    <div className="lg:pl-8">
                        <AnimateOnScroll animation="fadeRight" delay={0.1}>
                            <p className="text-sm font-bold tracking-widest text-[#8B7A3D] uppercase mb-3">Our Mission</p>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight">
                                Empowering Brands,<br />
                                <em className="italic text-[#5F6F52]">Enriching Lives</em>
                            </h2>
                        </AnimateOnScroll>
                        <AnimateOnScroll animation="fadeRight" delay={0.2}>
                            <p className="mt-6 text-[#6B6B60] leading-relaxed text-lg">
                                To make authentic Indian wellness, food, and beauty products accessible to conscious consumers worldwide — while empowering Indian brands and startups to scale globally without the complexities of international expansion.
                            </p>
                        </AnimateOnScroll>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          WHAT WE DO
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 px-4 bg-[#F9F8F6] relative z-10">
                <div className="mx-auto max-w-7xl">
                    <AnimateOnScroll animation="fadeUp">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C]">
                                What We <em className="italic text-[#5F6F52]">Do</em>
                            </h2>
                            <p className="mt-4 text-[#6B6B60] max-w-xl mx-auto text-lg">
                                Creating a seamless bridge between India's finest creators and the global market.
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AnimateOnScroll animation="fadeUp" delay={0.1}>
                            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-[#F0EBE1] shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
                                <div className="h-16 w-16 rounded-2xl bg-[#5F6F52]/10 flex items-center justify-center mb-6 group-hover:bg-[#5F6F52]/20 transition-colors">
                                    <ShoppingBag className="h-8 w-8 text-[#5F6F52]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">For Consumers</h3>
                                <p className="text-[#6B6B60] leading-relaxed text-lg flex-grow">
                                    We curate and deliver premium Indian wellness, beauty, food, and lifestyle products directly to your doorstep — anywhere in the world. Experience the true essence of India with uncompromising quality.
                                </p>
                            </div>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fadeUp" delay={0.2}>
                            <div className="bg-[#5F6F52] rounded-3xl p-10 sm:p-14 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                    <Globe className="h-40 w-40 text-white" />
                                </div>
                                <div className="relative z-10 h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                                    <TrendingUp className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="relative z-10 text-2xl font-bold text-white mb-4">For Brands & Startups</h3>
                                <p className="relative z-10 text-[#E8DCAF] leading-relaxed text-lg flex-grow">
                                    We are your global expansion partner. We handle export logistics, international compliance, marketplace positioning, and market entry — so you can focus on what you do best: creating exceptional products. No marketing spend. No export headaches. Just growth.
                                </p>
                                <div className="relative z-10 mt-8">
                                    <Link href="/vendor-registration" className="inline-flex items-center text-sm font-bold text-white uppercase tracking-wider group/link">
                                        Partner with us <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </AnimateOnScroll>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          WHY CHOOSE VEDASHI
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 px-4 bg-white relative z-10">
                <div className="mx-auto max-w-7xl">
                    <AnimateOnScroll animation="fadeUp">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C]">
                                Why Choose <em className="italic text-[#5F6F52]">Vedashi?</em>
                            </h2>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                title: '100% Authentic Products',
                                desc: 'Every item is genuine, sourced directly from trusted Indian manufacturers and brands.',
                            },
                            {
                                icon: MapPin,
                                title: 'Direct from India',
                                desc: 'No middlemen, no dilution — products come straight from the source to your door.',
                            },
                            {
                                icon: Leaf,
                                title: 'Pure & Natural',
                                desc: 'Formulated with clean ingredients—no harmful chemicals, preservatives, or artificial additives.',
                            },
                            {
                                icon: BookOpen,
                                title: 'Trusted Heritage',
                                desc: 'Products and formulations deeply rooted in Ayurveda and traditional Indian knowledge.',
                            },
                            {
                                icon: Globe,
                                title: 'Worldwide Shipping',
                                desc: 'We handle the logistics to deliver borderless wellness to your doorstep, anywhere in the world.',
                            },
                            {
                                icon: Rocket,
                                title: 'Empowering Indian Brands',
                                desc: 'We help homegrown startups and established local artisans reach global markets seamlessly.',
                            },
                        ].map((feature, i) => (
                            <AnimateOnScroll key={i} animation="fadeUp" delay={i * 0.1}>
                                <div className="bg-[#FDFCFB] border border-[#F0EBE1] rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group h-full">
                                    <div className="h-14 w-14 rounded-xl bg-[#F0EBE1] flex items-center justify-center mb-6 group-hover:bg-[#5F6F52] group-hover:text-white text-[#5F6F52] transition-colors duration-300">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">{feature.title}</h3>
                                    <p className="text-[#6B6B60] leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            </AnimateOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          FOOTER CTA
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 px-4 bg-[#F9F8F6]">
                <AnimateOnScroll animation="scaleUp" className="mx-auto max-w-5xl">
                    <div className="rounded-[2.5rem] bg-[#2C2C2C] px-8 sm:px-16 py-14 sm:py-20 text-center relative overflow-hidden">
                        {/* Decorative Background Art */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('/ayurvedic-texture.png')] bg-repeat" />
                        
                        <h2 className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                            Experience the best of <em className="italic text-[#C9B87A]">India</em>.
                        </h2>
                        <p className="relative z-10 mt-6 text-[#A0A0A0] text-lg max-w-2xl mx-auto">
                            Join thousands of global customers exploring the purity of Indian tradition. Or, partner with us to take your brand to the world.
                        </p>

                    </div>
                </AnimateOnScroll>
            </section>
        </div>
    );
}

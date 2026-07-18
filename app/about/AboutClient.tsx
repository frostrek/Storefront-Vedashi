'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, ShieldCheck, MapPin, BookOpen, Globe, Rocket, ShoppingBag, TrendingUp } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';
import { useParams } from 'next/navigation';
import { RU_DICTIONARY } from '@/content/ru';

export default function AboutClientPage() {
    const params = useParams();
    const country = (params.country as string) || 'in';
    const t = RU_DICTIONARY.about;

    const features = [
        { icon: ShieldCheck, ...t.whyChoose.features.authenticProducts },
        { icon: MapPin, ...t.whyChoose.features.directFromIndia },
        { icon: Leaf, ...t.whyChoose.features.pureNatural },
        { icon: BookOpen, ...t.whyChoose.features.trustedHeritage },
        { icon: Globe, ...t.whyChoose.features.worldwideShipping },
        { icon: Rocket, ...t.whyChoose.features.empoweringBrands },
    ];

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
                            {t.hero.label}
                        </p>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.1} duration={0.9}>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                            {t.hero.headingLine1}<br />
                            <em className="italic text-[#C9B87A]">{t.hero.headingLine2}</em>
                        </h1>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.25} duration={0.9}>
                        <p
                            className="mt-8 text-base sm:text-lg text-[#E8DCAF]/90 max-w-2xl mx-auto leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: t.hero.descriptionLine1 }}
                        />
                        <p
                            className="mt-4 text-base sm:text-lg text-[#E8DCAF]/90 max-w-2xl mx-auto leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: t.hero.descriptionLine2 }}
                        />
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.4}>
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Link
                                href={ROUTES.katalog}
                                className="group inline-flex items-center gap-2 bg-[#91c934] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#7aab2c] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                {t.hero.exploreCollections}
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
                                    alt={t.mission.imageAlt}
                                    className="w-full h-[450px] object-cover transition-transform duration-700 hover:scale-105"
                                />
                            </div>
                            <div className="absolute -bottom-8 -right-4 sm:right-8 rounded-2xl bg-white shadow-xl p-6 border border-[#F0EBE1] max-w-xs">
                                <Leaf className="h-8 w-8 text-[#5F6F52] mb-3" />
                                <p className="text-sm font-bold tracking-wide text-[#2C2C2C]">
                                    {t.mission.floatingCard}
                                </p>
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* Text */}
                    <div className="lg:pl-8">
                        <AnimateOnScroll animation="fadeRight" delay={0.1}>
                            <p className="text-sm font-bold tracking-widest text-[#8B7A3D] uppercase mb-3">{t.mission.label}</p>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight">
                                {t.mission.headingLine1}<br />
                                <em className="italic text-[#5F6F52]">{t.mission.headingLine2}</em>
                            </h2>
                        </AnimateOnScroll>
                        <AnimateOnScroll animation="fadeRight" delay={0.2}>
                            <p className="mt-6 text-[#6B6B60] leading-relaxed text-lg">
                                {t.mission.description}
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
                                {t.whatWeDo.heading} <em className="italic text-[#5F6F52]">{t.whatWeDo.headingEmphasis}</em>
                            </h2>
                            <p className="mt-4 text-[#6B6B60] max-w-xl mx-auto text-lg">
                                {t.whatWeDo.subtitle}
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AnimateOnScroll animation="fadeUp" delay={0.1}>
                            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-[#F0EBE1] shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
                                <div className="h-16 w-16 rounded-2xl bg-[#5F6F52]/10 flex items-center justify-center mb-6 group-hover:bg-[#5F6F52]/20 transition-colors">
                                    <ShoppingBag className="h-8 w-8 text-[#5F6F52]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-4">{t.whatWeDo.forConsumers.title}</h3>
                                <p className="text-[#6B6B60] leading-relaxed text-lg flex-grow">
                                    {t.whatWeDo.forConsumers.description}
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
                                <h3 className="relative z-10 text-2xl font-bold text-white mb-4">{t.whatWeDo.forBrands.title}</h3>
                                <p className="relative z-10 text-[#E8DCAF] leading-relaxed text-lg flex-grow">
                                    {t.whatWeDo.forBrands.description}
                                </p>
                                <div className="relative z-10 mt-8">
                                    <Link href="/vendor-registration" className="inline-flex items-center text-sm font-bold text-white uppercase tracking-wider group/link">
                                        {t.whatWeDo.forBrands.partnerWithUs} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
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
                                {t.whyChoose.heading} <em className="italic text-[#5F6F52]">{t.whyChoose.headingEmphasis}</em>
                            </h2>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {features.map((feature, i) => (
                            <AnimateOnScroll key={i} animation="fadeUp" delay={i * 0.1}>
                                <div className="bg-[#FDFCFB] border border-[#F0EBE1] rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group h-full">
                                    <div className="h-14 w-14 rounded-xl bg-[#F0EBE1] flex items-center justify-center mb-6 group-hover:bg-[#5F6F52] group-hover:text-white text-[#5F6F52] transition-colors duration-300">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">{feature.title}</h3>
                                    <p className="text-[#6B6B60] leading-relaxed">
                                        {feature.description}
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
                            {t.cta.heading} <em className="italic text-[#C9B87A]">{t.cta.headingEmphasis}</em>.
                        </h2>
                        <p className="relative z-10 mt-6 text-[#A0A0A0] text-lg max-w-2xl mx-auto">
                            {t.cta.description}
                        </p>

                    </div>
                </AnimateOnScroll>
            </section>
        </div>
    );
}

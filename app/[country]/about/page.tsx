'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, Star, Heart, Award, FlaskConical, ShieldCheck, Sparkles, BookOpen, Users } from 'lucide-react';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-cream relative">
            {/* Ayurvedic Botanical Texture Background - Absolute ensures it doesn't overlap global footer */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.10]" style={{
                backgroundImage: `url("/ayurvedic-texture.png")`,
                backgroundSize: '400px 400px',
                backgroundRepeat: 'repeat'
            }} />

            {/* ═══════════════════════════════════════════════════════════
          HERO — "Crafting a Legacy of Balance"
      ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(44,44,44,0.50), rgba(44,44,44,0.70)),
              url('/about-hero.png')`,
                    }}
                />
                <div className="relative mx-auto max-w-4xl px-4 py-28 lg:py-44 text-center">
                    <AnimateOnScroll animation="fadeIn" duration={0.8}>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#C9B87A] font-medium mb-4">
                            Our Origin
                        </p>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.1} duration={0.9}>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                            Crafting a Legacy of{' '}
                            <em className="italic text-[#C9B87A]">Balance</em>
                        </h1>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.25} duration={0.9}>
                        <p className="mt-6 text-base sm:text-lg text-[#E8DCAF]/90 max-w-2xl mx-auto leading-relaxed">
                            From ancient Himalayan traditions to your doorstep, every formulation
                            carries the wisdom of 5,000 years and the precision of modern science.
                        </p>
                    </AnimateOnScroll>
                    <AnimateOnScroll animation="fadeUp" delay={0.4}>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2.5 rounded-lg bg-[#3B5D3B] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#2D4A2D] hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Explore Remedies
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </AnimateOnScroll>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          MISSION — "A Return to Purity"
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 lg:py-28 px-4 relative z-10">
                <div className="mx-auto max-w-7xl grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
                    {/* Image + floating card */}
                    <AnimateOnScroll animation="fadeLeft" duration={0.9}>
                        <div className="relative">
                            <div className="rounded-2xl overflow-hidden shadow-xl">
                                <img
                                    src="/about-mission.png"
                                    alt="Herbal preparation"
                                    className="w-full h-[380px] object-cover"
                                />
                            </div>
                            {/* Floating stat */}
                            <div className="absolute -bottom-6 -right-4 sm:right-8 rounded-xl bg-white shadow-xl p-5 border border-[#E0DCCF]">
                                <p className="text-xs font-bold tracking-widest uppercase text-[#8B7A3D]">
                                    Preserving traditions from the heart of
                                </p>
                                <p className="text-lg font-bold text-[#3B5D3B] mt-1">
                                    the Himalayas, 5000+ yrs
                                </p>
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* Text */}
                    <div>
                        <AnimateOnScroll animation="fadeRight" delay={0.1}>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight">
                                A Return to <em className="italic text-[#3B5D3B]">Purity</em>
                            </h2>
                        </AnimateOnScroll>
                        <AnimateOnScroll animation="fadeRight" delay={0.2}>
                            <p className="mt-6 text-[#6B6B60] leading-relaxed text-base">
                                Vedashi was founded on a provocative question: what if modern wellness
                                didn&apos;t abandon ancient wisdom, but perfected it? We began by partnering
                                directly with Ayurvedic physicians and tribal harvesters to create
                                formulations that honor tradition while passing the most rigorous
                                clinical trials.
                            </p>
                        </AnimateOnScroll>
                        <AnimateOnScroll animation="fadeRight" delay={0.3}>
                            <p className="mt-4 text-[#6B6B60] leading-relaxed text-base">
                                Every Vedashi product represents our unwavering commitment to purity,
                                efficacy, and sustainability — bringing you healing that is both ancient
                                and evidence-based.
                            </p>
                        </AnimateOnScroll>
                        <AnimateOnScroll animation="fadeRight" delay={0.4}>
                            <div className="mt-8 flex flex-wrap gap-6">
                                {[
                                    { number: '40+', label: 'Years of Practice' },
                                    { number: '250k+', label: 'Protocols Delivered' },
                                    { number: '98%', label: 'Client Satisfaction' },
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <p className="text-2xl font-bold text-[#3B5D3B]">{stat.number}</p>
                                        <p className="text-xs text-[#6B6B60] mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </AnimateOnScroll>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          JOURNEY/TIMELINE — "The Path of Prakriti"
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 lg:py-28 px-4 bg-white relative z-10">
                <div className="mx-auto max-w-4xl">
                    <AnimateOnScroll animation="fadeUp">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C]">
                                The Path of <em className="italic text-[#3B5D3B]">Prakriti</em>
                            </h2>
                            <p className="mt-3 text-[#6B6B60] italic">
                                Milestones in our journey to bring Ayurveda to the modern world
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="space-y-0">
                        {[
                            {
                                icon: Leaf,
                                title: 'The Foundation',
                                desc: 'Vedashi was established by a collective of Ayurvedic Vaidyas and modern physicians united by one mission: to clinically validate traditional healing.',
                                year: '1984',
                            },
                            {
                                icon: FlaskConical,
                                title: 'The Vedashi Protocol',
                                desc: 'Developed our proprietary extraction process that preserves the full-spectrum bioactive compounds of raw botanicals — a breakthrough in Ayurvedic pharmacology.',
                                year: '2001',
                            },
                            {
                                icon: Award,
                                title: 'Global Recognition',
                                desc: 'Received international clinical accreditation and began partnerships with leading wellness institutions across 12 countries.',
                                year: '2015',
                            },
                            {
                                icon: Users,
                                title: 'Community of Healers',
                                desc: 'Launched the Vedashi Practitioner Network, training over 1,200 certified Ayurvedic consultants worldwide.',
                                year: '2023',
                            },
                        ].map((event, i) => (
                            <AnimateOnScroll key={i} animation="fadeUp" delay={i * 0.1}>
                                <div className="flex gap-6 items-start group">
                                    <div className="flex-shrink-0 flex flex-col items-center">
                                        <div className="h-12 w-12 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center group-hover:bg-[#3B5D3B]/20 transition-colors">
                                            <event.icon className="h-5 w-5 text-[#3B5D3B]" />
                                        </div>
                                        {i < 3 && <div className="w-0.5 h-16 bg-[#E0DCCF] mt-2" />}
                                    </div>
                                    <div className="pb-8 pt-1">
                                        <span className="text-[11px] font-bold tracking-widest text-[#8B7A3D] uppercase">{event.year}</span>
                                        <h3 className="text-xl font-bold text-[#2C2C2C] mt-1">{event.title}</h3>
                                        <p className="mt-2 text-sm text-[#6B6B60] leading-relaxed max-w-md">{event.desc}</p>
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          TEAM — "Meet the Visionaries"
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 lg:py-28 px-4 relative z-10">
                <div className="mx-auto max-w-7xl">
                    <AnimateOnScroll animation="fadeUp">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C]">
                                Meet the Visionaries
                            </h2>
                            <p className="mt-3 text-[#6B6B60] max-w-lg mx-auto">
                                A collective of healers, scientists, and practitioners dedicated to
                                your highest wellness.
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                name: 'Dr. Ananda Prabhu',
                                role: 'Founder & Chief Vaidya',
                                initial: 'A',
                                color: 'bg-[#3B5D3B]/10',
                                desc: 'Fourth-generation Ayurvedic physician with a doctorate in Integrative Medicine from Harvard.',
                            },
                            {
                                name: 'Maya Chen',
                                role: 'Head of R&D',
                                initial: 'M',
                                color: 'bg-[#8B7A3D]/10',
                                desc: 'Ethnobotanist specializing in bioactive compound extraction from Himalayan medicinal plants.',
                            },
                            {
                                name: 'Ashwin Mehta',
                                role: 'Director of Clinical Operations',
                                initial: 'A',
                                color: 'bg-[#3B5D3B]/10',
                                desc: 'MD with 20+ years in integrative oncology, overseeing all clinical trials and practitioner training.',
                            },
                        ].map((member, i) => (
                            <AnimateOnScroll key={i} animation="fadeUp" delay={i * 0.12}>
                                <div className="rounded-2xl border border-[#E0DCCF] bg-white p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group shadow-sm">
                                    <div className={`mx-auto mb-5 h-20 w-20 rounded-full ${member.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                                        <span className="text-2xl font-bold text-[#3B5D3B]">{member.initial}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#2C2C2C]">{member.name}</h3>
                                    <p className="text-xs font-bold tracking-widest text-[#8B7A3D] uppercase mt-1">{member.role}</p>
                                    <p className="mt-3 text-sm text-[#6B6B60] leading-relaxed">{member.desc}</p>
                                </div>
                            </AnimateOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          VALUES — "Sourced by Nature, Verified by Science"
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 lg:py-28 px-4 bg-[#F5F2E8] relative overflow-hidden z-10">
                {/* Realistic Leaf Watermarks */}
                <img
                    src="/leaf-watermark.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute top-[-8%] right-[-10%] w-[300px] sm:w-[450px] pointer-events-none opacity-[0.07] rotate-[30deg] transform-gpu animate-float select-none"
                    style={{ animationDuration: '9s', filter: 'blur(0.5px)' }}
                />
                <img
                    src="/leaf-watermark.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute bottom-[-8%] left-[-10%] w-[250px] sm:w-[380px] pointer-events-none opacity-[0.05] -rotate-[40deg] transform-gpu animate-float select-none"
                    style={{ animationDuration: '11s', animationDelay: '3s', filter: 'blur(0.5px)', transform: 'scaleX(-1) rotate(-40deg)' }}
                />
                <div className="mx-auto max-w-7xl relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <AnimateOnScroll animation="fadeLeft" duration={0.9}>
                            <div>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight italic">
                                    Sourced by Nature,<br />Verified by Science.
                                </h2>
                                <p className="mt-5 text-[#6B6B60] text-base leading-relaxed">
                                    Vedashi combines the purest Ayurvedic ingredients with rigorous
                                    scientific validation, ensuring every product delivers measurable
                                    results without compromise.
                                </p>
                            </div>
                        </AnimateOnScroll>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'Farm-to-Formula', desc: 'Direct sourcing from certified organic farms across India & Nepal.', icon: Leaf },
                                { title: 'Yoga Integration', desc: 'Complementary asana guides tailored to each product\u2019s therapeutic goal.', icon: Heart },
                                { title: 'Clinical Purity', desc: 'Every batch tested for 200+ contaminants by independent labs.', icon: ShieldCheck },
                                { title: 'Online Satsangs', desc: 'Monthly virtual gatherings with our founding physicians.', icon: BookOpen },
                            ].map((val, i) => (
                                <AnimateOnScroll key={i} animation="scaleUp" delay={i * 0.1}>
                                    <div className="rounded-2xl bg-white border border-[#E0DCCF] p-6 transition-all hover:shadow-md group shadow-sm">
                                        <div className="h-10 w-10 rounded-lg bg-[#3B5D3B]/10 flex items-center justify-center mb-3 group-hover:bg-[#3B5D3B]/20 transition-colors">
                                            <val.icon className="h-5 w-5 text-[#3B5D3B]" />
                                        </div>
                                        <h3 className="font-semibold text-sm text-[#2C2C2C]">{val.title}</h3>
                                        <p className="mt-1.5 text-xs text-[#6B6B60] leading-relaxed">{val.desc}</p>
                                    </div>
                                </AnimateOnScroll>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          TESTIMONIAL
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 lg:py-28 px-4 relative z-10">
                <AnimateOnScroll animation="fadeUp" className="mx-auto max-w-3xl text-center">
                    <div className="flex justify-center gap-1 mb-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-[#8B7A3D] text-[#8B7A3D]" />
                        ))}
                    </div>
                    <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3B5D3B] leading-snug italic">
                        &ldquo;Vedashi hasn&apos;t just improved my health; it has fundamentally changed
                        how I relate to my body and the seasons. It&apos;s the sanctuary I didn&apos;t know I needed.&rdquo;
                    </blockquote>
                    <div className="mt-8 flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center border-2 border-[#3B5D3B]/20">
                            <span className="text-xl font-bold text-[#3B5D3B]">R</span>
                        </div>
                        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B6B60] uppercase">
                            Dr. Rebecca Lane — Integrative Physician, London
                        </p>
                    </div>
                </AnimateOnScroll>
            </section>

            {/* ═══════════════════════════════════════════════════════════
          CTA — "Ready to return to your true nature?"
      ═══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 px-4">
                <AnimateOnScroll animation="scaleUp" className="mx-auto max-w-4xl">
                    <div className="rounded-3xl bg-[#3B5D3B] px-8 sm:px-16 py-14 sm:py-20 text-center relative overflow-hidden">
                        {/* Decorative SVG */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 opacity-10 pointer-events-none">
                            <svg viewBox="0 0 200 200" fill="white">
                                <path d="M100 0C120 60 200 80 200 140C200 180 160 200 100 200C40 200 0 180 0 140C0 80 80 60 100 0Z" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-10 pointer-events-none rotate-180">
                            <svg viewBox="0 0 200 200" fill="white">
                                <path d="M100 0C120 60 200 80 200 140C200 180 160 200 100 200C40 200 0 180 0 140C0 80 80 60 100 0Z" />
                            </svg>
                        </div>

                        <h2 className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                            Ready to return to your{' '}
                            <em className="italic text-[#C9B87A]">true nature</em>?
                        </h2>
                        <p className="relative z-10 mt-4 text-[#C9B87A]/80 text-sm sm:text-base max-w-lg mx-auto">
                            Let our practitioners guide you toward a personalized journey of
                            deep, lasting transformation.
                        </p>
                        <div className="relative z-10 mt-8">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2.5 rounded-lg bg-[#C9B87A] px-8 py-3.5 text-sm font-semibold text-[#2C2C2C] transition-all duration-300 hover:bg-[#D4C38A] hover:-translate-y-0.5 shadow-lg"
                            >
                                Begin Your Journey
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </AnimateOnScroll>
            </section>
        </div>
    );
}

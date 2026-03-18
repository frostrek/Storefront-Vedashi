'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRight, Star, Sparkles, Leaf, ShieldCheck, Beaker, Heart, Stethoscope, Salad, FlaskConical, CalendarCheck, Loader2 } from 'lucide-react';
import { getBestSellers, getFeaturedProducts as fetchFeatured, subscribeNewsletter } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import ProductReel from '@/components/ProductReel';
import HeroSection from '@/components/HeroSection';
import { SkeletonProductGrid } from '@/components/Skeleton';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email.');
      return;
    }
    setIsSubscribing(true);
    try {
      const res = await subscribeNewsletter(newsletterEmail);
      if (res.success) {
        toast.success('Welcome to the Healed.');
        setNewsletterEmail('');
      } else {
        toast.error(res.message || 'Failed to subscribe.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [bestRes, featuredRes] = await Promise.all([
          getBestSellers({ limit: 12 }),
          fetchFeatured()
        ]);
        setBestSellers(bestRes.data);
        setFeaturedProducts(featuredRes);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
        setFeaturedLoading(false);
      }
    }
    loadData();
  }, []);

  const allProducts = featuredProducts.length > 0 ? featuredProducts : bestSellers;
  const productsLoading = featuredLoading && loading;

  return (
    <div className="bg-cream relative">
      {/* Ayurvedic Botanical Texture Background - Absolute ensures it doesn't overlap global footer */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.10]" style={{
        backgroundImage: `url("/ayurvedic-texture.png")`,
        backgroundSize: '400px 400px',
        backgroundRepeat: 'repeat'
      }} />
      {/* ═══ 1. HERO ═══ */}
      <HeroSection />

      {/* ═══ 2. DOSHA DISCOVERY ═══ */}
      <section className="py-12 sm:py-20 lg:py-24 px-4">
        <AnimateOnScroll animation="fadeUp" className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-[#F5F2E8] border border-[#E0DCCF] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left — Text */}
              <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-[#8B7A3D]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B7A3D]">
                    Discover Your Nature
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight">
                  What is your unique <em className="italic">Dosha</em>?
                </h2>
                <p className="mt-5 text-[#6B6B60] text-base leading-relaxed max-w-lg">
                  In Ayurveda, your &lsquo;Dosha&rsquo; is your unique mind-body type.
                  Knowing your Vata, Pitta, or Kapha profile is the first step
                  toward personalized healing and lasting energy.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#3B5D3B] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#2D4A2D] hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Start Assessment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="text-xs text-[#8B7A3D] font-medium">Takes only 3 minutes</span>
                </div>
              </div>
              {/* Right — Image + Testimonial */}
              <div className="relative hidden lg:block min-h-[420px]">
                <img src="/dosha-woman.png" alt="Woman enjoying herbal tea" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-8 right-8 left-8 max-w-xs ml-auto">
                  <div className="rounded-xl bg-white/95 backdrop-blur-md p-5 shadow-xl">
                    <p className="text-sm text-[#2C2C2C] italic leading-relaxed">
                      &ldquo;This assessment changed how I view my
                      energy cycles entirely. It&apos;s more than a
                      quiz; it&apos;s a mirror.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#3B5D3B]">A</span>
                      </div>
                      <span className="text-[11px] font-bold tracking-widest text-[#6B6B60] uppercase">Amanda K.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>


      {/* ═══ 4. TRUST & SCIENCE ═══ */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 relative overflow-hidden bg-cream">
        {/* Realistic Botanical Leaf Watermarks */}
        <img
          src="/leaf-watermark.png"
          alt=""
          aria-hidden="true"
          className="absolute top-[-5%] right-[-8%] w-[350px] sm:w-[500px] lg:w-[650px] pointer-events-none opacity-[0.08] rotate-[25deg] transform-gpu animate-float select-none"
          style={{ animationDuration: '8s', filter: 'blur(0.5px)' }}
        />
        <img
          src="/leaf-watermark.png"
          alt=""
          aria-hidden="true"
          className="absolute bottom-[-10%] left-[-12%] w-[280px] sm:w-[400px] lg:w-[500px] pointer-events-none opacity-[0.06] -rotate-[50deg] transform-gpu animate-float select-none"
          style={{ animationDuration: '10s', animationDelay: '2s', filter: 'blur(0.5px)', transform: 'scaleX(-1) rotate(-50deg)' }}
        />
        <img
          src="/leaf-watermark.png"
          alt=""
          aria-hidden="true"
          className="absolute top-[40%] left-[50%] w-[150px] sm:w-[200px] pointer-events-none opacity-[0.04] rotate-[140deg] transform-gpu animate-float select-none"
          style={{ animationDuration: '12s', animationDelay: '1s', filter: 'blur(1px)' }}
        />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Image Collage */}
            <AnimateOnScroll animation="fadeLeft" duration={0.9}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img src="/trust-lab.png" alt="Lab testing" className="w-full h-48 sm:h-56 object-cover" />
                  </div>
                  <div className="rounded-2xl bg-[#3B5D3B] p-6 text-white">
                    <p className="text-3xl font-bold">100%</p>
                    <p className="text-xs font-bold tracking-widest uppercase mt-1 text-[#C9B87A]">Purity Lab-Tested</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl bg-white border border-[#E0DCCF] p-6 text-center">
                    <Stethoscope className="h-6 w-6 mx-auto text-[#8B7A3D] mb-2" />
                    <p className="text-3xl font-bold text-[#2C2C2C]">50k+</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase mt-1 text-[#8B7A3D]">Lives Healed</p>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img src="/trust-healing.png" alt="Healing space" className="w-full h-48 sm:h-56 object-cover" />
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right — Text */}
            <div>
              <AnimateOnScroll animation="fadeRight" delay={0.1}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3B5D3B] leading-tight italic">
                  Rooted in Nature, Verified by Science
                </h2>
                <p className="mt-5 text-[#6B6B60] text-base leading-relaxed">
                  We don&apos;t just believe in tradition; we measure its success. Every
                  Vedashi formula undergoes rigorous multi-stage clinical trials
                  and third-party purity testing.
                </p>
              </AnimateOnScroll>

              <div className="mt-10 space-y-8">
                {[
                  { icon: FlaskConical, title: 'Clinical Transparency', desc: 'Full access to batch-specific lab results via QR codes on every bottle.' },
                  { icon: Leaf, title: 'Ethical Sourcing', desc: 'Fair-trade partnerships with tribal farmers across the Himalayan belt.' },
                  { icon: ShieldCheck, title: 'Physician Formulated', desc: 'Direct oversight by our board of certified MDs and Ayurvedic Vaidyas.' },
                ].map((item, i) => (
                  <AnimateOnScroll key={i} animation="fadeRight" delay={0.2 + i * 0.1}>
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-[#3B5D3B]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2C2C2C] text-base">{item.title}</h3>
                        <p className="mt-1 text-sm text-[#6B6B60] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. HEALING SERVICES ═══ */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 bg-white">
        <div className="mx-auto max-w-7xl text-center">
          <AnimateOnScroll animation="fadeUp">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C]">
              The Path to <em className="italic text-[#3B5D3B]">Prakriti</em>
            </h2>
            <p className="mt-3 text-[#6B6B60] text-base max-w-2xl mx-auto italic">
              Beyond products, we offer a comprehensive healing ecosystem to restore your natural harmony.
            </p>
          </AnimateOnScroll>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, title: 'Panchakarma', desc: 'Five-fold detoxification therapy for complete cellular renewal.', color: 'bg-[#F5F2E8]' },
              { icon: Salad, title: 'Dietary Guidance', desc: 'Personalized nutrition plans aligned with your unique Prakriti.', color: 'bg-[#E8F0E8]' },
              { icon: Beaker, title: 'Herbal Therapy', desc: 'Custom-compounded remedies from our private botanical garden.', color: 'bg-[#F0F0E4]' },
              { icon: CalendarCheck, title: 'Lifestyle Coaching', desc: 'Daily routines (Dinacharya) to harmonize with cosmic cycles.', color: 'bg-[#F5EFE4]' },
            ].map((service, i) => (
              <AnimateOnScroll key={i} animation="fadeUp" delay={i * 0.1}>
                <div className={`${service.color} rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group`}>
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
                    <service.icon className="h-6 w-6 text-[#3B5D3B]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#2C2C2C]">{service.title}</h3>
                  <p className="mt-2 text-sm text-[#6B6B60] leading-relaxed">{service.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. TESTIMONIALS ═══ */}
      <section className="py-12 sm:py-20 lg:py-24 px-4">
        <AnimateOnScroll animation="fadeUp" className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-[#8B7A3D] text-[#8B7A3D]" />
            ))}
          </div>
          <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3B5D3B] leading-snug italic">
            &ldquo;Vedashi hasn&apos;t just improved my health; it has fundamentally changed
            how I relate to my body and the seasons.&rdquo;
          </blockquote>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center border-2 border-[#3B5D3B]/20">
              <span className="text-xl font-bold text-[#3B5D3B]">S</span>
            </div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B6B60] uppercase">
              Wellness Consultant, Madrid
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fadeUp" delay={0.2} className="mx-auto max-w-4xl">
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Priya M.', role: 'Yoga Instructor', text: 'The Ashwagandha Gold has transformed my energy levels. I feel balanced throughout the day without any crashes.', rating: 5 },
              { name: 'David L.', role: 'Naturopath', text: 'Finally, an Ayurvedic brand that combines authentic formulations with modern clinical rigor. My patients love it.', rating: 5 },
              { name: 'Aisha R.', role: 'Wellness Coach', text: 'The Triphala Detox has become a staple in my daily routine. Gentle yet effective — exactly what Ayurveda should be.', rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="rounded-2xl border border-[#E0DCCF] bg-white p-6 text-left transition-all hover:shadow-md">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-[#8B7A3D] text-[#8B7A3D]" />
                  ))}
                </div>
                <p className="text-sm text-[#6B6B60] leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center text-[#3B5D3B] font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2C]">{testimonial.name}</p>
                    <p className="text-xs text-[#6B6B60]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </section>

      {/* ═══ 7. NEWSLETTER ═══ */}
      <section className="py-12 sm:py-20 lg:py-24 px-4">
        <AnimateOnScroll animation="scaleUp" className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-[#3B5D3B] px-8 sm:px-16 py-14 sm:py-20 text-center relative overflow-hidden">
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
              Join the <em className="italic text-[#C9B87A]">Healed</em>.
            </h2>
            <p className="relative z-10 mt-4 text-[#C9B87A]/80 text-sm sm:text-base max-w-lg mx-auto">
              Receive weekly Ayurvedic insights, seasonal recipes, and early access to physician-curated kits.
            </p>
            <form onSubmit={handleSubscribe} className="relative z-10 mt-8 flex flex-col sm:flex-row max-w-md mx-auto justify-center gap-3">
              <input 
                type="email" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email" 
                className="w-full sm:w-auto flex-grow rounded-lg border-2 border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/80 focus:outline-none focus:border-white/60 backdrop-blur-sm transition-all" 
                disabled={isSubscribing}
                required
              />
              <button 
                type="submit" 
                disabled={isSubscribing}
                className="w-full sm:w-auto rounded-lg bg-[#C9B87A] px-8 py-3 text-sm font-semibold text-[#2C2C2C] transition-all hover:bg-[#D4C38A] hover:-translate-y-0.5 shadow-lg whitespace-nowrap flex items-center justify-center disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
              </button>
            </form>
            <p className="relative z-10 mt-6 text-[10px] text-white/40 tracking-wide">We respect your peace. Unsubscribe at any time.</p>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  );
}

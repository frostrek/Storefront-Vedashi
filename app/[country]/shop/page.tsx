'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Leaf,
  Pill,
  Sprout,
  Stethoscope,
  Sparkles,
  Wind,
  Milk,
  Bath,
  Heart,
  ArrowRightCircle,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import { Product } from '@/types';
import { getBestSellers, getNewArrivals } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { SkeletonProductGrid } from '@/components/Skeleton';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';

const categories = [
  { name: 'Herbal Supplements', color: 'bg-[#EBF3EB]', slug: 'herbal-supplements' },
  { name: 'Ayurvedic Herbs', color: 'bg-[#EBF3EB]', slug: 'ayurvedic-herbs' },
  { name: 'Health Conditions', color: 'bg-[#EBF3EB]', slug: 'health-conditions' },
  { name: 'Skin Care', color: 'bg-[#EBF3EB]', slug: 'skin-care' },
  { name: 'Hair Care', color: 'bg-[#EBF3EB]', slug: 'hair-care' },
  { name: 'Natural Foods', color: 'bg-[#EBF3EB]', slug: 'natural-foods' },
  { name: 'Personal Care', color: 'bg-[#EBF3EB]', slug: 'personal-care' },
];

export default function ShopPage() {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bestRes, newRes] = await Promise.all([
          getBestSellers({ limit: 4 }),
          getNewArrivals({ limit: 4 })
        ]);
        setBestSellers(bestRes.data);
        setNewArrivals(newRes.data);
      } catch (err) {
        console.error('Failed to load shop data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-[#FAF9F6] min-h-screen relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none z-0 overflow-hidden">
        <Leaf className="absolute top-[10%] -left-20 w-[400px] h-[400px] rotate-45 text-[#3B5D3B]" />
        <Leaf className="absolute top-[40%] -right-20 w-[600px] h-[600px] -rotate-12 text-[#3B5D3B]" />
        <Leaf className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rotate-180 text-[#3B5D3B]" />
      </div>

      {/* 1. BANNER REEL */}
      <div className="relative z-10">
        <HeroCarousel />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* 2. SHOP BY CATEGORY - FULL WIDTH GRID */}
        <section className="relative py-24 px-4 sm:px-8 -mx-4 sm:-mx-8 overflow-hidden bg-white/40">
          {/* Layered Luxury Pattern */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'url(/backgrounds/bg3.png)',
              backgroundSize: '1200px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat'
            }}
          />

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-64 h-64 opacity-[0.08] pointer-events-none -translate-x-12 -translate-y-12">
            <img src="/backgrounds/bg1.png" className="w-full h-full object-contain rotate-180" alt="" />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.08] pointer-events-none translate-x-12 -translate-y-12">
            <img src="/backgrounds/bg1.png" className="w-full h-full object-contain -rotate-90" alt="" />
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.08] pointer-events-none -translate-x-12 translate-y-12">
            <img src="/backgrounds/bg1.png" className="w-full h-full object-contain rotate-90" alt="" />
          </div>
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.08] pointer-events-none translate-x-12 translate-y-12">
            <img src="/backgrounds/bg1.png" className="w-full h-full object-contain" alt="" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-16 px-4">
              <h2 className="text-4xl font-bold text-gray-900 font-serif tracking-tight mb-4">Shop by Category</h2>
              <p className="text-gray-500 font-medium italic mb-8 max-w-xl mx-auto">Explore our curated collections of traditional wisdom for modern living</p>
              <div className="w-24 h-1 bg-[#8B7A3D] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8">
              {categories.map((cat, i) => (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center gap-6 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className={`relative w-full aspect-square rounded-full ${cat.color} flex items-center justify-center shadow-sm group-hover:shadow-[0_20px_50px_rgba(59,93,59,0.12)] group-hover:bg-[#E2F0E2] transition-all duration-700 overflow-hidden isolate`}>
                    {/* Icon Render - Complete Illustration */}
                    <img
                      src={`/icons/shop/${cat.slug}.png`}
                      alt={cat.name}
                      className="w-[85%] h-[85%] object-contain relative z-10 mix-blend-multiply opacity-95 group-hover:opacity-100 transition-all duration-[800ms] cubic-bezier(0.34,1.56,0.64,1) group-hover:scale-110 pointer-events-none"
                    />

                    {/* Hover Pulse Effect */}
                    <div className="absolute inset-0 rounded-full border border-[#3B5D3B]/20 scale-100 opacity-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                  </div>

                  <div className="text-center">
                    <span className="text-base font-bold text-gray-800 group-hover:text-[#3B5D3B] transition-colors leading-tight">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 3. TRENDING NOW SECTION - LUXURY PATTERN */}
        <section className="relative -mx-4 px-4 sm:-mx-8 sm:px-8 py-24 overflow-hidden">
          {/* Rich Texture Background */}
          <div className="absolute inset-0 bg-[#F5F2E8]/60" />
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: 'url(/ayurvedic-texture.png)',
              backgroundSize: '1000px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat'
            }}
          />

          <AnimateOnScroll animation="fadeUp">
            <div className="relative z-10">
              <div className="flex flex-col items-center mb-16">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] w-12 bg-[#8B7A3D]" />
                  <span className="text-[#8B7A3D] text-xs font-black uppercase tracking-[0.4em]">Trending Now</span>
                  <div className="h-[1px] w-12 bg-[#8B7A3D]" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 font-serif text-center mb-2">The Golden Collection</h2>
                <p className="text-gray-500 font-medium italic">Our most revered daily essentials</p>
              </div>

              {loading ? (
                <SkeletonProductGrid count={4} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {bestSellers.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </div>
              )}

              <div className="mt-16 text-center">
                <Link
                  href="/products?sort=popular"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-[#3B5D3B] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2D4A2D] transition-all shadow-xl hover:shadow-[0_20px_40px_rgba(59,93,59,0.3)]"
                >
                  Explore Entire Repository
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </section>

        {/* 4. PROMO GRID - MODERN LUXURY */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 relative min-h-[450px] rounded-[40px] overflow-hidden group shadow-2xl">
            <img
              src="/shop-hero-promo.png"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt="Ayurvedic Rituals"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-10 sm:p-16">
              <div className="max-w-xl">
                <span className="inline-block px-4 py-1 bg-[#C9B87A] text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-full mb-6">Limited Apothecary</span>
                <h3 className="text-white text-5xl sm:text-6xl font-bold font-serif mb-6 leading-[1.1]">Seasonal<br />Immunity Kits.</h3>
                <p className="text-white/80 text-lg mb-10 font-medium leading-relaxed italic">Hand-blended by master Vaidyas for constitutional harmony during seasonal shifts.</p>
                <Link href="/products" className="group inline-flex items-center gap-3 px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-[#F5F2E8] transition-all shadow-2xl">
                  Acquire the Kit
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-[#3B5D3B] rounded-3xl p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden group">
            {/* Subtle Texture Overlay */}
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: 'url(/ayurvedic-texture.png)',
                backgroundSize: '400px',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat'
              }}
            />
            <div className="relative z-10">
              <Award className="h-10 w-10 text-[#C9B87A] mb-6" />
              <h3 className="text-2xl font-serif font-bold mb-4">Purest Botanicals.</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-8">
                Every ingredient is sourced from its native soil to ensure maximum therapeutic potency.
              </p>
              <ul className="space-y-3 mb-8">
                {['Lab-Tested Purity', 'Ethically Sourced', 'Zero Additives'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs font-semibold">
                    <Zap className="h-3 w-3 text-[#C9B87A]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/about" className="text-sm font-bold border-b border-[#C9B87A] pb-1 text-[#C9B87A] hover:text-white hover:border-white transition-all">
                Learn our Process
              </Link>
            </div>
            {/* Decorative leaf */}
            <Leaf className="absolute -bottom-8 -right-8 h-40 w-40 text-white/10 rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-24" />
          </div>
        </section>

        {/* 5. NEW ARRIVALS - CLEAN & RADIANT */}
        <section className="relative -mx-4 px-4 sm:-mx-8 sm:px-8 py-16 overflow-hidden">
          {/* Subtle floral background */}
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: 'url(/backgrounds/bg2.png)',
              backgroundSize: '1200px',
              backgroundPosition: 'bottom right',
              backgroundRepeat: 'no-repeat'
            }}
          />

          <div className="relative z-10">
            <AnimateOnScroll animation="fadeUp">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#3B5D3B] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                    <Leaf className="h-3 w-3" /> Still Warm From The Lab
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 font-serif">Apothecary Newness</h2>
                  <p className="text-gray-500 font-medium italic mt-2">Freshly formulated for your constitutional balance</p>
                </div>
                <Link href="/products?sort=newest" className="group flex items-center gap-2 text-sm font-bold text-[#3B5D3B] hover:text-[#8B7A3D] transition-colors">
                  Observe All Innovations
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <SkeletonProductGrid count={4} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {newArrivals.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </div>
              )}
            </AnimateOnScroll>
          </div>
        </section>

        {/* 6. VEDIC COMMUNITY BANNER - SOFTWARE INSPIRED */}
        <section className="relative overflow-hidden bg-[#1D2B1D] rounded-[40px] p-10 sm:p-20 shadow-2xl group">
          {/* subtle monogram texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: 'url(/ayurvedic-texture.png)',
              backgroundSize: '600px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat'
            }}
          />
          {/* Decorative accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B5D3B] rounded-full blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B7A3D] rounded-full blur-[120px] opacity-20" />

          <div className="relative z-10 flex flex-col xl:flex-row items-center gap-12 text-center xl:text-left">
            <div className="flex flex-col items-center xl:items-start gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-16 h-16 rounded-full border-4 border-[#1D2B1D] bg-[#3B5D3B]/20 overflow-hidden ring-1 ring-white/10">
                    <img src={`https://ui-avatars.com/api/?name=User+${i}&background=3B5D3B&color=fff`} alt="Vedic Devotee" />
                  </div>
                ))}
                <div className="w-16 h-16 rounded-full border-4 border-[#1D2B1D] bg-[#8B7A3D] flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
                  +250k
                </div>
              </div>

              <div>
                <h4 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-4 leading-tight">Empower Your Wellness Odyssey.</h4>
                <p className="text-white/60 text-lg max-w-2xl font-medium">
                  Join a global community dedicated to conscious living and Ayurvedic wisdom.
                  Synchronize your health with nature's rhythm.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto px-10 py-5 bg-[#C9B87A] text-black font-black uppercase tracking-[0.2em] rounded-2xl text-[11px] hover:bg-white transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                Join Creative Force
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl text-[11px] hover:bg-white/5 transition-all"
              >
                Our Philosophy
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

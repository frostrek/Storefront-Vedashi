'use client';

import { useState, useEffect, useRef } from 'react';
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
import { getBestSellers, getNewArrivals, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductReel from '@/components/ProductReel';
import { trackEcommerce, EcommerceItem } from '@/lib/analytics/gtag';
import { SkeletonProductGrid } from '@/components/Skeleton';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';

export default function ShopPage() {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bestRes, newRes, catRes] = await Promise.all([
          getBestSellers({ limit: 10 }),
          getNewArrivals({ limit: 10 }),
          getCategories()
        ]);
        setBestSellers(bestRes.data);
        setNewArrivals(newRes.data);
        // Only take top-level categories for the hero section
        setDbCategories(catRes.filter((c: any) => !c.parent_id));
      } catch (err) {
        console.error('Failed to load shop data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const viewListHashRef = useRef<string>('');
  useEffect(() => {
    const allItems = [...bestSellers, ...newArrivals].slice(0, 15);
    if (allItems.length === 0) return;

    const currentHash = allItems.map(p => p.product_id).join(',');
    if (viewListHashRef.current === currentHash) return;
    
    viewListHashRef.current = currentHash;
    const gaItems: EcommerceItem[] = allItems.map((item, index) => ({
      item_id: item.product_id,
      item_name: item.product_name,
      price: Number(item.price ?? 0),
      quantity: 1,
      index: index + 1,
      item_list_name: 'Shop Discovery Highlights',
      item_category: item.category,
      item_brand: item.brand
    }));
    
    trackEcommerce('view_item_list', {
      currency: 'INR',
      value: gaItems.reduce((acc, curr) => acc + curr.price, 0),
      items: gaItems
    });
  }, [bestSellers, newArrivals]);

  // Map of category slugs to colors for consistent aesthetic
  const categoryColors: Record<string, string> = {
    'herbal-supplement': 'bg-[#EBF3EB]',
    'Ayurvedic-Herbs': 'bg-[#EBF3EB]', // DB slug for Ayurvedic Herbs
    'health-condition': 'bg-[#EBF3EB]',
    'skin-care': 'bg-[#EBF3EB]',
    'hair-care': 'bg-[#EBF3EB]',
    'Natural-Foods': 'bg-[#EBF3EB]',
    'Personal-Care': 'bg-[#EBF3EB]',
  };

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

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 pt-0 pb-16 space-y-16">

        {/* 2. SHOP BY CATEGORY - FULL WIDTH GRID */}
        <section className="relative pt-16 pb-16 px-4 sm:px-8 -mx-4 sm:-mx-8 overflow-hidden bg-white/40">
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
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Shop by Category</h2>
              <p className="text-gray-500 font-medium italic mb-8 max-w-xl mx-auto">Explore our curated collections of traditional wisdom for modern living</p>
              <div className="w-24 h-1 bg-[#8B7A3D] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8">
              {dbCategories.slice(0, 7).map((cat, i) => (
                <Link
                  key={cat.category_id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-6 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className={`relative w-full aspect-square rounded-full ${categoryColors[cat.slug] || 'bg-[#F2F4F2]'} flex items-center justify-center shadow-sm group-hover:shadow-[0_20px_50px_rgba(59,93,59,0.12)] group-hover:bg-[#E2F0E2] transition-all duration-700 overflow-hidden isolate`}>
                    {/* Icon Render - Dynamic mapping to local icons */}
                    <img
                      src={`/icons/shop/${cat.slug}.png`}
                      alt={cat.name}
                      onError={(e) => {
                        // Fallback if icon for new category doesn't exist
                        (e.target as HTMLImageElement).src = '/icons/shop/category-sprite.png';
                      }}
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

        {/* 3. BEST SELLERS REEL SECTION */}
        <section className="relative -mx-4 sm:-mx-8 py-20 overflow-hidden bg-[#FBF9F2]">
          {/* Layered Luxury Pattern */}
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage: 'url(/backgrounds/bg1.png)',
              backgroundSize: '1000px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat'
            }}
          />

          <div className="max-w-[1440px] mx-auto relative z-10 pb-8">
            <ProductReel
              products={bestSellers}
              loading={loading}
              title="Best Sellers"
              subtitle="Shop our most loved essentials"
              viewAllLink="/products?sort=popular&bestSeller=true"
              viewAllText="Explore our Best Sellers"
            />
          </div>
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
                <h3 className="text-white text-5xl sm:text-6xl font-bold mb-6 leading-[1.1]">Seasonal<br />Immunity Kits.</h3>
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
              <h3 className="text-2xl font-bold mb-4">Purest Botanicals.</h3>
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
            <ProductReel
              products={newArrivals}
              loading={loading}
              title="New Arrivals"
              subtitle="Discover the newest additions to our natural wellness collection."
              viewAllLink="/products?newArrival=true"
              viewAllText="Shop New Arrivals"
            />
          </div>
        </section>


      </div>
    </div>
  );
}

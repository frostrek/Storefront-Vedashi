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
  Zap,
  Plus
} from 'lucide-react';
import HeroCarousel, { HeroSlide, HeroSettings } from '@/components/HeroCarousel';
import { Product } from '@/types';
import { getBestSellers, getNewArrivals, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductReel from '@/components/ProductReel';
import BestSellerShowcase from '@/components/BestSellerShowcase';
import { trackEcommerce, EcommerceItem } from '@/lib/analytics/gtag';
import { SkeletonProductGrid } from '@/components/Skeleton';
import { AnimateOnScroll } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import NeedHelpSection from '@/components/NeedHelpSection';
import BrandReel from '@/components/BrandReel';

export interface HomeClientProps {
  initialBestSellers?: Product[];
  initialNewArrivals?: Product[];
  initialCategories?: any[];
  initialHeroSlides?: HeroSlide[];
  initialHeroSettings?: HeroSettings;
}

export default function HomeClientPage({
  initialBestSellers = [],
  initialNewArrivals = [],
  initialCategories = [],
  initialHeroSlides = [],
  initialHeroSettings = undefined,
}: HomeClientProps) {
  const router = useRouter();
  const params = useParams();
  const country = params?.country as string || 'in';

  const [bestSellers, setBestSellers] = useState<Product[]>(initialBestSellers);
  const [newArrivals, setNewArrivals] = useState<Product[]>(initialNewArrivals);
  const [allCategories, setAllCategories] = useState<any[]>(initialCategories);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we didn't get initial data, fetch it
    if (bestSellers.length > 0) return;

    setLoading(true);
    async function loadData() {
      try {
        const [bestRes, newRes, catRes] = await Promise.all([
          getBestSellers({ limit: 10 }),
          getNewArrivals({ limit: 10 }),
          getCategories(true)
        ]);
        setBestSellers(bestRes.data);
        setNewArrivals(newRes.data);
        setAllCategories(catRes);
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
    'herbal-supplement': 'bg-[#F5F2E8]',
    'Ayurvedic-Herbs': 'bg-[#F5F2E8]',
    'dry-fruits--snacks': 'bg-[#F5F2E8]',
    'health-condition': 'bg-[#F5F2E8]',
    'skin-care': 'bg-[#F5F2E8]',
    'hair-care': 'bg-[#F5F2E8]',
    'Natural-Foods': 'bg-[#F5F2E8]',
    'Personal-Care': 'bg-[#F5F2E8]',
    'spices-and-masala': 'bg-[#F5F2E8]',
    'teas-and-superfoods': 'bg-[#F5F2E8]',
    'natural-beauty': 'bg-[#F5F2E8]',
    'gifts--combos': 'bg-[#F5F2E8]',
    'herbal-wellness': 'bg-[#F5F2E8]',
    'indian-fruits': 'bg-[#F5F2E8]'
  };

  // Map of category slugs to specific image paths to avoid full sprite sheets
  const categoryImages: Record<string, string> = {
    'herbal-supplement': '/icons/shop/herbal-supplement.png',
    'ayurvedic-herbs': '/icons/shop/ayurvedic-herbs.png',
    'health-condition': '/icons/shop/health-condition.png',
    'skin-care': '/icons/shop/skin-care.png',
    'hair-care': '/icons/shop/hair-care.png',
    'natural-foods': '/icons/shop/natural-foods.png',
    'personal-care': '/icons/shop/personal-care.png',

    // Exact matching for DB slugs
    'dry-fruits--snacks': '/icons/shop/dry-fruits-snacks.png',
    'gifts--combos': '/icons/shop/gifts-and-combos.png',
    'herbal-wellness': '/icons/shop/ayurvedic-herbs.png',
    'spices-and-masala': '/icons/shop/spices-masalas.png',
    'indian-fruits': '/icons/shop/indian-foods.png',
    'teas-and-superfoods': '/icons/shop/teas-and-superfoods.png',
    'natural-beauty': '/icons/shop/natural-beauty.png'
  };

  return (
    <div className="bg-white min-h-screen relative overflow-hidden">
      <h1 className="sr-only">Vedashi — Premium Wellness & Natural Products</h1>
      {/* 1. BANNER REEL */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-8">
        <HeroCarousel initialSlides={initialHeroSlides} initialSettings={initialHeroSettings} />
      </div>

      <div className="relative z-10 pt-0 pb-0">

        {/* 2 & 3 COMBINED TO REMOVE GAP */}
        <div className="flex flex-col">
          {/* 2. SHOP BY CATEGORY - FULL WIDTH GRID */}
          <section className="relative pt-4 sm:pt-8 pb-0 overflow-hidden bg-white">
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
            // style={{
            //   backgroundImage: 'url(/backgrounds/bg3.png)',
            //   backgroundSize: '1200px',
            //   backgroundPosition: 'center',
            //   backgroundRepeat: 'repeat'
            // }} 
            />

            <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative text-center mb-2 px-4">
                <div className="absolute right-6 top-3 hidden lg:block">
                  <Link
                    href={`/${country}/products`}
                    className="group flex items-center gap-2 text-[13px] font-medium text-[#FF0000] hover:text-[#CC0000] transition-all underline decoration-[#FF0000]/30 underline-offset-2 hover:decoration-[#FF0000]"
                  >
                    Explore all products
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
                      Categories
                    </h2>
                    <p className="hidden sm:block text-gray-500 font-medium italic mb-4 max-w-xl mx-auto">
                      Explore our curated collections of traditional wisdom for modern living
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-5"
                  >
                    {allCategories.slice(0, 8).map((cat: any, i: number) => {
                      return (
                        <div
                          key={cat.category_id}
                          onClick={() => {
                            router.push(`/${country}/products?category=${cat.slug}`);
                          }}
                          className="group flex flex-col items-center gap-3 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                        >
                          <div className={`relative w-[85%] sm:w-full mx-auto aspect-[4/3] rounded-xl sm:rounded-2xl ${categoryColors[cat.slug] || 'bg-[#F2F4F2]'} flex items-center justify-center shadow-sm group-hover:shadow-[0_20px_50px_rgba(59,93,59,0.12)] group-hover:bg-[#E2F0E2] transition-all duration-700 overflow-hidden isolate`}>
                            <img
                              src={cat.image_url || categoryImages[cat.slug?.toLowerCase() || ''] || `/icons/shop/${cat.slug}.png`}
                              alt={cat.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/icons/shop/category-sprite.png';
                              }}
                              className="w-full h-full object-cover relative z-10 opacity-90 group-hover:opacity-100 transition-all duration-[800ms] cubic-bezier(0.34,1.56,0.64,1) group-hover:scale-110 pointer-events-none"
                            />

                            {/* Hover Pulse Effect */}
                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-[#3B5D3B]/20 scale-100 opacity-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                          </div>

                          <div className="text-center px-1">
                            <span className="text-[12px] sm:text-base font-bold text-gray-800 group-hover:text-[#3B5D3B] transition-colors leading-tight block line-clamp-2 min-h-[1.5em]">
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile View All - Shop all products */}
              <div className="sm:hidden flex justify-end mt-4">
                <Link
                  href={`/${country}/products`}
                  className="text-[10px] font-medium text-[#FF0000] hover:text-[#CC0000] transition-colors underline decoration-[#FF0000]/30 underline-offset-2"
                >
                  Explore all products
                </Link>
              </div>
            </div>
          </section>

          <section className="relative pt-0 pb-0 overflow-hidden bg-white content-lazy">
            <div className="max-w-[1500px] mx-auto relative z-10">
              <BestSellerShowcase
                products={bestSellers}
                loading={loading}
                title="Best Sellers"
                subtitle="Our most-loved natural wellness essentials, chosen by you."
                viewAllLink={`/${country}/products?bestSeller=true`}
                viewAllText="Shop all Best Sellers"
              />
            </div>
          </section>


        </div>

        {/* 3.5 BRAND REEL */}
        <div className="w-full content-lazy">
          <BrandReel />
        </div>

        {/* 3.6 NEED HELP CHOOSING */}
        <div className="w-full content-lazy">
          <NeedHelpSection />
        </div>

        {/* 5. NEW ARRIVALS - CLEAN & RADIANT */}
        <section className="relative py-0 overflow-hidden bg-white content-lazy">


          <div className="max-w-[1500px] mx-auto relative z-10">
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

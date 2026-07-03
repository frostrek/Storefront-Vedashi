'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { buildPath, getCountryFromPathname } from '@/lib/currency';

// Ad banners that rotate in the left panel
// You can replace these with dedicated promotional images
const adBanners = [
  { src: '/small banners/1.png', href: null },
  { src: '/small banners/2.png', href: null },
  { src: '/small banners/3.png', href: null },
  { src: '/small banners/4.png', href: null },
];

interface BestSellerShowcaseProps {
  products: any[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
}

export default function BestSellerShowcase({
  products,
  loading,
  title,
  subtitle,
  viewAllLink,
  viewAllText = 'Explore All',
}: BestSellerShowcaseProps) {
  const params = useParams();
  const country = (Array.isArray(params?.country) ? params?.country[0] : params?.country) || 'us';
  const [adIndex, setAdIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Auto-rotate ad banners every 3.5s (resets on manual swipe)
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setAdIndex(prev => (prev + 1) % adBanners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [adIndex]);

  if (!loading && products.length === 0) return null;

  // Show up to 8 products (4 columns × 2 rows)
  const displayProducts = products.slice(0, 8);

  const resolvedViewAllLink = viewAllLink
    ? viewAllLink.startsWith('/') && !viewAllLink.startsWith(buildPath(country, '/'))
      ? buildPath(country, viewAllLink)
      : viewAllLink
    : buildPath(country, `/products?sort=popular&bestSeller=true`);

  return (
    <div className="relative pt-6 sm:pt-8 pb-0">
      {/* Section Header */}
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 mb-2 sm:mb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center sm:justify-between text-center sm:text-left gap-1">
          <div>
            {title && <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">{title}</h2>}
            {subtitle && <p className="hidden sm:block text-gray-500 font-medium italic text-sm">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link
              href={resolvedViewAllLink}
              className="hidden sm:flex items-center gap-2 text-[13px] font-medium text-[#FF0000] hover:text-[#CC0000] transition-colors group pb-1 underline decoration-[#FF0000]/30 underline-offset-2 hover:decoration-[#FF0000]"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Layout: Ad Banner | Product Grid */}
      <div className="flex flex-col lg:flex-row items-stretch gap-2 lg:gap-2 px-0 sm:px-6 lg:px-8 pb-2">

        {/* LEFT/TOP: Rotating Ad Banner */}
        <div className="flex flex-col flex-shrink-0 w-full px-4 sm:px-0 lg:px-0 lg:w-[350px] xl:w-[450px]">
          <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-auto lg:h-full w-[85%] sm:w-full mx-auto overflow-hidden cursor-pointer rounded-2xl shadow-md border border-gray-100/50">
            {/* Preload all banner images immediately so carousel rotations are instant */}
            <div className="hidden" aria-hidden="true">
              {adBanners.map((banner, i) => (
                <img key={i} src={banner.src} alt="" loading="eager" fetchPriority="high" />
              ))}
            </div>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={adIndex}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
                  center: { x: 0 },
                  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%' })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier for a smooth pan
                }}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(_, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -50 || velocity.x < -500) {
                    setDirection(1);
                    setAdIndex(prev => (prev + 1) % adBanners.length);
                  } else if (swipe > 50 || velocity.x > 500) {
                    setDirection(-1);
                    setAdIndex(prev => (prev - 1 + adBanners.length) % adBanners.length);
                  }
                }}
              >
                <img
                  src={adBanners[adIndex].src}
                  alt="Promotional Banner"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </motion.div>
            </AnimatePresence>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {adBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > adIndex ? 1 : -1);
                    setAdIndex(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === adIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                  aria-label={`Banner ${i + 1}`}
                  suppressHydrationWarning
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT/BOTTOM: Product Reel (Mobile) / Grid (Desktop) */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex overflow-x-auto hide-scrollbar md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-2 px-4 sm:px-0 pb-4 md:pb-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-[200px] min-w-[200px] sm:w-[240px] md:w-auto md:min-w-0 aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl flex-shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-2 px-4 sm:px-0 pb-2 md:pb-0 overflow-y-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {displayProducts.map((product, i) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: 'easeOut' }}
                  className="w-[160px] min-w-[160px] sm:w-[240px] md:w-auto md:min-w-0 snap-center flex-shrink-0 md:snap-align-none"
                >
                  <ProductCard
                    product={product}
                    listName={title || 'Best Sellers'}
                    listIndex={i + 1}
                  />
                </motion.div>
              ))}
              {/* Spacer for right padding in scroll */}
              <div className="min-w-[1px] h-full md:hidden flex-shrink-0" />
            </div>
          )}

          {/* Mobile View All */}
          {viewAllLink && (
            <div className="sm:hidden flex justify-end px-2">
              <Link
                href={resolvedViewAllLink}
                className="flex items-center gap-2 text-[10px] font-medium text-[#FF0000] transition-colors group underline decoration-[#FF0000]/30 underline-offset-2"
              >
                {viewAllText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

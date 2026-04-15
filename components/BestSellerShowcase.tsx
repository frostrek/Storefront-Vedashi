'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';

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
  const country = (Array.isArray(params?.country) ? params?.country[0] : params?.country) || 'in';
  const [adIndex, setAdIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate ad banners every 3.5s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAdIndex(prev => (prev + 1) % adBanners.length);
    }, 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!loading && products.length === 0) return null;

  // Show up to 8 products (4 columns × 2 rows)
  const displayProducts = products.slice(0, 8);

  const resolvedViewAllLink = viewAllLink
    ? viewAllLink.startsWith('/') && !viewAllLink.startsWith(`/${country}`)
      ? `/${country}${viewAllLink}`
      : viewAllLink
    : `/${country}/products?sort=popular&bestSeller=true`;

  return (
    <div className="relative pt-0 pb-0">
      {/* Section Header */}
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 mb-2">
        <div className="flex items-end justify-between">
          <div>
            {title && <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{title}</h2>}
            {subtitle && <p className="text-gray-500 font-medium italic text-sm">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link
              href={resolvedViewAllLink}
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#3B5D3B] hover:text-[#8B7A3D] transition-colors group pb-1"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Layout: Ad Banner | Product Grid */}
      <div className="flex gap-2 px-4 sm:px-6 lg:px-8">

        {/* LEFT: Rotating Ad Banner */}
        <div className="hidden lg:flex flex-col flex-shrink-0 w-[350px] xl:w-[450px] gap-2 self-stretch bg-white rounded-2xl">
          <div className="relative flex-1 rounded-2xl overflow-hidden shadow-md cursor-pointer min-h-[500px]">
            <AnimatePresence initial={false}>
              <motion.div
                key={adIndex}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier for a smooth pan
                }}
                className="absolute inset-0"
              >
                <img
                  src={adBanners[adIndex].src}
                  alt="Promotional Banner"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {adBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAdIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === adIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: 4×2 Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 lg:gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 lg:gap-2">
              {displayProducts.map((product, i) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: 'easeOut' }}
                >
                  <ProductCard
                    product={product}
                    listName={title || 'Best Sellers'}
                    listIndex={i + 1}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Mobile View All */}
          {viewAllLink && (
            <div className="sm:hidden mt-4">
              <Link
                href={resolvedViewAllLink}
                className="flex items-center gap-2 text-sm font-bold text-[#3B5D3B] transition-colors group"
              >
                {viewAllText}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

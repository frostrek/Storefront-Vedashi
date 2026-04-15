'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Brand entries: name, slug (for URL filtering), and logo image path
// Add your brand logos to /public/brands/ and update the list below
const brands = [
  { name: 'minimalist', slug: 'minimalist', logo: '/brands/minimalist.webp' },
  { name: 'nivea', slug: 'nivea', logo: '/brands/nivea.png' },
  { name: 'bellavita', slug: 'bellavita', logo: '/brands/bellavita.jpg' },
  { name: 'colgate', slug: 'colgate', logo: '/brands/colgate.png' },
  { name: 'dove', slug: 'dove', logo: '/brands/dove.png' },
  { name: 'emami', slug: 'emami', logo: '/brands/emami.png' },
  { name: 'maybelline', slug: 'maybelline', logo: '/brands/maybelline.png' },

];

export default function BrandReel() {
  const params = useParams();
  const country = (Array.isArray(params?.country) ? params?.country[0] : params?.country) || 'in';

  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="flex flex-col w-full pt-2 pb-6">
      {/* Section Header */}
      <div className="mx-auto max-w-[1500px] w-full px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">Brands People Like</h2>
            <p className="text-gray-500 font-medium italic text-sm">Discover premium brands handpicked for quality and authenticity.</p>
          </div>
        </div>
      </div>

      <section className="relative py-4 overflow-hidden" style={{ background: '#fff09b' }}>
        {/* Marquee container with entrance animation */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 45, damping: 20, delay: 0.2 }}
          className="relative w-full overflow-hidden"
          style={{ willChange: "transform, opacity" }}
        >
          {/* Gradient fades on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #fff09b, transparent)' }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #fff09b, transparent)' }}
          />

          {/* Scrolling track */}
          <div className="brand-reel-track flex items-center gap-6 py-2">
            {duplicatedBrands.map((brand, index) => (
              <Link
                key={`${brand.slug}-${index}`}
                href={`/${country}/products?brand=${encodeURIComponent(brand.slug)}`}
                className="flex-shrink-0 group"
              >
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center px-6 py-4 h-[100px] w-[200px] group-hover:scale-105 group-hover:-translate-y-1">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-[60px] max-w-[150px] object-contain transition-all duration-300 grayscale-[30%] group-hover:grayscale-0"
                    onError={(e) => {
                      // Fallback: show brand name as text if logo is missing
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const textEl = target.nextElementSibling as HTMLElement;
                      if (textEl) textEl.style.display = 'flex';
                    }}
                  />
                  <span
                    className="text-sm font-bold text-gray-700 hidden items-center justify-center text-center leading-tight"
                    style={{ display: 'none' }}
                  >
                    {brand.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

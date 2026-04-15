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
    <div className="flex flex-col w-full">
      {/* Section heading (Animated Image) */}
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -60, scale: 1 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex items-center justify-center"
          style={{ willChange: "transform, opacity" }}
        >
          <img
            src="/shop-animations/brands people.png"
            alt="Brands People Love"
            className="h-[60px] sm:h-[80px] w-auto object-contain"
          />
        </motion.div>
      </div>

      <section className="relative py-2 overflow-hidden" style={{ background: '#b4e39cff' }}>
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
            style={{ background: 'linear-gradient(to right, #b4e39cff, transparent)' }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #b4e39cff, transparent)' }}
          />

          {/* Scrolling track */}
          <div className="brand-reel-track flex items-center gap-6 py-2">
            {duplicatedBrands.map((brand, index) => (
              <Link
                key={`${brand.slug}-${index}`}
                href={`/${country}/products?brand=${encodeURIComponent(brand.slug)}`}
                className="flex-shrink-0 group"
              >
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center px-8 py-5 h-[120px] w-[240px] group-hover:scale-105 group-hover:-translate-y-1">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-[80px] max-w-[190px] object-contain transition-all duration-300 grayscale-[30%] group-hover:grayscale-0"
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

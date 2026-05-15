'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Brand entries: name, slug (for URL filtering), and logo image paths
// Add your brand logos to /public/brands/ and update the list below
const brands = [
  { name: 'minimalist', slug: 'minimalist', logo: '/brands/minimalist.webp' },
  { name: 'nivea', slug: 'nivea', logo: '/brands/nivea.png' },
  { name: 'bellavita', slug: 'bellavita', logo: '/brands/bellavita.jpg' },
  { name: 'colgate', slug: 'colgate', logo: '/brands/colgate.png' },
  { name: 'dove', slug: 'dove', logo: '/brands/dove.png' },
  { name: 'emami', slug: 'emami', logo: '/brands/emami.png' },
  { name: 'Dabur', slug: 'Dabur', logo: '/brands/dabur.avif' },
  { name: 'Organic-India', slug: 'Organic-India', logo: '/brands/organic-india.avif' },
  { name: 'wishcare', slug: 'wishcare', logo: '/brands/wishcare.webp' },
  { name: 'Mamaearth', slug: 'Mamaearth', logo: '/brands/mamaearth.webp' },
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
      <div className="mx-auto max-w-[1500px] w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center sm:justify-start">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">Brands People Like</h2>
          </div>
        </div>
      </div>

      <section className="relative py-2 sm:py-4 overflow-hidden max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, white, transparent)' }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, white, transparent)' }}
          />

          {/* Scrolling track */}
          <div className="brand-reel-track flex items-center gap-0">
            {duplicatedBrands.map((brand, index) => (
              <Link
                key={`${brand.slug}-${index}`}
                href={`/${country}/products?brand=${encodeURIComponent(brand.slug)}`}
                className="flex-shrink-0 group"
              >
                <div className="flex items-center justify-center px-2 sm:px-4 h-[60px] w-[120px] sm:h-[80px] sm:w-[160px] transition-all duration-300 group-hover:scale-110">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-[45px] max-w-[100px] sm:max-h-[65px] sm:max-w-[140px] object-contain transition-all duration-300 grayscale-[20%] group-hover:grayscale-0"
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

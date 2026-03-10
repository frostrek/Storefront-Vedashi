'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Star, Mail, Wine, Grape, Sparkles, Layers } from 'lucide-react';
import { getProducts, getCategories, getBestSellers, getFeaturedProducts as fetchFeatured, getFeaturedCollections, StorefrontCollection } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { SkeletonProductGrid } from '@/components/Skeleton';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<StorefrontCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  // Icon lookup for dynamic collections
  const iconMap: Record<string, any> = { Wine, Grape, Sparkles, Layers, Star, Award };

  useEffect(() => {
    getBestSellers({ limit: 8 }).then(res => {
      setBestSellers(res.data);
      setLoading(false);
    });
    fetchFeatured().then(products => {
      setFeaturedProducts(products);
      setFeaturedLoading(false);
    });
    getFeaturedCollections(6).then(cols => {
      setCollections(cols);
      setCollectionsLoading(false);
    });
  }, []);

  // Fallback static collections (used only when API returns nothing)
  const fallbackCollections = [
    { icon: Wine, title: 'Red Wines', subtitle: 'Bold & Complex', color: 'from-red-900/20 to-red-800/10', href: '/products?category=Red%20Wine' },
    { icon: Sparkles, title: 'White Wines', subtitle: 'Crisp & Elegant', color: 'from-amber-100/60 to-yellow-50/40', href: '/products?category=White%20Wine' },
    { icon: Grape, title: 'Sparkling', subtitle: 'Celebratory', color: 'from-pink-100/60 to-rose-50/40', href: '/products?category=Sparkling' },
  ];

  return (
    <div className="bg-cream">
      {/* ─── HERO SECTION — CMS driven ─── */}
      <HeroCarousel />

      {/* ─── FEATURED COLLECTIONS ─── */}
      <section className="py-10 sm:py-16 lg:py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-wine-gold">
              Featured Collections
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-warm-gray">Discover our finest curated collections</p>
          </div>

          {collectionsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-2xl border border-light-border bg-white p-8">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-cream-dark" />
                  <div className="mx-auto h-5 w-32 rounded bg-cream-dark mb-2" />
                  <div className="mx-auto h-4 w-24 rounded bg-cream-dark/60" />
                </div>
              ))}
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {collections.map((col) => {
                const IconComponent = iconMap[col.icon || ''] || Layers;
                return (
                  <Link
                    key={col.collection_id}
                    href={`/collections/${col.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-light-border bg-white p-5 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${col.color_gradient || 'from-burgundy/10 to-cream'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
                        <IconComponent className="h-7 w-7 text-burgundy" />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-charcoal">{col.name}</h3>
                      <p className="mt-1 text-sm text-warm-gray">{col.description || `${col.product_count || 0} products`}</p>
                      {/* Preview thumbnails */}
                      {col.preview_products && col.preview_products.length > 0 && (
                        <div className="mt-4 flex justify-center -space-x-2">
                          {col.preview_products.slice(0, 4).map((pp, i) => (
                            pp.thumbnail_url ? (
                              <img key={i} src={pp.thumbnail_url} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                            ) : (
                              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-cream-dark" />
                            )
                          ))}
                        </div>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-burgundy">
                        Explore <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Fallback: static collections */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {fallbackCollections.map((collection) => (
                <Link
                  key={collection.title}
                  href={collection.href}
                  className="group relative overflow-hidden rounded-2xl border border-light-border bg-white p-5 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${collection.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
                      <collection.icon className="h-7 w-7 text-burgundy" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-charcoal">{collection.title}</h3>
                    <p className="mt-1 text-sm text-warm-gray">{collection.subtitle}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-burgundy">
                      Explore <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      {featuredLoading ? (
        <section className="py-20 px-4 bg-white">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-wine-gold">
                Featured Products
              </h2>
              <p className="mt-2 text-warm-gray">Handpicked selections just for you</p>
            </div>
            <SkeletonProductGrid count={4} />
          </div>
        </section>
      ) : featuredProducts.length > 0 ? (
        <section className="py-10 sm:py-16 lg:py-20 px-4 bg-white">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-wine-gold" />
                  <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-wine-gold font-medium">Curated for You</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-wine-gold">
                  Featured Products
                </h2>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-warm-gray">Handpicked selections from our finest collection</p>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-burgundy hover:text-burgundy-dark transition-colors"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {featuredProducts.slice(0, 12).map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-burgundy">
                View All Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── OUR STORY ─── */}
      <section className="py-10 sm:py-16 lg:py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-wine-gold font-medium mb-2 sm:mb-3">Our Heritage</p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-wine-gold leading-tight">
                Our Story
              </h2>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base text-warm-gray leading-relaxed">
                At KSP Wines, we believe every bottle tells a story. From sun-drenched hillside
                vineyards to lush coastal estates, we source and select only the finest grapes
                to craft wines of exceptional character and depth.
              </p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-warm-gray leading-relaxed">
                With over a decade of winemaking expertise, our artisans blend time-honored European
                techniques with bold, modern innovation — producing wines that are not just beverages,
                but experiences to be savored.
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 font-serif text-sm font-semibold text-burgundy hover:text-burgundy-dark transition-colors"
              >
                Read More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-cream-dark to-cream overflow-hidden border border-light-border">
                <div className="flex h-full items-center justify-center">
                  <div className="relative flex justify-center py-0 px-0">
                    <img src="/Our-story.webp" alt="Our Story" className="w-full max-w-5xl rounded-2xl shadow-lg object-contain transition duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl" />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BEST SELLERS ─── */}
      <section className="py-10 sm:py-16 lg:py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-wine-gold">
                Best Sellers
              </h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-warm-gray">Our most popular wines, loved by customers</p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-burgundy hover:text-burgundy-dark transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <SkeletonProductGrid count={4} />
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {bestSellers.slice(0, 4).map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-light-border bg-white py-16 text-center">
              <span className="text-5xl block mb-4">🍷</span>
              <p className="font-serif text-xl text-charcoal">Products coming soon</p>
              <p className="mt-2 text-sm text-warm-gray">Add products via the admin panel</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-burgundy">
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── AWARDS & CERTIFICATIONS ─── */}
      <section className="py-10 sm:py-16 lg:py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-wine-gold">
            Awards & Certifications
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-warm-gray">Recognition of our commitment to quality</p>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
            {[
              { icon: Award, title: 'Gold Medal 2024', subtitle: 'International Wine Challenge', detail: 'VinoViet Classic Red' },
              { icon: Star, title: 'Best Vietnamese Wine', subtitle: 'Asia Wine Awards 2024', detail: 'Exceptional Quality' },
              { icon: Award, title: 'Sustainability Award', subtitle: 'Green Vineyards Initiative', detail: 'Eco-Friendly Production' },
            ].map((award, i) => (
              <div key={i} className="rounded-2xl border border-light-border bg-cream/50 p-5 sm:p-8 transition-all hover:shadow-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wine-gold/20">
                  <award.icon className="h-6 w-6 text-wine-gold" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-charcoal">{award.title}</h3>
                <p className="mt-1 text-sm text-warm-gray">{award.subtitle}</p>
                <p className="mt-2 text-xs text-burgundy font-medium">{award.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-10 sm:py-16 lg:py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-wine-gold text-center">
            What Our Customers Say
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-warm-gray text-center">Hear from wine lovers who trust KSP Wines</p>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            {[
              {
                name: 'Emily Carter',
                role: 'Wine Enthusiast',
                text: 'KSP Wines delivers an extraordinary tasting experience. Every sip reveals new layers of complexity and refinement.',
                rating: 5,
              },
              {
                name: 'James Whitfield',
                role: 'Restaurant Owner',
                text: 'Consistently outstanding quality at a fair price. KSP Wines is the go-to choice for my restaurant\'s wine list.',
                rating: 5,
              },
              {
                name: 'Sofia Martínez',
                role: 'Sommelier',
                text: 'A hidden gem in the wine world. International-caliber quality with a distinctive character that stands apart.',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="rounded-2xl border border-light-border bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-wine-gold text-wine-gold" />
                  ))}
                </div>
                <p className="text-sm text-warm-gray leading-relaxed italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cream-dark flex items-center justify-center font-serif text-burgundy font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{testimonial.name}</p>
                    <p className="text-xs text-warm-gray">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="py-10 sm:py-16 lg:py-20 px-4 wine-gradient">
        <div className="mx-auto max-w-2xl text-center">
          <Mail className="mx-auto h-7 w-7 sm:h-8 sm:w-8 text-wine-gold mb-3 sm:mb-4" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Join Our Newsletter
          </h2>
          <p className="mt-2 sm:mt-3 text-cream-dark/80 text-xs sm:text-sm">
            Stay updated on new releases and exclusive offers
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3 justify-center" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address..."
              className="flex-1 rounded-lg bg-white/10 border border-white/20 px-5 py-3 text-sm text-white placeholder-white/50 focus:border-wine-gold focus:outline-none backdrop-blur-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-wine-gold px-8 py-3 text-sm font-semibold text-charcoal hover:bg-wine-gold-light transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

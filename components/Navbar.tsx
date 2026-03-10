'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Heart, ChevronDown, Search, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { getCategories } from '@/lib/api';
import toast from 'react-hot-toast';
import SearchAutocomplete from './SearchAutocomplete';

interface Category {
  category_id: string;
  parent_id: string | null;
  name: string;
}

interface HeaderConfig {
  branding: { logo_url: string; logo_alt: string; };
  colors: {
    navbar_bg: string;
    navbar_text: string;
    navbar_hover: string;
    strip_bg: string;
    strip_text: string;
    strip_accent: string;
    cart_badge_bg: string;
  };
  nav_links: { label: string; url: string; enabled: boolean; }[];
  strip: {
    enabled: boolean;
    center_message: string;
    hotline: string;
    show_track_orders: boolean;
    show_categories: boolean;
  };
}

const DEFAULT_CONFIG: HeaderConfig = {
  branding: { logo_url: '', logo_alt: 'KSP Wines' },
  colors: {
    navbar_bg: '#ffffff',
    navbar_text: '#374151',
    navbar_hover: '#4b0f1a',
    strip_bg: '#4b0f1a',
    strip_text: '#C6A75E',
    strip_accent: '#FFD700',
    cart_badge_bg: '#4b0f1a',
  },
  nav_links: [
    { label: 'Home', url: '/', enabled: true },
    { label: 'Shop', url: '/products', enabled: true },
    { label: 'About Us', url: '/about', enabled: true },
    { label: 'Contact', url: '/contact', enabled: true },
    { label: 'Blog', url: '/blog', enabled: true },
    { label: 'Help', url: '/help-center', enabled: true },
  ],
  strip: {
    enabled: true,
    center_message: '✦ Thank You for Choosing Us ✦',
    hotline: '090 202 5806',
    show_track_orders: true,
    show_categories: true,
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems, loading: cartLoading } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCartReminder, setShowCartReminder] = useState(false);
  const [config, setConfig] = useState<HeaderConfig>(DEFAULT_CONFIG);

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      router.push('/account/wishlist');
    } else {
      toast('Please sign in to view your wishlist');
      router.push('/login');
    }
  };

  // Fetch header config from API
  useEffect(() => {
    fetch(`${API_URL}/api/header`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setConfig(prev => ({ ...DEFAULT_CONFIG, ...data.data }));
        }
      })
      .catch(() => { /* stay with defaults */ });
  }, []);

  useEffect(() => {
    if (!cartLoading && totalItems > 0) {
      const hasShown = sessionStorage.getItem('cartReminderShown');
      if (!hasShown) {
        const timer = setTimeout(() => {
          setShowCartReminder(true);
          sessionStorage.setItem('cartReminderShown', 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [totalItems, cartLoading]);

  useEffect(() => {
    getCategories().then(cats => {
      if (Array.isArray(cats)) setCategories(cats);
    });
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const { colors, nav_links, strip, branding } = config;
  const visibleLinks = nav_links.filter(l => l.enabled);

  return (
    <header className="w-full sticky top-0 z-[100]">

      {/* ═══════════════ MAIN NAVBAR ═══════════════ */}
      <div style={{ backgroundColor: colors.navbar_bg }} className="border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              {branding.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo_url} alt={branding.logo_alt} className="h-14 sm:h-16 md:h-20 w-auto object-contain" />
              ) : (
                <img src="/KSP-Wines-logo.png" alt={branding.logo_alt} className="h-14 sm:h-16 md:h-20 w-auto" />
              )}
            </Link>

            {/* Center Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              {visibleLinks.map(link => (
                <Link
                  key={link.label}
                  href={link.url}
                  className="text-[13px] font-semibold uppercase tracking-widest transition-colors duration-200"
                  style={{ color: colors.navbar_text }}
                  onMouseEnter={e => (e.currentTarget.style.color = colors.navbar_hover)}
                  onMouseLeave={e => (e.currentTarget.style.color = colors.navbar_text)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Icons + Search */}
            <div className="flex items-center gap-1 sm:gap-2 relative">
              {/* Desktop Search */}
              <div className="hidden md:block relative">
                {searchOpen ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                    <SearchAutocomplete className="w-[320px]" onClose={() => setSearchOpen(false)} />
                    <button onClick={() => setSearchOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setSearchOpen(true)} className="p-2 group" aria-label="Open search">
                    <Search className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                  </button>
                )}
              </div>

              <button onClick={handleWishlistClick} className="relative p-2 group">
                <Heart className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.cart_badge_bg }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              <div className="flex items-center">
                <Link href="/cart" className="relative p-2 group">
                  <ShoppingCart className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.cart_badge_bg }}
                    >
                      {totalItems}
                    </span>
                  )}
                </Link>

                {/* Cart Reminder Popup */}
                {showCartReminder && (
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <button
                      onClick={() => setShowCartReminder(false)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors.navbar_hover}18` }}>
                        <ShoppingCart className="h-5 w-5" style={{ color: colors.strip_text }} />
                      </div>
                      <div className="pr-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Items left in cart</h4>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                          You previously left {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart. Checkout fast before they go out of stock!
                        </p>
                        <Link
                          href="/cart"
                          onClick={() => setShowCartReminder(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                          style={{ backgroundColor: colors.navbar_hover }}
                        >
                          Go to Cart <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/account" className="relative p-2 group">
                <User className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
              </Link>

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: colors.navbar_text }}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ STRIP BAR ═══════════════ */}
      {strip.enabled && (
        <div className="hidden md:block" style={{ backgroundColor: colors.strip_bg }}>
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="flex items-center justify-between h-9 text-[12px] tracking-wide">

              {/* LEFT */}
              <div className="flex items-center gap-5">
                {strip.show_track_orders && (
                  <Link
                    href="/account"
                    className="font-medium transition-colors duration-200"
                    style={{ color: colors.strip_text }}
                    onMouseEnter={e => (e.currentTarget.style.color = colors.strip_accent)}
                    onMouseLeave={e => (e.currentTarget.style.color = colors.strip_text)}
                  >
                    Track Orders
                  </Link>
                )}

                {strip.show_track_orders && strip.show_categories && (
                  <span style={{ color: colors.strip_text, opacity: 0.3 }}>|</span>
                )}

                {/* Categories with Mega Dropdown */}
                {strip.show_categories && (
                  <div className="relative group flex items-center h-9">
                    <button
                      className="flex items-center gap-1 font-medium cursor-pointer transition-colors duration-200"
                      style={{ color: colors.strip_text }}
                    >
                      Categories
                      <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    <div className="absolute top-9 left-0 min-w-[280px] bg-white text-gray-800 shadow-2xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[200] border-t-[3px]" style={{ borderColor: colors.strip_text }}>
                      <div className="py-2">
                        {parentCategories.map(parent => {
                          const subs = categories.filter(c => c.parent_id === parent.category_id);
                          return (
                            <div key={parent.category_id} className="relative group/cat">
                              <Link
                                href={`/products?category=${encodeURIComponent(parent.name)}`}
                                className="flex items-center justify-between px-5 py-2.5 text-sm font-medium transition-colors duration-150"
                                style={{ color: colors.navbar_text }}
                                onMouseEnter={e => (e.currentTarget.style.color = colors.navbar_hover)}
                                onMouseLeave={e => (e.currentTarget.style.color = colors.navbar_text)}
                              >
                                {parent.name}
                                {subs.length > 0 && <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-gray-400" />}
                              </Link>
                              {subs.length > 0 && (
                                <div className="absolute left-full top-0 min-w-[220px] bg-white shadow-xl rounded-r-lg opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-200 z-[210] border-l border-gray-100">
                                  <div className="py-2">
                                    {subs.map(sub => (
                                      <Link
                                        key={sub.category_id}
                                        href={`/products?category=${encodeURIComponent(parent.name)}&sub_category=${encodeURIComponent(sub.name)}`}
                                        className="block px-5 py-2 text-sm text-gray-600 transition-colors duration-150"
                                        style={{ color: colors.navbar_text }}
                                        onMouseEnter={e => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = colors.navbar_hover;
                                          (e.currentTarget as HTMLElement).style.color = '#ffffff';
                                        }}
                                        onMouseLeave={e => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                                          (e.currentTarget as HTMLElement).style.color = colors.navbar_text;
                                        }}
                                      >
                                        {sub.name}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CENTER */}
              <span className="font-medium tracking-wider text-[11px]" style={{ color: colors.strip_text }}>
                {strip.center_message}
              </span>

              {/* RIGHT */}
              <div className="flex items-center gap-1.5 font-medium" style={{ color: colors.strip_text }}>
                <span className="text-sm">✆</span>
                <span>
                  Hotline:{' '}
                  <span className="font-semibold" style={{ color: colors.strip_accent }}>{strip.hotline}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MOBILE MENU ═══════════════ */}
      {mobileOpen && (
        <div className="md:hidden bg-white shadow-lg border-t absolute w-full z-[200] max-h-[80vh] overflow-y-auto">
          <nav className="flex flex-col p-5 gap-1">

            {/* Mobile Search */}
            <div className="mb-3">
              <SearchAutocomplete className="w-full" onClose={() => setMobileOpen(false)} placeholder="Search wines…" />
            </div>

            {/* Main links (from config, filtered to enabled) */}
            {visibleLinks.map(link => (
              <Link
                key={link.label}
                href={link.url}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors"
                style={{ color: colors.navbar_text }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = `${colors.navbar_hover}12`;
                  (e.currentTarget as HTMLElement).style.color = colors.navbar_hover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  (e.currentTarget as HTMLElement).style.color = colors.navbar_text;
                }}
              >
                {link.label}
              </Link>
            ))}

            {strip.show_track_orders && (
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors"
                style={{ color: colors.navbar_text }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = `${colors.navbar_hover}12`;
                  (e.currentTarget as HTMLElement).style.color = colors.navbar_hover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  (e.currentTarget as HTMLElement).style.color = colors.navbar_text;
                }}
              >
                Track Orders
              </Link>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 my-2" />

            {/* Categories */}
            <p className="px-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Categories</p>
            {parentCategories.map(parent => (
              <div key={parent.category_id} className="flex flex-col">
                <Link
                  href={`/products?category=${encodeURIComponent(parent.name)}`}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 px-3 font-semibold text-sm transition-colors"
                  style={{ color: colors.navbar_text }}
                  onMouseEnter={e => (e.currentTarget.style.color = colors.navbar_hover)}
                  onMouseLeave={e => (e.currentTarget.style.color = colors.navbar_text)}
                >
                  {parent.name}
                </Link>
                {categories.filter(c => c.parent_id === parent.category_id).map(sub => (
                  <Link
                    key={sub.category_id}
                    href={`/products?category=${encodeURIComponent(parent.name)}&sub_category=${encodeURIComponent(sub.name)}`}
                    onClick={() => setMobileOpen(false)}
                    className="py-1.5 pl-7 pr-3 text-sm border-l-2 border-gray-100 ml-4 transition-colors"
                    style={{ color: colors.navbar_text, opacity: 0.75 }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = colors.navbar_hover;
                      (e.currentTarget as HTMLElement).style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = colors.navbar_text;
                      (e.currentTarget as HTMLElement).style.opacity = '0.75';
                    }}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            ))}

            {/* Hotline */}
            <div className="border-t border-gray-100 my-2" />
            <p className="px-3 text-xs" style={{ color: colors.strip_text }}>
              ✆ Hotline: <span className="font-semibold" style={{ color: colors.navbar_hover }}>{strip.hotline}</span>
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Menu, X, Heart, ChevronDown, Search, ArrowRight, Leaf, Sparkles, LogOut, Settings, Package, UserPlus, LogIn, Phone, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { getCategories, API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import SearchAutocomplete from './SearchAutocomplete';
import GoogleTranslateWidget from './GoogleTranslateWidget';
import RegionSwitcher from './RegionSwitcher';
import NotificationCenter from './account/NotificationCenter';
import SecondaryNavbar from './SecondaryNavbar';
import PromoBanner from './PromoBanner';

interface Category {
  category_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  children?: Category[];
}

interface HeaderConfig {
  settings?: { use_backend_navbar: boolean; };
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
  branding: { logo_url: '', logo_alt: 'Vedashi' },
  colors: {
    // navbar_bg: '#E8DCAFff',
    navbar_bg: '#f0e7c8ff',
    navbar_text: '#374151',
    navbar_hover: '#3B5D3B',
    strip_bg: '#3B5D3B',
    strip_text: '#E8DCAF',
    strip_accent: '#C9B87A',
    cart_badge_bg: '#3B5D3B',
  },
  nav_links: [],
  strip: {
    enabled: false,
    center_message: '',
    hotline: '',
    show_track_orders: false,
    show_categories: false,
  },
};

/* ─── Recursive Desktop Mega Menu ─── */
/* ─── Recursive Desktop Mega Menu Link Component ─── */
const MegaMenuLinks = ({ item, country, topLevelSlug, secondLevelSlug, level = 0 }: { item: Category, country: string, topLevelSlug: string, secondLevelSlug?: string, level?: number }) => {
  const hasChildren = item.children && item.children.length > 0;

  let href = `/${country}/products?category=${topLevelSlug}`;
  if (level === 0) {
    href += `&sub_category=${item.slug}`;
  } else if (level === 1) {
    href += `&sub_category=${secondLevelSlug}&sub_sub_category=${item.slug}`;
  } else {
    href += `&sub_category=${secondLevelSlug}&sub_sub_category=${item.slug}`;
  }

  return (
    <div className={`flex flex-col ${level === 0 ? 'gap-3' : 'gap-1.5'}`}>
      <Link
        href={href}
        className={`transition-colors duration-200 block ${level === 0
          ? 'text-[15px] font-semibold text-[#29553A] hover:text-[#3B5D3B] hover:underline uppercase'
          : 'text-[13px] text-gray-600 font-semibold hover:text-[#3B5D3B] hover:underline py-0.5 normal-case'
          }`}
      >
        {item.name}
      </Link>

      {hasChildren && (
        <div className={`flex flex-col gap-1.5 ${level === 0 ? 'border-l border-gray-100 pl-7 ml-1 mt-1' : 'pl-6'}`}>
          {item.children!.map(child => (
            <MegaMenuLinks
              key={child.category_id}
              item={child}
              country={country}
              topLevelSlug={topLevelSlug}
              secondLevelSlug={level === 0 ? item.slug : secondLevelSlug}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Desktop Mega Menu Container ─── */
const MegaMenuContent = ({ parent, country, colors }: { parent: Category, country: string, colors: any }) => {
  if (!parent.children || parent.children.length === 0) return null;

  // Group Level 1 children into columns (max 4 columns)
  const columns = 4;
  const itemsPerColumn = Math.ceil(parent.children.length / (columns - 1));
  const columnData = [];
  for (let i = 0; i < parent.children.length; i += itemsPerColumn) {
    columnData.push(parent.children.slice(i, i + itemsPerColumn));
  }

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 min-w-[900px] w-max max-w-[1200px] bg-white text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-b-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[200] border-t-[3px] p-10 grid grid-cols-4 gap-12"
      style={{ borderColor: colors.navbar_hover || '#3B5D3B' }}
    >
      {/* Dynamic Columns */}
      {columnData.slice(0, 3).map((colItems, idx) => (
        <div key={idx} className="flex flex-col gap-10">
          {colItems.map(child => (
            <MegaMenuLinks key={child.category_id} item={child} country={country} topLevelSlug={parent.slug} />
          ))}
        </div>
      ))}

      {/* Featured Promo / Stats Column (Rightmost) */}
      <div className="flex flex-col gap-6">
        <div className="bg-[#FBF9F2] rounded-2xl p-6 flex flex-col justify-between border border-[#3B5D3B]/10 h-full relative overflow-hidden group/promo">
          {/* Decorative background leaf/element */}
          <Leaf className="absolute -bottom-4 -right-4 h-24 w-24 text-[#3B5D3B]/5 rotate-12 transition-transform duration-500 group-hover/promo:scale-110" />

          <div className="relative z-10">
            <span className="inline-block bg-[#3B5D3B]/10 text-[#3B5D3B] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-3">Featured Collection</span>
            <h5 className="text-xl font-serif font-bold text-gray-900 mb-2 leading-tight">Explore {parent.name}</h5>
            <p className="text-xs text-gray-600 leading-relaxed italic">
              Discover our ethically sourced, premium Ayurvedic essentials crafted with traditional wisdom.
            </p>
          </div>

          <div className="mt-8 space-y-3 relative z-10">
            <Link
              href={`/${country}/products?category=${parent.slug}`}
              className="flex items-center justify-between w-full group/btn text-sm font-bold text-[#3B5D3B] hover:text-[#2D452D] transition-colors"
            >
              Shop All {parent.name}
              <div className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center transition-all group-hover/btn:bg-[#3B5D3B] group-hover/btn:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Recursive Mobile Sidebar Item ─── */
const MobileNavItem = ({ item, country, onClose, level = 0 }: { item: Category, country: string, onClose: () => void, level?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <Link
          href={`/${country}/products?category=${item.slug}`}
          onClick={onClose}
          className={`py-3 px-4 font-bold text-sm text-gray-800 hover:text-[#3B5D3B] transition-colors flex-1 ${level > 0 ? 'pl-8 border-l-2 border-gray-100 ml-4' : ''}`}
        >
          {item.name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-3 text-gray-400 hover:text-[#3B5D3B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {item.children!.map((child: Category) => (
              <MobileNavItem
                key={child.category_id}
                item={child}
                country={country}
                onClose={onClose}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentCountry = (params?.country as string) || 'in';

  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, loading: cartLoading } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { isAuthenticated, user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCartReminder, setShowCartReminder] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<HeaderConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      router.push(`/${currentCountry}/account/wishlist`);
    } else {
      toast('Please sign in to view your wishlist');
      router.push(`/${currentCountry}/login`);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/header`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.settings?.use_backend_navbar === false) {
            setConfig(DEFAULT_CONFIG);
          } else {
            setConfig(prev => ({ ...DEFAULT_CONFIG, ...data.data }));
          }
        }
      })
      .catch(() => { /* stay with defaults */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && !cartLoading) {
      const justSignedIn = sessionStorage.getItem('justSignedIn');
      if (justSignedIn) {
        const ts = parseInt(justSignedIn, 10);
        if (justSignedIn === 'true' || (!isNaN(ts) && Date.now() - ts < 15000)) {
          if (totalItems > 0 && !showCartReminder) {
            setShowCartReminder(true);
          }
        } else {
          sessionStorage.removeItem('justSignedIn');
        }
      }
    }
  }, [isAuthenticated, totalItems, cartLoading, showCartReminder]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  useEffect(() => {
    getCategories(true).then(cats => {
      if (Array.isArray(cats)) setCategories(cats);
    });
  }, []);

  const { colors, nav_links, strip, branding } = config;
  const visibleLinks = nav_links.filter(l => l.enabled);
  // Ensure we only treat true roots as the primary navbar categories
  const parentCategories = categories.filter(cat => !cat.parent_id);

  if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

  return (
    <header className={`w-full sticky top-0 z-[1000] transition-all duration-500 ${scrolled ? 'shadow-lg' : ''}`}>

      <PromoBanner />

      {/* ═══════════════ STRIP BAR (PROMOTION BANNER) ═══════════════ */}
      {strip.enabled && (
        <div className="hidden md:block font-sans" style={{ backgroundColor: colors.strip_bg }}>
          <div className="mx-auto max-w-[2000px] w-full px-4 lg:px-6">
            <div className="flex items-center justify-between h-8 text-[12px] tracking-wide">
              <div className="flex items-center gap-5">
                {strip.show_track_orders && (
                  <Link href={`/${currentCountry}/account`} className="font-medium" style={{ color: colors.strip_text }}>Track Orders</Link>
                )}
                {strip.show_categories && (
                  <div className="flex items-center gap-6">
                    {parentCategories.slice(0, 5).map(parent => (
                      <div key={parent.category_id} className="relative group flex items-center h-8">
                        <Link href={`/${currentCountry}/products?category=${parent.slug}`} className="flex items-center gap-1 font-medium" style={{ color: colors.strip_text }}>
                          {parent.name}
                          {parent.children && parent.children.length > 0 && <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />}
                        </Link>
                        <MegaMenuContent parent={parent} country={currentCountry} colors={colors} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-medium" style={{ color: colors.strip_text }}>{strip.center_message}</span>
              <div className="flex items-center gap-1.5 font-medium" style={{ color: colors.strip_text }}>
                <span>Hotline: <span style={{ color: colors.strip_accent }}>{strip.hotline}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MAIN NAVBAR ═══════════════ */}
      <div
        className={`relative z-[100] border-b transition-all duration-500 ${scrolled
          ? 'backdrop-blur-xl border-black/10 shadow-[0_2px_20px_rgba(0,0,0,0.1)]'
          : 'border-white/10 shadow-sm'
          }`}
        style={{ backgroundColor: scrolled ? `${colors.navbar_bg}CC` : colors.navbar_bg }}
      >
        <div className="mx-auto max-w-[1500px] w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">

            {/* Logo Section */}
            <div className="flex-none flex items-center justify-start">
              <Link href={`/${currentCountry}`} className="flex items-center gap-2">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt={branding.logo_alt} className="h-10 sm:h-12 md:h-16 lg:h-18 w-auto object-contain transition-all" />
                ) : (
                  <img src="/vedashi-logo.png" alt="Vedashi" className="h-10 sm:h-12 md:h-16 lg:h-18 w-auto object-contain transition-all" />
                )}
              </Link>
            </div>

            {/* Center Nav Links */}
            <nav className="hidden xl:flex items-center gap-4 lg:gap-6 z-10 w-max transition-all duration-300 opacity-100 mr-4">
              {visibleLinks.map(link => {
                const prefixedUrl = link.url.startsWith('/') ? `/${currentCountry}${link.url === '/' ? '' : link.url}` : link.url;
                const isActive = link.url === '/'
                  ? pathname === `/${currentCountry}` || pathname === `/${currentCountry}/`
                  : pathname?.includes(link.url);

                return (
                  <Link
                    key={link.label}
                    href={prefixedUrl}
                    className={`text-[11px] lg:text-[13px] font-bold font-base uppercase tracking-[0.12em] lg:tracking-[0.14em] transition-colors duration-200 relative before:content-[''] before:absolute before:-bottom-1 before:left-0 before:w-full before:h-0.5 before:bg-current before:transition-transform before:duration-300 ${isActive ? 'before:scale-x-100' : 'before:scale-x-0'}`}
                    style={{ color: isActive ? colors.navbar_hover : colors.navbar_text }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Search Bar Section (Center) */}
            <div className="hidden md:flex flex-1 justify-center max-w-none px-2 lg:px-4">
              <SearchAutocomplete className="w-full" />
            </div>

            {/* Actions Section */}
            <div className="flex-none flex items-center justify-end gap-3 sm:gap-4 md:gap-2 lg:gap-3 relative">
              <NotificationCenter colors={colors} />

              <button onClick={handleWishlistClick} className="relative p-2 group">
                <Heart className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.cart_badge_bg }}>
                    {wishlistCount}
                  </span>
                )}
              </button>

              <Link href={`/${currentCountry}/cart`} className="relative p-2 group">
                <ShoppingCart className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full" style={{ backgroundColor: colors.cart_badge_bg }}>
                    {totalItems}
                  </span>
                )}
              </Link>

              <div className="relative group">
                <Link href={isAuthenticated ? `/${currentCountry}/account` : `/${currentCountry}/login`} className="p-2 block">
                  {isAuthenticated && user?.avatar_url ? (
                    <div className="h-[22px] w-[22px] rounded-full overflow-hidden ring-1 ring-[#D4A847]/30">
                      <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <User className="h-[20px] w-[20px]" style={{ color: colors.navbar_text }} />
                  )}
                </Link>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[120] overflow-hidden">
                  {isAuthenticated ? (
                    <div className="p-2">
                      <div className="px-4 py-3 border-b border-gray-50 mb-1">
                        <p className="text-[13px] font-bold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link href="/account" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><Settings className="h-4 w-4" /> Settings</Link>
                      <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><Package className="h-4 w-4" /> Orders</Link>
                      <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-1"><LogOut className="h-4 w-4" /> Logout</button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="p-5 bg-gray-50/50 border-b border-gray-100">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Welcome to Vedashi</h3>
                        <p className="text-[11px] text-gray-500 leading-tight">Sign in to easily track orders, save items, and more.</p>
                      </div>
                      <div className="p-4 space-y-2">
                        <Link
                          href={`/${currentCountry}/login`}
                          className="flex items-center gap-3 w-full px-4 py-2.5 bg-[#3B5D3B] text-white rounded-xl text-[13px] font-bold transition-all hover:bg-[#2D452D] hover:shadow-md active:scale-[0.98]"
                        >
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </Link>
                        <Link
                          href={`/${currentCountry}/login?mode=register`}
                          className="flex items-center gap-3 w-full px-4 py-2.5 bg-white text-gray-700 rounded-xl text-[13px] font-bold border border-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98]"
                        >
                          <UserPlus className="h-4 w-4" />
                          Create Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden md:block">
                <RegionSwitcher />
              </div>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SecondaryNavbar />
      {/* ═══════════════ MOBILE MENU ═══════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-[320px] bg-white z-[2001] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <img src="/vedashi-logo.png" alt="Vedashi" className="h-8 w-auto" />
                <button onClick={() => setMobileOpen(false)}><X className="h-6 w-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-6"><SearchAutocomplete className="w-full" onClose={() => setMobileOpen(false)} /></div>
                <div className="space-y-1 mb-8">
                  {visibleLinks.map(link => (
                    <Link key={link.label} href={link.url} onClick={() => setMobileOpen(false)} className="block py-3 px-4 font-bold text-sm uppercase text-gray-600 hover:bg-gray-50 rounded-xl">{link.label}</Link>
                  ))}
                </div>
                <div className="border-t pt-6">
                  <p className="text-[10px] uppercase font-bold text-[#3B5D3B] mb-3 px-4">Categories</p>
                  <div className="space-y-1">
                    {parentCategories.map(parent => (
                      <MobileNavItem key={parent.category_id} item={parent} country={currentCountry} onClose={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

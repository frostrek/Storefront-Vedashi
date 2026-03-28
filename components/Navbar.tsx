'use client';

import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Menu, X, Heart, ChevronDown, Search, ArrowRight, Leaf, Sparkles, LogOut, Settings, Package, UserPlus, LogIn, Phone } from 'lucide-react';
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

interface Category {
  category_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
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
    navbar_bg: '#ffffff',
    navbar_text: '#374151',
    navbar_hover: '#3B5D3B',
    strip_bg: '#3B5D3B',
    strip_text: '#E8DCAF',
    strip_accent: '#C9B87A',
    cart_badge_bg: '#3B5D3B',
  },
  nav_links: [
    { label: 'Home', url: '/', enabled: true },
    { label: 'Shop', url: '/shop', enabled: true },
    { label: 'Products', url: '/products', enabled: true },
    { label: 'About Us', url: '/about', enabled: true },
    { label: 'Contact', url: '/contact', enabled: true },
    { label: 'Blog', url: '/blog', enabled: true },
    { label: 'Help', url: '/help-center', enabled: true },
  ],
  strip: {
    enabled: false,
    center_message: '',
    hotline: '',
    show_track_orders: false,
    show_categories: false,
  },
};

// API_URL imported from @/lib/api

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentCountry = (params?.country as string) || 'in';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
            // Revert/Keep default hardcoded config
            setConfig(DEFAULT_CONFIG);
          } else {
            // Overlay backend config on defaults
            setConfig(prev => ({ ...DEFAULT_CONFIG, ...data.data }));
          }
        }
      })
      .catch(() => { /* stay with defaults */ })
      .finally(() => setLoading(false));
  }, []);

  // 2. Trigger ONLY when customer explicitly just signed in (within last 15 seconds)
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
    getCategories().then(cats => {
      if (Array.isArray(cats)) setCategories(cats);
    });
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const { colors, nav_links, strip, branding } = config;
  const visibleLinks = nav_links.filter(l => l.enabled);

  // Hide navbar on login page (handling localized routes like /[country]/login)
  if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

  return (
    <header className={`w-full sticky top-0 z-[1000] transition-all duration-500 ${scrolled ? 'shadow-lg' : ''}`}>

      {/* ═══════════════ MAIN NAVBAR ═══════════════ */}
      <div
        className={`relative z-[100] border-b transition-all duration-500 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl border-[#3B5D3B]/10 shadow-[0_2px_20px_rgba(59,93,59,0.08)]'
          : 'bg-white border-gray-200 shadow-sm'
          }`}
      >
        <div className="mx-auto max-w-[1800px] w-full px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 relative">

            {/* Logo */}
            <div className="flex items-center justify-start flex-shrink-0">
              <Link href={`/${currentCountry}`} className="flex items-center gap-2">
                {branding.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logo_url} alt={branding.logo_alt} className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto object-contain transition-all" />
                ) : (
                  <img src="/vedashi-logo.png" alt="Vedashi" className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto object-contain transition-all" />
                )}
              </Link>
            </div>

            {/* Center Nav Links (Mathematically Centered) */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 w-max">
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
                    onMouseEnter={e => (e.currentTarget.style.color = colors.navbar_hover)}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? colors.navbar_hover : colors.navbar_text)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Icons + Search */}
            <div className="flex items-center justify-end gap-3 sm:gap-4 md:gap-2 lg:gap-3 relative">
              {/* Desktop Search */}
              <div className="hidden md:block relative">
                {searchOpen ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                    <SearchAutocomplete className="w-[240px]" onClose={() => setSearchOpen(false)} />
                    <button onClick={() => setSearchOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button suppressHydrationWarning onClick={() => setSearchOpen(true)} className="p-2 group" aria-label="Open search">
                    <Search className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                  </button>
                )}
              </div>

              {/* Notification Center */}
              <NotificationCenter colors={colors} />

              <div className="flex items-center">
                <Link id="navbar-cart-icon" href={`/${currentCountry}/cart`} className="relative p-2 group">
                  <ShoppingCart className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-black font-ui h-4 w-4 flex items-center justify-center rounded-full tabular-nums"
                      style={{ backgroundColor: colors.cart_badge_bg }}
                    >
                      {totalItems}
                    </span>
                  )}
                </Link>

                {/* Cart Reminder Popup */}
                {showCartReminder && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[30px] shadow-2xl border border-[#4A5D23]/10 overflow-hidden z-[120] animate-in slide-in-from-top-4 fade-in duration-300">
                    {/* Background Texture */}
                    <div
                      className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none"
                      style={{
                        backgroundImage: "url('/ayurvedic-texture.png')",
                        backgroundSize: '200px'
                      }}
                    ></div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCartReminder(false);
                        sessionStorage.removeItem('justSignedIn');
                      }}
                      className="absolute top-3 right-3 p-2 text-[#5B4A31]/40 hover:text-[#4A5D23] transition-all hover:bg-[#4A5D23]/5 rounded-full z-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="relative z-10 p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#4A5D23]/10 flex items-center justify-center flex-shrink-0 animate-pulse text-[#4A5D23]">
                          <Leaf className="h-6 w-6" />
                        </div>
                        <div className="pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-display font-bold text-[#1a2408]">Items left in cart</h4>
                            <Sparkles className="h-3 w-3 text-[#c8a84e]" />
                          </div>
                          <p className="text-xs text-[#5B4A31] leading-relaxed mb-4 font-medium italic font-sans">
                            You previously left {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart. Checkout fast before they go out of stock!
                          </p>
                          <Link
                            href="/cart"
                            onClick={() => {
                              setShowCartReminder(false);
                              sessionStorage.removeItem('justSignedIn');
                            }}
                            className="inline-flex items-center gap-2 text-[10px] font-black font-ui uppercase tracking-widest text-white px-5 py-2.5 rounded-xl transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            style={{ backgroundColor: '#4A5D23' }}
                          >
                            Go to Cart <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile / Account Dropdown */}
              <div className="relative group flex items-center" suppressHydrationWarning>
                <Link href={isAuthenticated ? `/${currentCountry}/account` : `/${currentCountry}/login`} className="relative p-2 block group-hover:text-[#3B5D3B] transition-colors">
                  {isAuthenticated && user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="h-[22px] w-[22px] rounded-full overflow-hidden ring-1 ring-[#D4A847]/30 group-hover:ring-[#D4A847] transition-all">
                      <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <User className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                  )}
                </Link>

                {/* Account Dropdown Desktop */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[120] transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden">
                  <div className="py-2">
                    {isAuthenticated ? (
                      <>
                        <div className="px-5 py-4 border-b border-gray-50 bg-[#3B5D3B]/5">
                          <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'My Account'}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#3B5D3B] hover:bg-[#3B5D3B]/5 transition-all">
                            <Settings className="h-4 w-4" /> Account Settings
                          </Link>
                          <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#3B5D3B] hover:bg-[#3B5D3B]/5 transition-all">
                            <Package className="h-4 w-4" /> My Orders
                          </Link>
                          <Link href="/account/wishlist" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#3B5D3B] hover:bg-[#3B5D3B]/5 transition-all">
                            <Heart className="h-4 w-4" /> My Wishlist
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              logout();
                              toast.success('Logged out successfully');
                              router.push(`/${currentCountry}/login`);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all font-semibold"
                          >
                            <LogOut className="h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-5 py-4 border-b border-gray-50 bg-[#3B5D3B]/5">
                          <p className="text-sm font-bold text-gray-800">Welcome to Vedashi</p>
                          <p className="text-xs text-gray-500 mt-0.5">Sign in to easily track orders, save items, and more.</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link href={`/${currentCountry}/login`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3B5D3B] hover:bg-[#4A724A] transition-all shadow-md shadow-[#3B5D3B]/20">
                            <LogIn className="h-4 w-4" /> Sign In
                          </Link>
                          <Link href={`/${currentCountry}/login?mode=register`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all">
                            <UserPlus className="h-4 w-4" /> Create Account
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Wishlist Icon (Shifted here) */}
              <button suppressHydrationWarning onClick={handleWishlistClick} className="relative p-2 group">
                <Heart className="h-[20px] w-[20px] transition-colors" style={{ color: colors.navbar_text }} />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-black font-ui h-4 w-4 flex items-center justify-center rounded-full tabular-nums"
                    style={{ backgroundColor: colors.cart_badge_bg }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Mobile toggle */}
              <button suppressHydrationWarning onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: colors.navbar_text }}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ SECONDARY NAVBAR ═══════════════ */}
      <SecondaryNavbar />

      {/* ═══════════════ STRIP BAR ═══════════════ */}
      {strip.enabled && (
        <div className="hidden md:block" style={{ backgroundColor: colors.strip_bg }}>
          <div className="mx-auto max-w-[1800px] w-full px-4 lg:px-6">
            <div className="flex items-center justify-between h-9 text-[12px] tracking-wide">

              {/* LEFT */}
              <div className="flex items-center gap-5">
                {strip.show_track_orders && !loading && (
                  <Link
                    href={`/${currentCountry}/account`}
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
                {strip.show_categories && !loading && (
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
                                href={`/${currentCountry}/products?category=${parent.slug}`}
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
                                        href={`/${currentCountry}/products?category=${parent.slug}&sub_category=${sub.slug}`}
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

      {/* ═══════════════ MOBILE MENU (Right Drawer) ═══════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] md:hidden"
            />

            {/* Right Side Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[320px] max-w-[85vw] bg-white shadow-2xl z-[2001] md:hidden flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <img src="/vedashi-logo.png" alt="Vedashi" className="h-10 w-auto object-contain" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <nav className="flex flex-col p-5 gap-1">
                  {/* Mobile Search */}
                  <div className="mb-4">
                    <SearchAutocomplete className="w-full" onClose={() => setMobileOpen(false)} placeholder="Search remedies…" />
                  </div>

                  {/* Main links */}
                  <p className="px-3 text-[10px] uppercase tracking-widest text-[#3B5D3B] font-bold mb-2">Main Menu</p>
                  <div className="space-y-1 mb-6">
                    {visibleLinks.map(link => {
                      const prefixedUrl = link.url.startsWith('/') ? `/${currentCountry}${link.url === '/' ? '' : link.url}` : link.url;
                      const isActive = link.url === '/'
                        ? pathname === `/${currentCountry}` || pathname === `/${currentCountry}/`
                        : pathname?.includes(link.url);

                      return (
                        <Link
                          key={link.label}
                          href={prefixedUrl}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${isActive ? 'bg-[#3B5D3B]/10 text-[#3B5D3B]' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full transition-all ${isActive ? 'bg-[#3B5D3B] scale-100' : 'bg-transparent scale-0'}`} />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Categories */}
                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <p className="px-3 text-[10px] uppercase tracking-widest text-[#3B5D3B] font-bold mb-3">Categories</p>
                    <div className="space-y-4">
                      {parentCategories.map(parent => (
                        <div key={parent.category_id} className="flex flex-col">
                          <Link
                            href={`/${currentCountry}/products?category=${parent.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="py-2 px-3 font-bold text-sm text-gray-800 hover:text-[#3B5D3B] transition-colors"
                          >
                            {parent.name}
                          </Link>
                          <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-100">
                            {categories.filter(c => c.parent_id === parent.category_id).map(sub => (
                              <Link
                                key={sub.category_id}
                                href={`/${currentCountry}/products?category=${parent.slug}&sub_category=${sub.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1.5 pl-6 pr-3 text-sm text-gray-500 hover:text-[#3B5D3B] transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Section */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="px-3 text-[10px] uppercase tracking-widest text-[#3B5D3B] font-bold mb-4">My Account</p>
                    {isAuthenticated ? (
                      <div className="flex flex-col gap-1 p-2 bg-gray-50 rounded-2xl mb-4">
                        <div className="px-3 py-3 flex items-center gap-3 border-b border-gray-200/50 mb-2">
                          <div className="h-10 w-10 rounded-full bg-[#3B5D3B]/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white">
                            {user?.avatar_url ? (
                              <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-[#3B5D3B]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <Link href={`/${currentCountry}/account`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-[#3B5D3B]/5 transition-colors">
                            <Settings className="h-4 w-4" /> Account Settings
                          </Link>
                          <Link href={`/${currentCountry}/account/orders`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-[#3B5D3B]/5 transition-colors">
                            <Package className="h-4 w-4" /> My Orders
                          </Link>
                          <Link href={`/${currentCountry}/account/wishlist`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-[#3B5D3B]/5 transition-colors">
                            <Heart className="h-4 w-4" /> My Wishlist
                          </Link>
                        </div>
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            logout();
                            toast.success('Logged out successfully');
                            router.push(`/${currentCountry}/login`);
                          }}
                          className="flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors mt-2"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 px-1 mb-6">
                        <Link
                          href={`/${currentCountry}/login`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#3B5D3B] shadow-lg shadow-[#3B5D3B]/20"
                        >
                          <LogIn className="h-4 w-4" /> Sign In
                        </Link>
                        <Link
                          href={`/${currentCountry}/login?mode=register`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200"
                        >
                          <UserPlus className="h-4 w-4" /> Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <RegionSwitcher upward={true} />
                  <GoogleTranslateWidget upward={true} />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#3B5D3B]">
                  <Phone className="h-3.5 w-3.5" />
                  Hotline: {strip.hotline}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

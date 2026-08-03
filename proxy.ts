import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// ─── Supported Countries ────────────────────────────────────────────
const SUPPORTED_COUNTRIES = ['us', 'ru', 'kr'] as const;
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];
const DEFAULT_COUNTRY: SupportedCountry = 'us';

const SUPPORTED_SET = new Set<string>(SUPPORTED_COUNTRIES);

// ─── Country → Currency Map ─────────────────────────────────────────
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  us: 'USD',
  ru: 'RUB',
  kr: 'KRW',
};
const DEFAULT_CURRENCY = 'USD';

// ─── Country → Language Map ─────────────────────────────────────────
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  us: 'en',
  ru: 'ru',
  kr: 'ko',
};
const DEFAULT_LANGUAGE = 'en';

// ─── Cookie Config ──────────────────────────────────────────────────
const COOKIE_MAX_AGE_7D = 7 * 24 * 60 * 60;
const COOKIE_MAX_AGE_1D = 1 * 24 * 60 * 60;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const GEO_COOKIE_OPTIONS = {
  path: '/',
  maxAge: COOKIE_MAX_AGE_7D,
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: IS_PRODUCTION,
};

const SUGGESTED_LANG_COOKIE_OPTIONS = {
  path: '/',
  maxAge: COOKIE_MAX_AGE_1D,
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: IS_PRODUCTION,
};

// ─── IPinfo Config ──────────────────────────────────────────────────
const IPINFO_TIMEOUT_MS = 150;

// ─── Helper Functions ───────────────────────────────────────────────

function extractClientIp(request: NextRequest): string | null {
  if (process.env.NODE_ENV !== 'production') {
    const testIp = request.nextUrl.searchParams.get('test_ip');
    if (testIp) return testIp;
  }

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first && first !== '::1' && first !== '127.0.0.1') return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp !== '::1' && realIp !== '127.0.0.1') return realIp;
  return null;
}

function normalizeCountry(raw: string | null | undefined): SupportedCountry | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase();
  return SUPPORTED_SET.has(code) ? (code as SupportedCountry) : null;
}

function getCurrency(country: string): string {
  return COUNTRY_CURRENCY_MAP[country] ?? DEFAULT_CURRENCY;
}

function getLanguage(country: string): string {
  return COUNTRY_LANGUAGE_MAP[country] ?? DEFAULT_LANGUAGE;
}

function detectCountryFromHeaders(request: NextRequest): SupportedCountry | null {
  const vercel = normalizeCountry(request.headers.get('x-vercel-ip-country'));
  if (vercel) return vercel;

  const cf = normalizeCountry(request.headers.get('cf-ipcountry'));
  if (cf) return cf;

  return null;
}

async function fetchCountryFromIPinfo(ip: string): Promise<SupportedCountry | null> {
  const token = process.env.IPINFO_TOKEN;
  if (!token) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPINFO_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://ipinfo.io/${ip}/country?token=${token}`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const text = await res.text();
    return normalizeCountry(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── URL Prefix Strategy ────────────────────────────────────────────
// 'us' (worldwide) uses ROOT URLs: vedashiherbals.com/products
// 'ru' and 'kr' use PREFIXED URLs: vedashiherbals.com/ru/products, vedashiherbals.com/kr/products
const PREFIXED_COUNTRIES = new Set<string>(['ru', 'kr']);

// Old country prefixes that should 301 redirect to root
const LEGACY_PREFIXES = new Set<string>(['in', 'gb', 'ae', 'ca', 'au', 'us']);

function pathHasCountryPrefix(pathname: string): string | null {
  // Check prefixed countries (ru, kr)
  for (const country of PREFIXED_COUNTRIES) {
    if (pathname === `/${country}` || pathname.startsWith(`/${country}/`)) {
      return country;
    }
  }
  return null;
}

function pathHasLegacyPrefix(pathname: string): string | null {
  for (const prefix of LEGACY_PREFIXES) {
    if (pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`)) {
      return prefix;
    }
  }
  return null;
}

function shouldSkip(pathname: string): boolean {
  // Explicitly skip SEO files so they don't get rewritten to /us/
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/sitemap.xsl') {
    return true;
  }

  // Never skip Next.js RSC payload requests (.rsc or .txt prefetch)
  if (pathname.endsWith('.rsc') || (pathname.endsWith('.txt') && pathname !== '/robots.txt')) {
    return false;
  }

  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  );
}

/**
 * Apply language suggestion cookie to a response.
 *
 * Rules:
 * - If user_lang cookie exists → NEVER touch it, don't set suggested_lang.
 * - If user_lang does not exist → set suggested_lang based on country.
 */
function applyLanguageCookies(
  request: NextRequest,
  response: NextResponse,
  country: string
): void {
  const userLang = request.cookies.get('user_lang')?.value;

  // User has a permanent preference — respect it, do nothing
  if (userLang) return;

  // No permanent preference — set a suggestion for the frontend banner
  const suggestedLang = getLanguage(country);
  response.cookies.set('suggested_lang', suggestedLang, SUGGESTED_LANG_COOKIE_OPTIONS);
}

// ─── Constants ──────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

// ─── Proxy (Next.js 16 convention, replaces middleware) ──────────────

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 0. SEO: Enforce HTTPS and non-www canonical domain (redirect www to non-www)
  const host = request.headers.get('host') || request.nextUrl.hostname || '';
  const isWww = host === 'www.vedashiherbals.com' || host === 'www.vedashi.onrender.com';
  
  if (isWww) {
    const target = new URL(`${pathname}${search}`, SITE_URL);
    return NextResponse.redirect(target, 301);
  }

  // 1. Skip static assets, API routes, Next.js internals
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // 2. Handle LEGACY prefixes (/us/*, /in/*, /gb/*, etc.) → 301 redirect to root
  const legacyPrefix = pathHasLegacyPrefix(pathname);
  if (legacyPrefix) {
    // Strip the legacy prefix → redirect to root
    const restOfPath = pathname.slice(`/${legacyPrefix}`.length) || '/';
    const baseUrl = process.env.NODE_ENV === 'production' ? SITE_URL : request.nextUrl.origin;
    const redirectUrl = new URL(`${restOfPath}${search}`, baseUrl);
    const response = NextResponse.redirect(redirectUrl, 301);
    // Ensure cookies reflect worldwide defaults
    response.cookies.set('geo_country', 'us', GEO_COOKIE_OPTIONS);
    response.cookies.set('geo_currency', 'USD', GEO_COOKIE_OPTIONS);
    return response;
  }

  // 3. Handle PREFIXED countries (/ru/*, /kr/*) → pass through normally
  const existingCountry = pathHasCountryPrefix(pathname);
  if (existingCountry) {
    const response = NextResponse.next();
    const currency = getCurrency(existingCountry);

    // Sync cookies to URL prefix
    if (request.cookies.get('geo_country')?.value !== existingCountry) {
      response.cookies.set('geo_country', existingCountry, GEO_COOKIE_OPTIONS);
    }
    if (request.cookies.get('geo_currency')?.value !== currency) {
      response.cookies.set('geo_currency', currency, GEO_COOKIE_OPTIONS);
    }

    applyLanguageCookies(request, response, existingCountry);
    return response;
  }

  // 4. ROOT URLs (/products, /about, /cart, etc.) → Geo-detect or default to worldwide
  //    We check if user should be redirected to a prefixed country, otherwise rewrite to /us/

  let country: SupportedCountry | null = null;

  // Tier 1: User Manual Preference (Lock)
  const isManual = request.cookies.get('geo_manual')?.value === 'true';
  if (isManual) {
    country = normalizeCountry(request.cookies.get('geo_country')?.value);
  }

  // Tier 2: Platform headers (Vercel / Cloudflare)
  if (!country) {
    country = detectCountryFromHeaders(request);
  }

  // Tier 3: IPinfo.io fallback
  if (!country) {
    const clientIp = extractClientIp(request);
    if (clientIp) {
      country = await fetchCountryFromIPinfo(clientIp);
    }
  }

  // Tier 4: Previous Auto-detected Cookie
  if (!country) {
    country = normalizeCountry(request.cookies.get('geo_country')?.value);
  }

  // Tier 5: Default fallback
  if (!country) {
    country = DEFAULT_COUNTRY;
  }

  // If detected country is a PREFIXED country (ru/kr), redirect to the prefixed URL
  if (PREFIXED_COUNTRIES.has(country)) {
    const currency = getCurrency(country);
    let targetPath = `/${country}${pathname}`;
    if (targetPath.endsWith('/') && targetPath.length > 3) {
      targetPath = targetPath.slice(0, -1);
    }
    
    const baseUrl = process.env.NODE_ENV === 'production' ? SITE_URL : request.nextUrl.origin;
    const redirectUrl = new URL(`${targetPath}${search}`, baseUrl);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set('geo_country', country, GEO_COOKIE_OPTIONS);
    response.cookies.set('geo_currency', currency, GEO_COOKIE_OPTIONS);
    applyLanguageCookies(request, response, country);
    return response;
  }

  // Otherwise: worldwide (us) — REWRITE to /us/ internally (URL stays clean in browser)
  const rewritePath = `/us${pathname === '/' ? '' : pathname}`;
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath || '/us';

  const response = NextResponse.rewrite(rewriteUrl);

  // Set worldwide cookies
  if (request.cookies.get('geo_country')?.value !== 'us') {
    response.cookies.set('geo_country', 'us', GEO_COOKIE_OPTIONS);
  }
  if (request.cookies.get('geo_currency')?.value !== 'USD') {
    response.cookies.set('geo_currency', 'USD', GEO_COOKIE_OPTIONS);
  }

  applyLanguageCookies(request, response, 'us');
  return response;
}

// ─── Matcher ────────────────────────────────────────────────────────

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with API, static, images, and files with extensions
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Specifically match .rsc and .txt files for Next.js soft navigation in production
    '/(.*\\.rsc)',
    '/(.*\\.txt)',
  ],
};

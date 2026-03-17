import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';




// ─── Supported Countries ────────────────────────────────────────────
const SUPPORTED_COUNTRIES = ['in', 'us', 'gb', 'ae', 'ca', 'au', 'ru', 'kr'] as const;
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];
const DEFAULT_COUNTRY: SupportedCountry = 'in';

const SUPPORTED_SET = new Set<string>(SUPPORTED_COUNTRIES);

// ─── Country → Currency Map ─────────────────────────────────────────
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  in: 'INR',
  us: 'USD',
  gb: 'GBP',
  ae: 'AED',
  ca: 'CAD',
  au: 'AUD',
  ru: 'RUB',
  kr: 'KRW',
};
const DEFAULT_CURRENCY = 'USD';

// ─── Country → Language Map ─────────────────────────────────────────
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  in: 'en',
  us: 'en',
  gb: 'en',
  ca: 'en',
  au: 'en',
  ru: 'ru',
  ae: 'ar',
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
const IPINFO_TIMEOUT_MS = 800;

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

function pathHasCountryPrefix(pathname: string): string | null {
  for (const country of SUPPORTED_COUNTRIES) {
    if (pathname === `/${country}` || pathname.startsWith(`/${country}/`)) {
      return country;
    }
  }
  return null;
}

function shouldSkip(pathname: string): boolean {
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

// ─── Middleware ──────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, API routes, Next.js internals
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // 2. URL already has a valid country prefix → pass through, sync cookies
  const existingCountry = pathHasCountryPrefix(pathname);
  if (existingCountry) {
    const response = NextResponse.next();
    const currency = getCurrency(existingCountry);

    if (request.cookies.get('geo_country')?.value !== existingCountry) {
      response.cookies.set('geo_country', existingCountry, GEO_COOKIE_OPTIONS);
    }
    if (request.cookies.get('geo_currency')?.value !== currency) {
      response.cookies.set('geo_currency', currency, GEO_COOKIE_OPTIONS);
    }

    // Language suggestion (non-intrusive)
    applyLanguageCookies(request, response, existingCountry);

    return response;
  }

  // 3. Resolve country — tiered strategy
  let country: SupportedCountry | null = null;

  // Tier 1: Cookie (fastest — zero I/O)
  country = normalizeCountry(request.cookies.get('geo_country')?.value);

  // Tier 2: Platform headers (Vercel / Cloudflare — zero I/O)
  if (!country) {
    country = detectCountryFromHeaders(request);
  }

  // Tier 3: IPinfo.io fallback (async, max 800ms)
  if (!country) {
    const clientIp = extractClientIp(request);
    if (clientIp) {
      country = await fetchCountryFromIPinfo(clientIp);
    }
  }

  // Tier 4: Default fallback
  if (!country) {
    country = DEFAULT_COUNTRY;
  }

  // 4. Build redirect to /{country}{pathname}
  const currency = getCurrency(country);
  const url = request.nextUrl.clone();
  url.pathname = `/${country}${pathname}`;

  const response = NextResponse.redirect(url);

  // 5. Set geo cookies
  response.cookies.set('geo_country', country, GEO_COOKIE_OPTIONS);
  response.cookies.set('geo_currency', currency, GEO_COOKIE_OPTIONS);

  // 6. Language suggestion (non-intrusive — never auto-redirects)
  applyLanguageCookies(request, response, country);

  return response;
}

// ─── Matcher ────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

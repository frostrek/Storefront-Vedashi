import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_COUNTRIES = ['us', 'in', 'ru', 'kr'];
const DEFAULT_COUNTRY = 'in';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, Next.js internals
  if (
    pathname.includes('.') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Check if the URL already has a supported country prefix
  const pathnameHasCountry = SUPPORTED_COUNTRIES.some(
    (country) => pathname.startsWith(`/${country}/`) || pathname === `/${country}`
  );

  if (pathnameHasCountry) {
    return NextResponse.next();
  }

  // Determine country from cookie
  let country = request.cookies.get('vedashi_country')?.value;

  // If no cookie, try geo-detection
  if (!country) {
    // Vercel specific headers
    const geoCountry = request.headers.get('x-vercel-ip-country');
    if (geoCountry) {
      const code = geoCountry.toLowerCase();
      if (SUPPORTED_COUNTRIES.includes(code)) {
        country = code;
      }
    }
  }

  // Fallback to default
  if (!country || !SUPPORTED_COUNTRIES.includes(country)) {
    country = DEFAULT_COUNTRY;
  }

  // Redirect to the country-specific path
  request.nextUrl.pathname = `/${country}${pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  
  // Set cookie for future visits
  response.cookies.set('vedashi_country', country, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}

export const config = {
  matcher: [
    // Skip internal paths
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

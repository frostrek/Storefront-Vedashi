export type SupportedCountryCode = 'us' | 'ru' | 'kr';

export interface CountryConfig {
  code: SupportedCountryCode;
  name: string;
  currency: string;
  locale: string;
  flag: string;
  symbol: string;
}

export const SUPPORTED_COUNTRIES: Record<SupportedCountryCode, CountryConfig> = {
  us: { code: 'us', name: 'Worldwide',        currency: 'USD', locale: 'en-US', flag: '🇺🇸', symbol: '$' },
  ru: { code: 'ru', name: 'Russia',           currency: 'RUB', locale: 'ru-RU', flag: '🇷🇺', symbol: '₽' },
  kr: { code: 'kr', name: 'South Korea',      currency: 'KRW', locale: 'ko-KR', flag: '🇰🇷', symbol: '₩' },
};

/** Country codes that get a URL prefix. 'us' (worldwide) uses root URLs. */
const PREFIXED_COUNTRIES = new Set<string>(['ru', 'kr']);

/**
 * Build a URL path respecting the country prefix convention.
 * - Worldwide ('us'): `/products`, `/about`, etc. (no prefix)
 * - Russia/Korea: `/ru/products`, `/kr/products`
 */
export function buildPath(country: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (PREFIXED_COUNTRIES.has(country)) {
    return `/${country}${cleanPath}`;
  }
  return cleanPath || '/';
}

/**
 * Extract the country code from a browser pathname.
 * - `/ru/products` → 'ru'
 * - `/kr/about` → 'kr'
 * - `/products` → 'us' (worldwide default)
 */
export function getCountryFromPathname(pathname: string): SupportedCountryCode {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && PREFIXED_COUNTRIES.has(first)) return first as SupportedCountryCode;
  return 'us';
}

/**
 * Represents a per-country USD price override from the backend.
 * (Column name `price_inr` is a legacy DB name — values are now in USD.)
 */
export interface CountryPriceOverride {
  country_code: string;   // uppercase: 'US', 'GB', etc.
  price_inr: number;      // legacy column name — value is in USD
  country_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate?: number;
}

/**
 * Currency configuration from the database (currency_config table).
 */
export interface CurrencyConfigEntry {
  country_code: string;       // uppercase: 'US', 'IN', etc.
  country_name: string;
  currency_code: string;      // 'USD', 'INR', etc.
  currency_symbol: string;    // '$', '₹', etc.
  exchange_rate: number;      // 1 USD = X target currency
}

/**
 * Resolve the base USD price given a country and optional per-product overrides.
 *
 * Priority:
 * 1. Country-specific override (if > 0)
 * 2. Default price (amountUsd)
 */
export function resolveBasePrice(
  amountUsd: number,
  countryCode: string,
  countryPrices?: CountryPriceOverride[] | null
): number {
  if (countryPrices && countryPrices.length > 0) {
    const upper = countryCode.toUpperCase();
    const override = countryPrices.find(cp => cp.country_code.toUpperCase() === upper);
    if (override && Number(override.price_inr) > 0) {
      return Number(override.price_inr);
    }
  }
  return Number(amountUsd) || 0;
}

/** @deprecated Use resolveBasePrice instead. Kept for backward compat. */
export const resolveInrPrice = resolveBasePrice;

/**
 * Format a price safely based on locale and currency.
 * Automatically converts the standard base price (in USD) to target currency using the provided rate.
 * @param amountUsd Base amount in USD
 * @param currency Target currency code
 * @param rate Exchange rate (1 USD = X Target)
 * @param locale Target locale for Intl.NumberFormat
 */
export function formatPrice(
  amountUsd: number | string | null | undefined,
  currency: string = 'USD',
  rate: number = 1,
  locale: string = 'en-US'
): string {
  const n = Number(amountUsd) || 0;
  
  // Base case - no conversion needed
  if (currency === 'USD') {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Convert
  const converted = n * rate;

  // Formatting rules specific to currency
  let formattedCurrency = '';
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    });
    formattedCurrency = formatter.format(converted);
  } catch (e) {
    // Fallback if Intl fails
    const sym = Object.values(SUPPORTED_COUNTRIES).find(c => c.currency === currency)?.symbol || currency;
    formattedCurrency = `${sym}${converted.toFixed(currency === 'KRW' ? 0 : 2)}`;
  }

  return formattedCurrency;
}

/**
 * Format an ALREADY-CONVERTED local amount safely based on locale and currency.
 * DOES NOT multiply by any exchange rate.
 * @param localAmount The numerical amount in the target currency
 * @param currency Target currency code (e.g. 'RUB', 'KRW')
 * @param locale Target locale (e.g. 'ru-RU', 'ko-KR')
 */
export function formatLocal(
  localAmount: number | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const n = Number(localAmount) || 0;
  
  // Base case - USD formatting
  if (currency === 'USD') {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  let formattedCurrency = '';
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    });
    formattedCurrency = formatter.format(n);
  } catch (e) {
    // Fallback if Intl fails
    const sym = Object.values(SUPPORTED_COUNTRIES).find(c => c.currency === currency)?.symbol || currency;
    formattedCurrency = `${sym}${n.toFixed(currency === 'KRW' ? 0 : 2)}`;
  }

  return formattedCurrency;
}

/**
 * Derive a country-specific MRP from a country selling price using the USD discount %.
 *
 * Logic: If USD prices show a 28% discount (MRP→SP), and the country SP is 750,
 * then country MRP = ceil(750 × 1.28) = 960.
 *
 * @param countrySp  The country-specific selling price (override)
 * @param usdSp      The USD selling price
 * @param usdMrp     The USD MRP / original price
 * @returns The derived country MRP (ceiled to integer if fractional)
 */
export function deriveCountryMrp(
  countrySp: number,
  usdSp: number,
  usdMrp: number
): number {
  if (!countrySp || countrySp <= 0) return 0;
  if (!usdMrp || usdMrp <= 0 || usdMrp <= usdSp) return countrySp; // no discount
  const discountPct = (usdMrp - usdSp) / usdMrp; // e.g. 0.28
  if (discountPct <= 0 || discountPct >= 1) return countrySp;
  // MRP such that SP is discountPct% off → MRP = SP / (1 - discountPct)
  // But user requested "28% up in reference to SP" → MRP = SP * (1 + discountPct)
  const derived = countrySp * (1 + discountPct);
  return Math.ceil(derived);
}

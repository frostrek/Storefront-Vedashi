export type SupportedCountryCode = 'us' | 'in' | 'gb' | 'ae' | 'ca' | 'au' | 'ru' | 'kr';

export interface CountryConfig {
  code: SupportedCountryCode;
  name: string;
  currency: string;
  locale: string;
  flag: string;
  symbol: string;
}

export const SUPPORTED_COUNTRIES: Record<SupportedCountryCode, CountryConfig> = {
  in: { code: 'in', name: 'India',            currency: 'INR', locale: 'en-IN', flag: '🇮🇳', symbol: '₹' },
  us: { code: 'us', name: 'United States',    currency: 'USD', locale: 'en-US', flag: '🇺🇸', symbol: '$' },
  gb: { code: 'gb', name: 'United Kingdom',   currency: 'GBP', locale: 'en-GB', flag: '🇬🇧', symbol: '£' },
  ae: { code: 'ae', name: 'UAE',              currency: 'AED', locale: 'ar-AE', flag: '🇦🇪', symbol: 'د.إ' },
  ca: { code: 'ca', name: 'Canada',           currency: 'CAD', locale: 'en-CA', flag: '🇨🇦', symbol: 'CA$' },
  au: { code: 'au', name: 'Australia',        currency: 'AUD', locale: 'en-AU', flag: '🇦🇺', symbol: 'A$' },
  ru: { code: 'ru', name: 'Russia',           currency: 'RUB', locale: 'ru-RU', flag: '🇷🇺', symbol: '₽' },
  kr: { code: 'kr', name: 'South Korea',      currency: 'KRW', locale: 'ko-KR', flag: '🇰🇷', symbol: '₩' },
};

/**
 * Represents a per-country INR price override from the backend.
 */
export interface CountryPriceOverride {
  country_code: string;   // uppercase: 'US', 'GB', etc.
  price_inr: number;
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
  exchange_rate: number;      // 1 INR = X target currency
}

/**
 * Resolve the base INR price given a country and optional per-product overrides.
 *
 * Priority:
 * 1. Country-specific override (if > 0)
 * 2. Default price (amountInr)
 */
export function resolveInrPrice(
  amountInr: number,
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
  return Number(amountInr) || 0;
}

/**
 * Format a price safely based on locale and currency.
 * Automatically converts the standard base price (in INR) to target currency using the provided rate.
 * @param amountInr Base amount in INR
 * @param currency Target currency code
 * @param rate Exchange rate (1 INR = X Target)
 * @param locale Target locale for Intl.NumberFormat
 */
export function formatPrice(
  amountInr: number | string | null | undefined,
  currency: string = 'INR',
  rate: number = 1,
  locale: string = 'en-IN'
): string {
  const n = Number(amountInr) || 0;
  
  // Base case - no conversion needed
  if (currency === 'INR') {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  // Convert
  let converted = n * rate;

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

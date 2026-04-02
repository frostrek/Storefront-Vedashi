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

/**
 * Language Configuration & Cookie Utilities
 *
 * Maps countries to suggested languages and provides
 * cookie helpers for the language preference system.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'ru' | 'ar' | 'ko';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// ─── Language Registry ──────────────────────────────────────────────

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: { code: 'en', name: 'English',  nativeName: 'English',  flag: '🇬🇧' },
  ru: { code: 'ru', name: 'Russian',  nativeName: 'Русский',  flag: '🇷🇺' },
  ar: { code: 'ar', name: 'Arabic',   nativeName: 'العربية',  flag: '🇦🇪' },
  ko: { code: 'ko', name: 'Korean',   nativeName: '한국어',    flag: '🇰🇷' },
};

// ─── Country → Language Map ─────────────────────────────────────────

export const COUNTRY_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  in: 'en',
  us: 'en',
  gb: 'en',
  ca: 'en',
  au: 'en',
  ru: 'ru',
  ae: 'ar',
  kr: 'ko',
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// ─── Country Display Names (for the banner) ────────────────────────

export const COUNTRY_DISPLAY_NAMES: Record<string, string> = {
  in: 'India',
  us: 'the United States',
  gb: 'the United Kingdom',
  ca: 'Canada',
  au: 'Australia',
  ru: 'Russia',
  ae: 'the UAE',
  kr: 'South Korea',
};

// ─── Cookie Helpers ─────────────────────────────────────────────────

export const LANG_COOKIES = {
  USER_LANG: 'user_lang',
  SUGGESTED_LANG: 'suggested_lang',
} as const;

/**
 * Get a cookie value by name (client-side).
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Set a cookie (client-side).
 */
export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

/**
 * Delete a cookie (client-side).
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * Set user's permanent language preference (1 year).
 */
export function setUserLanguage(lang: SupportedLanguage): void {
  setCookie(LANG_COOKIES.USER_LANG, lang, 365 * 24 * 60 * 60);
  // Clean up suggestion cookie once user has chosen
  deleteCookie(LANG_COOKIES.SUGGESTED_LANG);
}

/**
 * Get the suggested language from cookie.
 */
export function getSuggestedLanguage(): SupportedLanguage | null {
  const val = getCookie(LANG_COOKIES.SUGGESTED_LANG);
  if (val && val in SUPPORTED_LANGUAGES) return val as SupportedLanguage;
  return null;
}

/**
 * Get the user's permanent language from cookie.
 */
export function getUserLanguage(): SupportedLanguage | null {
  const val = getCookie(LANG_COOKIES.USER_LANG);
  if (val && val in SUPPORTED_LANGUAGES) return val as SupportedLanguage;
  return null;
}

/**
 * Resolve the suggested language for a given country code.
 */
export function getSuggestedLanguageForCountry(country: string): SupportedLanguage {
  return COUNTRY_LANGUAGE_MAP[country.toLowerCase()] ?? DEFAULT_LANGUAGE;
}

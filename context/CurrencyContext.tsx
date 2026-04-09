'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  CountryConfig,
  SUPPORTED_COUNTRIES,
  SupportedCountryCode,
  CurrencyConfigEntry,
  CountryPriceOverride,
  resolveInrPrice,
  formatPrice,
} from '@/lib/currency';
import { API_URL } from '@/lib/api';

interface CurrencyContextType {
  countryCode: SupportedCountryCode;
  countryConfig: CountryConfig;
  currencyConfigs: CurrencyConfigEntry[];
  /**
   * Format a price for display. Handles country-based conversion automatically.
   *
   * @param amountInr - Default price in INR
   * @param countryPrices - Optional per-product country price overrides from the backend
   */
  formatPrice: (
    amountInr: number | string | null | undefined,
    countryPrices?: CountryPriceOverride[] | null
  ) => string;
  isLoadingRates: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({
  children,
  countryCode
}: {
  children: React.ReactNode;
  countryCode: SupportedCountryCode;
}) {
  const [currencyConfigs, setCurrencyConfigs] = useState<CurrencyConfigEntry[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const countryConfig = SUPPORTED_COUNTRIES[countryCode] || SUPPORTED_COUNTRIES['us'];

  useEffect(() => {
    async function fetchCurrencyConfig() {
      try {
        const res = await fetch(`${API_URL}/api/currency-config`, { next: { revalidate: 3600 } } as any);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setCurrencyConfigs(data.data.map((entry: any) => ({
              ...entry,
              exchange_rate: Number(entry.exchange_rate),
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch currency config:', error);
      } finally {
        setIsLoadingRates(false);
      }
    }

    // Only fetch if we are not in India, to save API calls
    if (countryConfig.currency !== 'INR') {
      fetchCurrencyConfig();
    } else {
      setIsLoadingRates(false);
    }
  }, [countryConfig.currency]);

  // Build the bound formatPrice function
  const boundFormatPrice = useMemo(() => {
    // Lookup the currency config for the current country (uppercase match)
    const upperCode = countryCode.toUpperCase();
    const currentConfig = currencyConfigs.find(c => c.country_code === upperCode);
    // USD fallback config
    const usdConfig = currencyConfigs.find(c => c.country_code === 'US');

    return (
      amountInr: number | string | null | undefined,
      countryPrices?: CountryPriceOverride[] | null
    ): string => {
      const baseAmount = Number(amountInr) || 0;

      // For India — always show INR
      if (countryCode === 'in') {
        // Still check for a country-specific override (unlikely for IN but technically possible)
        const resolved = resolveInrPrice(baseAmount, 'IN', countryPrices);
        return formatPrice(resolved, 'INR', 1, 'en-IN');
      }

      // Resolve the INR price (country override or default)
      const resolvedInr = resolveInrPrice(baseAmount, upperCode, countryPrices);

      // 1. Use the country's currency config if available
      if (currentConfig) {
        return formatPrice(
          resolvedInr,
          currentConfig.currency_code,
          currentConfig.exchange_rate,
          countryConfig.locale
        );
      }

      // 2. Fallback: use USD if currency config not found for this country
      if (usdConfig) {
        return formatPrice(resolvedInr, 'USD', usdConfig.exchange_rate, 'en-US');
      }

      // 3. Last resort: show raw INR
      return formatPrice(resolvedInr, 'INR', 1, 'en-IN');
    };
  }, [countryCode, countryConfig.locale, currencyConfigs]);

  const value: CurrencyContextType = {
    countryCode,
    countryConfig,
    currencyConfigs,
    formatPrice: boundFormatPrice,
    isLoadingRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // If used outside provider (e.g. in root layout or admin), fallback to INR/India
    return {
      countryCode: 'in' as SupportedCountryCode,
      countryConfig: SUPPORTED_COUNTRIES['in'],
      currencyConfigs: [],
      formatPrice: (amount: number | string | null | undefined, countryPrices?: CountryPriceOverride[] | null) => formatPrice(amount, 'INR', 1, 'en-IN'),
      isLoadingRates: false,
    };
  }
  return context;
}

'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  CountryConfig,
  SUPPORTED_COUNTRIES,
  SupportedCountryCode,
  CurrencyConfigEntry,
  CountryPriceOverride,
  resolveBasePrice,
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
   * @param amountUsd - Default price in USD (base currency)
   * @param countryPrices - Optional per-product country price overrides from the backend
   */
  formatPrice: (
    amountUsd: number | string | null | undefined,
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

    // Only fetch if we are not in the US (base currency), to save API calls
    if (countryConfig.currency !== 'USD') {
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

    return (
      amountUsd: number | string | null | undefined,
      countryPrices?: CountryPriceOverride[] | null
    ): string => {
      const baseAmount = Number(amountUsd) || 0;

      // For US — always show USD (base currency, no conversion)
      if (countryCode === 'us') {
        // Still check for a country-specific override (unlikely for US but technically possible)
        const resolved = resolveBasePrice(baseAmount, 'US', countryPrices);
        return formatPrice(resolved, 'USD', 1, 'en-US');
      }

      // Resolve the USD price (country override or default)
      const basePrice = Number(amountUsd) || 0;
      
      let overridePrice: number | null = null;
      if (countryPrices && countryPrices.length > 0) {
        const override = countryPrices.find(cp => cp.country_code.toUpperCase() === upperCode);
        if (override && Number(override.price_inr) > 0) {
          overridePrice = Number(override.price_inr);
        }
      }

      // 1. If an exact local price override exists for this country
      if (overridePrice !== null && currentConfig) {
        // Do NOT multiply by exchange_rate. Pass 1 as the rate.
        return formatPrice(
          overridePrice,
          currentConfig.currency_code,
          1, // <--- key change: treat as already converted
          countryConfig.locale
        );
      }

      // 2. Use the standard base USD price and multiply by exchange rate
      if (currentConfig) {
        return formatPrice(
          basePrice,
          currentConfig.currency_code,
          currentConfig.exchange_rate,
          countryConfig.locale
        );
      }

      // 3. Last resort: show raw USD
      return formatPrice(basePrice, 'USD', 1, 'en-US');
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
    // If used outside provider (e.g. in root layout or admin), fallback to USD/US
    return {
      countryCode: 'us' as SupportedCountryCode,
      countryConfig: SUPPORTED_COUNTRIES['us'],
      currencyConfigs: [],
      formatPrice: (amount: number | string | null | undefined, countryPrices?: CountryPriceOverride[] | null) => formatPrice(amount, 'USD', 1, 'en-US'),
      isLoadingRates: false,
    };
  }
  return context;
}

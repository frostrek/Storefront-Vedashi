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
  formatLocal,
  deriveCountryMrp,
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
  /**
   * Format an MRP for display. For countries with a price override,
   * derives the MRP from the country SP using the USD discount percentage.
   *
   * @param usdMrp       - The MRP / original price in USD
   * @param usdSp        - The selling / display price in USD
   * @param countryPrices - Optional per-product country price overrides
   */
  formatMrp: (
    usdMrp: number | string | null | undefined,
    usdSp: number | string | null | undefined,
    countryPrices?: CountryPriceOverride[] | null
  ) => string;
  /**
   * Resolve a USD price to the active country's numerical value (applying overrides or exchange rate).
   */
  resolvePrice: (
    amountUsd: number | string | null | undefined,
    countryPrices?: CountryPriceOverride[] | null
  ) => number;
  /**
   * Resolve a USD MRP to the active country's numerical MRP value.
   */
  resolveMrp: (
    usdMrp: number | string | null | undefined,
    usdSp: number | string | null | undefined,
    countryPrices?: CountryPriceOverride[] | null
  ) => number;
  /**
   * Format a numerical value that is ALREADY in the active country's currency.
   */
  format: (localAmount: number | string | null | undefined) => string;
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
        const res = await fetch(`${API_URL}/api/currency-config`);
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

  // 1. Core resolve function for SP
  const resolvePriceFn = useMemo(() => {
    const upperCode = countryCode.toUpperCase();
    const currentConfig = currencyConfigs.find(c => c.country_code === upperCode);

    return (
      amountUsd: number | string | null | undefined,
      countryPrices?: CountryPriceOverride[] | null
    ): number => {
      const baseAmount = Number(amountUsd) || 0;

      if (countryPrices && countryPrices.length > 0) {
        const override = countryPrices.find(cp => cp.country_code.toUpperCase() === upperCode);
        if (override && Number(override.price_inr) > 0) {
          return Number(override.price_inr);
        }
      }

      if (currentConfig) {
        return baseAmount * currentConfig.exchange_rate;
      }
      return baseAmount;
    };
  }, [countryCode, currencyConfigs]);

  // 2. Core resolve function for MRP
  const resolveMrpFn = useMemo(() => {
    const upperCode = countryCode.toUpperCase();
    const currentConfig = currencyConfigs.find(c => c.country_code === upperCode);

    return (
      usdMrp: number | string | null | undefined,
      usdSp: number | string | null | undefined,
      countryPrices?: CountryPriceOverride[] | null
    ): number => {
      const mrp = Number(usdMrp) || 0;
      const sp = Number(usdSp) || 0;

      if (countryPrices && countryPrices.length > 0) {
        const override = countryPrices.find(cp => cp.country_code.toUpperCase() === upperCode);
        if (override && Number(override.price_inr) > 0) {
          const overrideSp = Number(override.price_inr);
          return deriveCountryMrp(overrideSp, sp, mrp);
        }
      }

      if (currentConfig) {
        return mrp * currentConfig.exchange_rate;
      }
      return mrp;
    };
  }, [countryCode, currencyConfigs]);

  // 3. Core formatter (already converted)
  const formatFn = useMemo(() => {
    const upperCode = countryCode.toUpperCase();
    const currentConfig = currencyConfigs.find(c => c.country_code === upperCode);
    
    return (localAmount: number | string | null | undefined): string => {
      if (currentConfig) return formatLocal(localAmount, currentConfig.currency_code, countryConfig.locale);
      return formatLocal(localAmount, countryConfig.currency, countryConfig.locale);
    };
  }, [countryCode, countryConfig.locale, currencyConfigs]);

  // 4. Backward compatible formatPrice (resolve + format)
  const boundFormatPrice = useMemo(() => {
    return (
      amountUsd: number | string | null | undefined,
      countryPrices?: CountryPriceOverride[] | null
    ): string => {
      const localNum = resolvePriceFn(amountUsd, countryPrices);
      return formatFn(localNum);
    };
  }, [resolvePriceFn, formatFn]);

  // 5. Backward compatible formatMrp (resolve + format)
  const boundFormatMrp = useMemo(() => {
    return (
      usdMrp: number | string | null | undefined,
      usdSp: number | string | null | undefined,
      countryPrices?: CountryPriceOverride[] | null
    ): string => {
      const localNum = resolveMrpFn(usdMrp, usdSp, countryPrices);
      return formatFn(localNum);
    };
  }, [resolveMrpFn, formatFn]);

  const value: CurrencyContextType = {
    countryCode,
    countryConfig,
    currencyConfigs,
    resolvePrice: resolvePriceFn,
    resolveMrp: resolveMrpFn,
    format: formatFn,
    formatPrice: boundFormatPrice,
    formatMrp: boundFormatMrp,
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
      countryCode: 'ru' as SupportedCountryCode,
      countryConfig: SUPPORTED_COUNTRIES['ru'],
      currencyConfigs: [],
      resolvePrice: (usdAmount: number | string | null | undefined, itemOverrides?: CountryPriceOverride[] | null | undefined) => Number(usdAmount) || 0,
      resolveMrp: (usdMrp: number | string | null | undefined, usdSp?: number | string | null | undefined, itemOverrides?: CountryPriceOverride[] | null | undefined) => Number(usdMrp) || 0,
      format: (localAmount: number | string | null | undefined) => formatPrice(localAmount, 'RUB', 1, 'ru-RU'),
      formatPrice: (amount: number | string | null | undefined, countryPrices?: CountryPriceOverride[] | null) => formatPrice(amount, 'RUB', 1, 'ru-RU'),
      formatMrp: (usdMrp: number | string | null | undefined, usdSp?: number | string | null | undefined, countryPrices?: CountryPriceOverride[] | null) => formatPrice(usdMrp, 'RUB', 1, 'ru-RU'),
      isLoadingRates: false,
    };
  }
  return context;
}

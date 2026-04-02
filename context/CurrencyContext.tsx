'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CountryConfig, SUPPORTED_COUNTRIES, SupportedCountryCode, formatPrice } from '@/lib/currency';
import { API_URL } from '@/lib/api';

interface CurrencyContextType {
  countryConfig: CountryConfig;
  rates: Record<string, number>; // Currency -> Rate (e.g. { USD: 0.012, INR: 1 })
  formatPrice: (amountInr: number | string | null | undefined) => string;
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
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 }); // Default base
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const countryConfig = SUPPORTED_COUNTRIES[countryCode] || SUPPORTED_COUNTRIES['us'];

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch(`${API_URL}/api/currency/rates`, { next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            // Convert array of { target_currency, rate } into object
            const ratesObj: Record<string, number> = { INR: 1 };
            data.data.forEach((r: { target_currency: string; rate: number | string }) => {
              ratesObj[r.target_currency] = Number(r.rate);
            });
            setRates(ratesObj);
          }
        }
      } catch (error) {
        console.error('Failed to fetch currency rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    }

    // Only fetch if we are not in India, to save API calls
    if (countryConfig.currency !== 'INR') {
      fetchRates();
    } else {
      setIsLoadingRates(false);
    }
  }, [countryConfig.currency]);

  // Create a bound version of formatPrice for convenience
  const boundFormatPrice = useMemo(() => {
    // Fallback to 1 if rate not loaded yet
    const currentRate = rates[countryConfig.currency] || 1;
    return (amountInr: number | string | null | undefined) => 
      formatPrice(amountInr, countryConfig.currency, currentRate, countryConfig.locale);
  }, [rates, countryConfig]);

  const value = {
    countryConfig,
    rates,
    formatPrice: boundFormatPrice,
    isLoadingRates
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
      countryConfig: SUPPORTED_COUNTRIES['in'],
      rates: { INR: 1 },
      formatPrice: (amount: number | string | null | undefined) => formatPrice(amount, 'INR', 1, 'en-IN'),
      isLoadingRates: false
    };
  }
  return context;
}

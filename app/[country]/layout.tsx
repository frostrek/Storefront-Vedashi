import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SUPPORTED_COUNTRIES, SupportedCountryCode } from '@/lib/currency';
import GeoTracker from '@/components/analytics/GeoTracker';

export default async function CountryLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  
  // Validate the country slug
  if (!Object.keys(SUPPORTED_COUNTRIES).includes(country)) {
    notFound();
  }

  return (
    <CurrencyProvider countryCode={country as SupportedCountryCode}>
      <GeoTracker country={country} />
      {children}
    </CurrencyProvider>
  );
}

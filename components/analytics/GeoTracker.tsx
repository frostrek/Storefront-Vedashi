'use client';

import { useEffect } from 'react';

interface GeoTrackerProps {
  country?: string;
}

/**
 * GeoTracker Component
 * ────────────────────────────────────
 * Injects the country code into the GTM dataLayer on initial page load.
 * This enables geo-aware tracking behaviors (e.g., GA4 for IN, GA4+Yandex for RU).
 * 
 * Logic is handled in GTM based on the 'country' variable.
 */
export default function GeoTracker({ country = 'IN' }: GeoTrackerProps) {
  useEffect(() => {
    // Ensure window.dataLayer exists
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      
      // Standardize country code to uppercase
      const countryCode = country.toUpperCase();
      
      // Push country into dataLayer
      window.dataLayer.push({
        country: countryCode,
        event: 'geo_location_ready' // Custom event for GTM triggers if needed
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] Geo-aware initialized: ${countryCode}`);
      }
    }
  }, [country]);

  return null;
}

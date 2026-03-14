'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import { ChevronDown, Globe } from 'lucide-react';

export default function RegionSwitcher() {
  const { countryConfig } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parts = pathname.split('/');
  const urlCountry = parts[1];
  const isValidCountry = Object.keys(SUPPORTED_COUNTRIES).includes(urlCountry);
  const country = isValidCountry ? urlCountry : 'in';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newCountry: string) => {
    setIsOpen(false);
    if (newCountry === country) return;

    // Set cookies (7 days)
    document.cookie = `geo_country=${newCountry}; max-age=${7 * 24 * 60 * 60}; path=/`;
    const currencyMap: Record<string, string> = { in: 'INR', us: 'USD', gb: 'GBP', ae: 'AED', ca: 'CAD', au: 'AUD', ru: 'RUB', kr: 'KRW' };
    document.cookie = `geo_currency=${currencyMap[newCountry] || 'USD'}; max-age=${7 * 24 * 60 * 60}; path=/`;

    // Replace country code in pathname
    const parts = pathname.split('/');
    // Check if the current pathname has a valid country slug
    const hasCountryPrefix = Object.keys(SUPPORTED_COUNTRIES).includes(parts[1]);
    
    let newPath = `/${newCountry}`;
    if (hasCountryPrefix) {
      if (parts.length > 2) {
        newPath += '/' + parts.slice(2).join('/');
      }
    } else {
      // If for some reason it doesn't have a prefix (e.g. root), just append
      // But typically middleware handles this. We will just redirect to the new route.
      newPath += pathname === '/' ? '' : pathname;
    }

    // Retain query params if any
    const search = window.location.search;
    router.push(newPath + search);
    router.refresh();
  };

  const currentCountryConfig = SUPPORTED_COUNTRIES[country as keyof typeof SUPPORTED_COUNTRIES];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentCountryConfig.flag}</span>
        <span className="text-xs font-bold text-gray-700 uppercase">{currentCountryConfig.currency}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1">
            {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  country === code 
                    ? 'bg-[#3B5D3B]/10 text-[#3B5D3B] font-bold' 
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{config.flag}</span>
                  <span>{config.name}</span>
                </div>
                <span className={`text-[10px] tracking-widest uppercase ${country === code ? 'text-[#3B5D3B]' : 'text-gray-400'}`}>
                  {config.currency}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

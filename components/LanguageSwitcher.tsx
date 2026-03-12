'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

const FLAGS: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  ko: '🇰🇷',
  ru: '🇷🇺',
};

export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (newLocale: string) => {
    setOpen(false);
    router.replace(pathname, { locale: newLocale as any });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
        aria-label={t('language')}
      >
        <Globe className="h-[18px] w-[18px]" />
        <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">{locale}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-[300] animate-in fade-in slide-in-from-top-2 duration-200">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleChange(loc)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                loc === locale
                  ? 'bg-[#3B5D3B]/8 text-[#3B5D3B] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{FLAGS[loc]}</span>
              <span className="flex-1 text-left">{t(loc)}</span>
              {loc === locale && <Check className="h-4 w-4 text-[#3B5D3B]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

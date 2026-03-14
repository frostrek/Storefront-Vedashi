'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, X, ArrowRight } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  COUNTRY_DISPLAY_NAMES,
  LANG_COOKIES,
  getCookie,
  setUserLanguage,
  getSuggestedLanguage,
  getUserLanguage,
  type SupportedLanguage,
} from '@/lib/language';

export default function LanguageSuggestionBanner() {
  const [visible, setVisible] = useState(false);
  const [suggestedLang, setSuggestedLang] = useState<SupportedLanguage | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Current locale is always 'en' in this project (no i18n routing)
  const currentLang: SupportedLanguage = 'en';

  useEffect(() => {
    // If user already has a permanent preference → never show
    const userLang = getUserLanguage();
    if (userLang) {
      setVisible(false);
      return;
    }

    // Check if middleware set a language suggestion
    const suggested = getSuggestedLanguage();
    if (!suggested) {
      setVisible(false);
      return;
    }

    // Don't show if the suggestion matches the current language
    if (suggested === currentLang) {
      setVisible(false);
      return;
    }

    // Get the detected country for display text
    const country = getCookie('geo_country') || '';
    setDetectedCountry(country);
    setSuggestedLang(suggested);
    setVisible(true);
  }, [pathname]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleSwitch = () => {
    if (!suggestedLang) return;

    // Set permanent preference
    setUserLanguage(suggestedLang);

    // For now, since there's no i18n routing, we use Google Translate
    // or simply acknowledge the preference. If you later add locale routing,
    // you'd redirect here: router.push(`/${suggestedLang}/...`)
    handleDismiss();

    // Optional: trigger Google Translate if the widget is present
    try {
      const translateFrame = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (translateFrame) {
        translateFrame.value = suggestedLang;
        translateFrame.dispatchEvent(new Event('change'));
      }
    } catch {
      // Silently ignore if Google Translate widget isn't available
    }
  };

  const handleStay = () => {
    // Set permanent preference to current language → banner never shows again
    setUserLanguage(currentLang);
    handleDismiss();
  };

  if (!visible || !suggestedLang) return null;

  const langConfig = SUPPORTED_LANGUAGES[suggestedLang];
  const countryName = COUNTRY_DISPLAY_NAMES[detectedCountry] || 'your region';

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 z-[99999]
        sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md
        transition-all duration-300 ease-out
        ${isAnimatingOut
          ? 'opacity-0 translate-y-4'
          : 'opacity-100 translate-y-0'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className="
          relative overflow-hidden
          bg-white/95 backdrop-blur-xl
          border border-gray-200/60
          rounded-2xl shadow-2xl shadow-black/10
          p-5
        "
      >
        {/* Subtle accent gradient bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B5D3B] via-[#5a8a5a] to-[#3B5D3B]" />

        {/* Close button */}
        <button
          onClick={handleStay}
          className="
            absolute top-3 right-3
            p-1.5 rounded-full
            text-gray-400 hover:text-gray-600
            hover:bg-gray-100 transition-colors
          "
          aria-label="Dismiss language suggestion"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-xl bg-[#3B5D3B]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#3B5D3B]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              We detected you&apos;re in {countryName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Would you like to switch to {langConfig.nativeName} ({langConfig.name})?
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 mt-3.5">
              <button
                onClick={handleSwitch}
                className="
                  inline-flex items-center gap-1.5
                  px-4 py-2 rounded-xl
                  bg-[#3B5D3B] hover:bg-[#2d472d]
                  text-white text-xs font-bold
                  transition-all duration-200
                  hover:shadow-lg hover:shadow-[#3B5D3B]/20
                  active:scale-[0.97]
                "
              >
                <span>{langConfig.flag}</span>
                <span>Switch to {langConfig.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleStay}
                className="
                  px-4 py-2 rounded-xl
                  text-xs font-semibold text-gray-600
                  hover:bg-gray-100 hover:text-gray-800
                  transition-colors duration-200
                  active:scale-[0.97]
                "
              >
                Stay in English
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

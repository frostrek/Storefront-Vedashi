'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Globe, Check } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'ru', label: 'Русский (Russian)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'zh-CN', label: '中文 (Chinese)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano (Italian)' },
];

/**
 * Hides Google Translate's toolbar/banner using CSS only (no DOM removal).
 * Removing elements from the DOM breaks translation, so we only visually hide them.
 */
function hideGoogleToolbar() {
  // Hide the banner iframe
  document.querySelectorAll('.goog-te-banner-frame, .goog-te-banner-frame.skiptranslate, iframe.goog-te-banner-frame').forEach(el => {
    const iframe = el as HTMLElement;
    iframe.style.setProperty('display', 'none', 'important');
    iframe.style.setProperty('visibility', 'hidden', 'important');
    iframe.style.setProperty('height', '0', 'important');
  });

  // Hide the top notification bar ("Translated into: Russian | Show original")
  document.querySelectorAll('.skiptranslate').forEach(el => {
    const elem = el as HTMLElement;
    // Don't hide our own hidden container
    if (elem.id === 'gtranslate-hidden') return;
    // Only hide top-level skiptranslate divs (not nested ones that might break things)
    if (elem.tagName === 'DIV' && elem.classList.contains('skiptranslate')) {
      elem.style.setProperty('display', 'none', 'important');
      elem.style.setProperty('height', '0', 'important');
      elem.style.setProperty('visibility', 'hidden', 'important');
      elem.style.setProperty('opacity', '0', 'important');
      elem.style.setProperty('overflow', 'hidden', 'important');
    }
  });

  // Hide Google's notification container by known class names
  document.querySelectorAll(
    '.VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf-ti6hGc, #goog-gt-tt, .goog-te-menu-value'
  ).forEach(el => {
    (el as HTMLElement).style.setProperty('display', 'none', 'important');
  });

  // Reset the body layout shift that Google pushes
  document.body.style.setProperty('top', '0px', 'important');
  document.body.style.setProperty('margin-top', '0px', 'important');
  document.body.style.setProperty('padding-top', '0px', 'important');
  document.body.style.setProperty('position', '', '');
}

export default function GoogleTranslateWidget() {
  const initialized = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [ready, setReady] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: LANGUAGES.map(l => l.code).join(','),
          autoDisplay: false,
        },
        'gtranslate-hidden'
      );
      // Poll for the <select> to appear
      const poll = setInterval(() => {
        const sel = document.querySelector('#gtranslate-hidden select.goog-te-combo') as HTMLSelectElement;
        if (sel) {
          clearInterval(poll);
          setReady(true);
        }
      }, 200);
    };

    if (!document.getElementById('gtranslate-script')) {
      const script = document.createElement('script');
      script.id = 'gtranslate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }

    // Periodically hide Google's toolbar (CSS only — never remove from DOM)
    const interval = setInterval(hideGoogleToolbar, 300);
    // Also react to DOM mutations
    const observer = new MutationObserver(hideGoogleToolbar);
    observer.observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['style', 'class'] });

    // Inject styles dynamically to prevent Next.js hydration mismatch
    const styleId = 'gtranslate-widget-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        .skiptranslate:not(#gtranslate-hidden),
        div.skiptranslate,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf-ti6hGc {
          display: none !important;
          height: 0 !important;
          max-height: 0 !important;
          visibility: hidden !important;
          box-shadow: none !important;
          overflow: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          position: fixed !important;
          top: -9999px !important;
          left: -9999px !important;
        }
        body {
          top: 0px !important;
          margin-top: 0px !important;
          padding-top: 0px !important;
        }
        #goog-gt-tt,
        .goog-te-menu-value,
        .goog-te-spinner-pos,
        .goog-tooltip,
        .goog-tooltip:hover,
        #google_translate_element2,
        .goog-te-ftab-link {
          display: none !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectLanguage = useCallback((langCode: string) => {
    setActiveLang(langCode);
    setOpen(false);

    const select = document.querySelector('#gtranslate-hidden select.goog-te-combo') as HTMLSelectElement;
    if (!select) return;

    select.value = langCode;
    // Fire a native change event to trigger Google Translate
    const evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', true, true);
    select.dispatchEvent(evt);

    // Hide the toolbar that appears after translation (with retries)
    for (const delay of [500, 1000, 1500, 2500]) {
      setTimeout(hideGoogleToolbar, delay);
    }
  }, []);

  const activeLabel = LANGUAGES.find(l => l.code === activeLang)?.label || 'English';

  return (
    <>
      {/* Google Translate's actual element — visually hidden but in the DOM */}
      <div
        id="gtranslate-hidden"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
        }}
        suppressHydrationWarning
      />

      <div ref={wrapperRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }} suppressHydrationWarning>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={`Translate — ${activeLabel}`}
          title={`Translate — ${activeLabel}`}
          type="button"
        >
          <Globe
            style={{
              width: '20px',
              height: '20px',
              color: open ? '#3B5D3B' : '#555',
              transition: 'color 0.2s',
            }}
          />
          {activeLang !== 'en' && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                background: '#3B5D3B',
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: '-8px',
              width: '200px',
              background: '#fff',
              border: '1px solid #e8e4dc',
              borderRadius: '14px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
              padding: '10px',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingBottom: '8px',
                marginBottom: '6px',
                borderBottom: '1px solid #f0ece4',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.12em',
                color: '#3B5D3B',
              }}
            >
              <Globe style={{ width: '14px', height: '14px', color: '#3B5D3B' }} />
              <span>Translate</span>
            </div>

            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {LANGUAGES.map(lang => {
                const isActive = activeLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => selectLanguage(lang.code)}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 450,
                      color: isActive ? '#3B5D3B' : '#374151',
                      background: isActive ? '#edf5ed' : 'transparent',
                      border: 'none',
                      cursor: ready ? 'pointer' : 'wait',
                      width: '100%',
                      textAlign: 'left' as const,
                      transition: 'background 0.15s',
                      opacity: ready ? 1 : 0.5,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget.style.background = '#f5f2e8');
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget.style.background = isActive ? '#edf5ed' : 'transparent');
                    }}
                    disabled={!ready}
                  >
                    <span>{lang.label}</span>
                    {isActive && <Check style={{ width: '14px', height: '14px', color: '#3B5D3B' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}


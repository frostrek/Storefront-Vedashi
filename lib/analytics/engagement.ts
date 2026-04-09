'use client';

import { useEffect, useRef } from 'react';
import { trackEvent, isConsentGranted } from './gtag';

// Constants
const MAX_TIME_SECONDS = 300; // 5 minutes cap
const SCROLL_THRESHOLDS = [25, 50, 75, 100];

export function useScrollDepthTracker(pageType: string) {
  const firedThresholds = useRef<Set<number>>(new Set());
  const ticking = useRef(false);

  useEffect(() => {
    firedThresholds.current.clear(); // Reset on new pageType/mount

    const handleScroll = () => {
      if (!isConsentGranted()) return;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
          // Avoid division by zero on very short pages
          if (scrollableHeight <= 0) return;

          const scrollPercentage = Math.round((window.scrollY / scrollableHeight) * 100);

          SCROLL_THRESHOLDS.forEach((threshold) => {
            if (scrollPercentage >= threshold && !firedThresholds.current.has(threshold)) {
              firedThresholds.current.add(threshold);
              
              // Ensure we use the exact threshold value (e.g. 25, 50 for the event payload)
              trackEvent('scroll_depth', {
                scroll_percentage: threshold,
                page_type: pageType,
              });
            }
          });

          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageType]);
  
  return firedThresholds.current; // Expose for engagement score
}

export function useTimeOnPageTracker(pageType: string) {
  const startTime = useRef<number>(Date.now());
  const hasFired = useRef<boolean>(false);

  useEffect(() => {
    startTime.current = Date.now();
    hasFired.current = false;

    const fireTimeOnPage = () => {
      if (hasFired.current || !isConsentGranted()) return;
      
      const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
      if (durationSeconds > 0) {
        trackEvent('time_on_page', {
          duration_seconds: durationSeconds,
          page_type: pageType,
        });
      }
      hasFired.current = true;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        fireTimeOnPage();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', fireTimeOnPage);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', fireTimeOnPage);
      fireTimeOnPage(); // Fire on route change / unmount
    };
  }, [pageType]);
  
  return startTime;
}

export function useEngagementScore(pageType: string) {
  const scrollTracker = useScrollDepthTracker(pageType);
  const timeTracker = useTimeOnPageTracker(pageType);
  const interactionCount = useRef<number>(0);
  const hasFiredScore = useRef<boolean>(false);

  useEffect(() => {
    interactionCount.current = 0;
    hasFiredScore.current = false;

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      // Basic interaction tracking (clicks/touches on interactive elements)
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button') || target.tagName === 'INPUT' || target.tagName === 'SELECT')) {
         interactionCount.current++;
      }
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      
      if (!hasFiredScore.current && isConsentGranted()) {
        const timeSpent = Math.min(Math.round((Date.now() - timeTracker.current) / 1000), MAX_TIME_SECONDS);
        const maxScroll = Math.max(0, ...Array.from(scrollTracker));

        // Formula: (scroll% / 100) × 40 + (time / max_time) × 40 + interactions × 20
        // Cap the interaction term at 20 (assuming let's say 1 interaction = 2 points, max 10 interactions)
        const scrollComponent = (maxScroll / 100) * 40;
        const timeComponent = (timeSpent / MAX_TIME_SECONDS) * 40;
        const interactionComponent = Math.min(interactionCount.current * 2, 20);

        const score = Math.round(scrollComponent + timeComponent + interactionComponent);

        if (score > 0) {
            trackEvent('engagement_score', {
              score,
              page_type: pageType,
            });
        }
        hasFiredScore.current = true;
      }
    };
  }, [pageType, scrollTracker, timeTracker]);
}

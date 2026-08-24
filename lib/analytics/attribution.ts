/**
 * Vedashi Session Attribution & Identity Sync
 * ─────────────────────────────────────────────
 * Captures UTM parameters on landing, persists them for the session,
 * and provides helpers for frontend↔backend identity correlation.
 *
 * Rules:
 * - Attribution is captured ONCE per session (never overwritten mid-session)
 * - The `session_start` dataLayer push only fires AFTER consent is granted
 * - `ga_client_id` is extracted from the `_ga` cookie for Measurement Protocol sync
 */

// ─── Constants ──────────────────────────────────────────────

const ATTRIBUTION_KEY = 'vedashi_attribution';
const ATTRIBUTION_PUSHED_KEY = 'vedashi_attribution_pushed';

// ─── Types ──────────────────────────────────────────────────

export interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

// ─── UTM Capture ────────────────────────────────────────────

/**
 * Extract UTM parameters from the current URL and store them in sessionStorage.
 * Called early in the page lifecycle (RouteTracker) — BEFORE consent check.
 * Only captures to storage; does NOT push to dataLayer.
 *
 * Will NOT overwrite attribution that already exists in the current session.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  // Do NOT overwrite existing attribution mid-session
  if (sessionStorage.getItem(ATTRIBUTION_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  const term = params.get('utm_term');
  const content = params.get('utm_content');

  // Only store if at least one UTM param is present
  if (source || medium || campaign) {
    const attribution: TrafficSource = {
      source: source || '(direct)',
      medium: medium || '(none)',
      campaign: campaign || '(not set)',
      term: term || '',
      content: content || '',
    };

    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  }
}

/**
 * Retrieve the stored attribution data for the current session.
 * Returns `null` if no UTM parameters were captured.
 */
export function getAttribution(): TrafficSource | null {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as TrafficSource;
  } catch {
    return null;
  }
}

// ─── DataLayer Push (Consent-Gated) ────────────────────────

/**
 * Push the `session_start` event with `traffic_source` to the dataLayer.
 * Fires ONLY once per session and ONLY after analytics consent is granted.
 *
 * Should be called from DynamicScriptLoader when consent is granted.
 */
export function pushAttributionEvent(): void {
  if (typeof window === 'undefined') return;

  // Only fire once per session
  if (sessionStorage.getItem(ATTRIBUTION_PUSHED_KEY)) return;

  const attribution = getAttribution();
  if (!attribution) return;

   
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'session_start',
    traffic_source: {
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      term: attribution.term,
      content: attribution.content,
    },
  });

  sessionStorage.setItem(ATTRIBUTION_PUSHED_KEY, 'true');
}

// ─── GA Client ID Extraction ───────────────────────────────

/**
 * Extract the GA4 client_id from the `_ga` cookie.
 * The `_ga` cookie format is: `GA1.1.XXXXXXXXXX.YYYYYYYYYY`
 * The client_id is the portion after the second dot: `XXXXXXXXXX.YYYYYYYYYY`
 *
 * Returns `null` if the cookie doesn't exist or can't be parsed.
 */
export function getGAClientId(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
  if (!match) return null;

  const gaCookie = decodeURIComponent(match[1]);
  // Format: GA1.X.XXXXXXX.YYYYYYY — client_id is everything after the second dot
  const parts = gaCookie.split('.');
  if (parts.length >= 4) {
    return parts.slice(2).join('.');
  }

  return null;
}

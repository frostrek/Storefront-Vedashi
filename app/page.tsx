/**
 * Root Page
 * 
 * With the rewrite-based architecture, the proxy handles root '/' requests
 * by internally rewriting to '/us' (worldwide). This page is a safety net
 * for cases where the proxy doesn't intercept (e.g. during build).
 */
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The proxy rewrites '/' to '/us' internally, so this rarely executes.
  // Fallback redirect for safety.
  redirect('/us');
}

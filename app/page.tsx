import { redirect } from 'next/navigation';

/**
 * Root Page Utilities
 * 
 * This file handles the root '/' request by redirecting to the default region.
 * While the middleware handles most traffic, having a physical page.tsx 
 * provides a secondary safety mechanism for crawlers and helps resolve 
 * "Redirect Error" issues in Google Search Console.
 */
export default function RootPage() {
  // We redirect to '/in' as the default primary region.
  // The middleware will still override this based on GeoIP if active.
  redirect('/in');
}

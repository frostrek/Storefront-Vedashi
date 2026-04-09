/**
 * Storefront Environment Variable Validation
 *
 * Validates required env vars at build & runtime.
 * If any required var is missing, the build/dev server will fail with a clear error.
 */

function requireEnv(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `\n❌ Missing required environment variable: ${name}\n` +
      `   Check your .env.local file in Storefront-Vedashi.\n` +
      `   See .env.example for reference.\n`
    );
  }
  return value.trim();
}

function optionalEnv(value: string | undefined, defaultValue: string = ''): string {
  return value?.trim() || defaultValue;
}

// ─── Validate & Export ──────────────────────────────────────────────
export const env = {
  // Required — build will fail without these
  NEXT_PUBLIC_API_URL: requireEnv(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requireEnv(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: requireEnv(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'),

  // Server-only — optional (degrade gracefully if missing)
  CLERK_SECRET_KEY: optionalEnv(process.env.CLERK_SECRET_KEY),
  TURNSTILE_SECRET_KEY: optionalEnv(process.env.TURNSTILE_SECRET_KEY),
  IPINFO_TOKEN: optionalEnv(process.env.IPINFO_TOKEN),
};

// Log validation success (only on server)
if (typeof window === 'undefined') {
  console.log('✅ Storefront env validated');
}

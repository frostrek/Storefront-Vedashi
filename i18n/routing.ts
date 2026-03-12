import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi', 'ko', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

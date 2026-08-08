import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.twcstorage.ru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.twcstorage.ru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vedashi-herbals-storage.s3.twcstorage.ru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ecommerce-backend-h23p.onrender.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd15o8yv09tizyc.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vedashi-prod-assets.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/sitemap-in.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/sitemap-ru.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/sitemap-kr.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.vedashiherbals.com',
          },
        ],
        destination: 'https://vedashiherbals.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'vedashi.com',
          },
        ],
        destination: 'https://vedashiherbals.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.vedashi.com',
          },
        ],
        destination: 'https://vedashiherbals.com/:path*',
        permanent: true,
      },
      { source: '/products', destination: '/katalog', permanent: true },
      { source: '/cart', destination: '/korzina', permanent: true },
      { source: '/checkout', destination: '/oformlenie-zakaza', permanent: true },
      { source: '/account/overview', destination: '/lichnyy-kabinet/obzor', permanent: true },
      { source: '/account/orders', destination: '/lichnyy-kabinet/zakazy', permanent: true },
      { source: '/account/profile', destination: '/lichnyy-kabinet/profil', permanent: true },
      { source: '/account/wishlist', destination: '/lichnyy-kabinet/izbrannoe', permanent: true },
      { source: '/account/wallet', destination: '/lichnyy-kabinet/koshelyok', permanent: true },
      { source: '/account/addresses', destination: '/lichnyy-kabinet/adresa', permanent: true },
      { source: '/account/notifications', destination: '/lichnyy-kabinet/uvedomleniya', permanent: true },
      { source: '/account/settings', destination: '/lichnyy-kabinet/nastroyki', permanent: true },
      { source: '/account/privacy', destination: '/lichnyy-kabinet/konfidentsialnost', permanent: true },
      { source: '/account/support', destination: '/lichnyy-kabinet/podderzhka', permanent: true },
      { source: '/account', destination: '/lichnyy-kabinet', permanent: true },
      { source: '/login', destination: '/vhod', permanent: true },
      { source: '/search', destination: '/poisk', permanent: true },
      { source: '/about', destination: '/o-nas', permanent: true },
      { source: '/contact', destination: '/kontakty', permanent: true },
      { source: '/help-center/faq', destination: '/pomoshch/chavo', permanent: true },
      { source: '/help-center/knowledge-base', destination: '/pomoshch/baza-znaniy', permanent: true },
      { source: '/help-center/support', destination: '/pomoshch/podderzhka', permanent: true },
      { source: '/help-center/customer-enquiry', destination: '/pomoshch/zapros-klienta', permanent: true },
      { source: '/help-center', destination: '/pomoshch', permanent: true },

    ];
  },
  async rewrites() {
    return [
      { source: '/katalog', destination: '/products' },
      { source: '/katalog/:slug*', destination: '/products/:slug*' },
      { source: '/tovar/:slug', destination: '/product/:slug' },
      { source: '/korzina', destination: '/cart' },
      { source: '/oformlenie-zakaza', destination: '/checkout' },
      { source: '/lichnyy-kabinet', destination: '/account' },
      { source: '/lichnyy-kabinet/obzor', destination: '/account/overview' },
      { source: '/lichnyy-kabinet/zakazy', destination: '/account/orders' },
      { source: '/lichnyy-kabinet/profil', destination: '/account/profile' },
      { source: '/lichnyy-kabinet/izbrannoe', destination: '/account/wishlist' },
      { source: '/lichnyy-kabinet/koshelyok', destination: '/account/wallet' },
      { source: '/lichnyy-kabinet/adresa', destination: '/account/addresses' },
      { source: '/lichnyy-kabinet/uvedomleniya', destination: '/account/notifications' },
      { source: '/lichnyy-kabinet/nastroyki', destination: '/account/settings' },
      { source: '/lichnyy-kabinet/konfidentsialnost', destination: '/account/privacy' },
      { source: '/lichnyy-kabinet/podderzhka', destination: '/account/support' },
      { source: '/vhod', destination: '/login' },
      { source: '/vhod/:path*', destination: '/login/:path*' },
      { source: '/poisk', destination: '/search' },
      { source: '/o-nas', destination: '/about' },
      { source: '/kontakty', destination: '/contact' },
      { source: '/pomoshch', destination: '/help-center' },
      { source: '/pomoshch/chavo', destination: '/help-center/faq' },
      { source: '/pomoshch/baza-znaniy', destination: '/help-center/knowledge-base' },
      { source: '/pomoshch/baza-znaniy/:slug*', destination: '/help-center/knowledge-base/:slug*' },
      { source: '/pomoshch/podderzhka', destination: '/help-center/support' },
      { source: '/pomoshch/podderzhka/:id*', destination: '/help-center/support/:id*' },
      { source: '/pomoshch/zapros-klienta', destination: '/help-center/customer-enquiry' },

      { source: '/zabyly-parol', destination: '/forgot-password' },
      { source: '/sbros-parolya', destination: '/reset-password' },
      { source: '/podtverzhdenie-email', destination: '/verify-email' },

      { source: '/registratsiya-postavshchika', destination: '/vendor-registration' },
    ];
  },
  async headers() {
    return [
      {
        source: '/small%20banners/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/brand-logos/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/vedashi-logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/vedashi-logo-white.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      }
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce memory usage in dev by disabling source maps for node_modules
      config.devtool = 'eval-cheap-module-source-map';
    }
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
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
            value: 'www.vedashi.com',
          },
        ],
        destination: 'https://vedashi.com/:path*',
        permanent: true,
      },
      {
        source: '/:country/categories/:slug',
        destination: '/:country/products?category=:slug',
        permanent: true,
      },
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

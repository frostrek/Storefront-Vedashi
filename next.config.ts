import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      {
        protocol: 'https',
        hostname: 'd15o8yv09tizyc.cloudfront.net',
        port: '',
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
    ];
  },
};

export default nextConfig;

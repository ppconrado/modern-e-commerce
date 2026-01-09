import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Removed 'standalone' for Vercel deployment - causes issues with serverless functions
  // output: 'standalone', // Only use for Docker
  serverExternalPackages: ['pg', '@prisma/client'],
  experimental: {
    serverComponentsExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg'],
  },
};

export default nextConfig;

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
  // Use 'standalone' ONLY for Docker builds, NOT for Vercel
  // Uncomment the line below when building Docker image
  // output: 'standalone',
  
  // External packages for serverless functions (Vercel/Edge runtime)
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg'],
};

export default nextConfig;

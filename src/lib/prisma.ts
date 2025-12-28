import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize PrismaClient with the database URL from environment
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: {
      url: process.env.DATABASE_URL!,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

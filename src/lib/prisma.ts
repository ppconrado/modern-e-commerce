import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create pool if not exists
if (!globalForPrisma.pool) {
  // Determine SSL configuration based on environment
  const isDevelopment = process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL?.includes('neon');
  
  globalForPrisma.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(isDevelopment ? {} : {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

const pool = globalForPrisma.pool;
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Sempre salvar em globalForPrisma para reutilizar em produção
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

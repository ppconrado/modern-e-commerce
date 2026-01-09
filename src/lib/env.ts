/**
 * Environment validation at startup
 * Ensures all required env vars are set
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY must start with pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
});

let validated = false;

export function validateEnv() {
  if (validated) return;

  try {
    envSchema.parse(process.env);
    logger.info('Environment variables validated');
    validated = true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      logger.fatal('Environment validation failed', new Error(`Missing or invalid env vars:\n${missing}`));
      throw new Error(`Environment validation failed:\n${missing}`);
    }
    throw error;
  }
}

// Validate on module load
validateEnv();

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Health check and monitoring endpoint
 * Shows system status, DB connection, dependencies, and metrics
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
    error?: string;
  };
  cache?: {
    enabled: boolean;
  };
  stripe?: {
    configured: boolean;
  };
  metrics?: {
    activeRequests: number;
    avgResponseTime: number;
  };
}

// Simple metrics
let requestCount = 0;
let totalResponseTime = 0;
const startTime = Date.now();

function recordRequest(responseTime: number) {
  requestCount++;
  totalResponseTime += responseTime;
}

export async function GET(req: NextRequest) {
  const startCheck = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    database: { connected: false },
  };

  try {
    // Check database
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.database.connected = true;
    health.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    health.status = 'critical';
    health.database.error = error instanceof Error ? error.message : String(error);
    logger.error('Health check: Database unavailable', error instanceof Error ? error : new Error(String(error)));
  }

  // Check Stripe config
  health.stripe = {
    configured: !!process.env.STRIPE_SECRET_KEY,
  };

  // Add metrics
  health.metrics = {
    activeRequests: requestCount,
    avgResponseTime: requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0,
  };

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 503;

  logger.info('Health check', { status: health.status, dbTime: health.database.responseTime });

  return NextResponse.json(health, { status: statusCode });
}

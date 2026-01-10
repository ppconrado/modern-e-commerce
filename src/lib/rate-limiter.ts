import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Simple in-memory rate limiter (for development/testing)
 * For production, use Upstash Redis or similar service
 */
class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60 * 1000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach((key) => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 5 * 60 * 1000);
  }

  check(key: string): { success: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.store[key];

    if (!entry || entry.resetTime < now) {
      // Create new entry
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return { success: true, remaining: this.maxRequests - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return { success: false, remaining: 0 };
    }

    // Increment count
    entry.count += 1;
    return { success: true, remaining: this.maxRequests - entry.count };
  }

  reset(key: string) {
    delete this.store[key];
  }
}

// Default rate limiters for different endpoints
const defaultLimiter = new RateLimiter(60 * 1000, 30); // 30 requests per minute
const strictLimiter = new RateLimiter(60 * 1000, 10); // 10 requests per minute
const relaxedLimiter = new RateLimiter(60 * 1000, 100); // 100 requests per minute

/**
 * Rate limit middleware
 * Returns error response if limit exceeded, null if allowed
 */
export function rateLimit(
  req: NextRequest,
  options: {
    limiter?: 'default' | 'strict' | 'relaxed';
  } = { limiter: 'default' }
) {
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const limiter =
    options.limiter === 'strict'
      ? strictLimiter
      : options.limiter === 'relaxed'
      ? relaxedLimiter
      : defaultLimiter;

  const result = limiter.check(ip);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: 60,
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      }
    );
  }

  return null; // Allowed
}

export { RateLimiter };

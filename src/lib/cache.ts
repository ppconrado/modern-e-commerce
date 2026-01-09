/**
 * Simple in-memory cache for cart queries and product listings
 * TTL-based automatic expiration
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  set<T>(key: string, data: T, ttlSeconds: number = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });

    // Clear old timer if exists
    const oldTimer = this.timers.get(key);
    if (oldTimer) clearTimeout(oldTimer);

    // Set new expiration
    const timer = setTimeout(() => this.delete(key), ttlSeconds * 1000);
    this.timers.set(key, timer);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string) {
    this.cache.delete(key);
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
  }

  invalidatePattern(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

export const responseCache = new ResponseCache();

// Cache invalidation helpers
export const cacheKeys = {
  products: 'products:',
  cart: (cartId: string) => `cart:${cartId}`,
  coupon: (code: string) => `coupon:${code.toUpperCase()}`,
  user: (userId: string) => `user:${userId}`,
};

import { prisma } from '@/lib/prisma';

interface StoreSettings {
  id: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  lowStockThreshold: number;
  disableReviews: boolean;
  disableWishlist: boolean;
  disableMaintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory cache with TTL (1 minute)
let settingsCache: StoreSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute in ms

export async function getStoreSettings(): Promise<StoreSettings> {
  const now = Date.now();

  // Return cached settings if valid
  if (settingsCache && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }

  // Fetch from database
  let settings = await prisma.storeSettings.findFirst();

  // Create default if not exists
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        storeName: 'E-Commerce Store',
        storeEmail: 'contact@store.com',
        storePhone: '',
        storeAddress: '',
        currency: 'USD',
        taxRate: 0,
        shippingFee: 10,
        freeShippingThreshold: 100,
        lowStockThreshold: 10,
        disableReviews: false,
        disableWishlist: false,
        disableMaintenanceMode: false,
      },
    });
  }

  // Update cache
  settingsCache = settings as StoreSettings;
  cacheTimestamp = now;

  return settingsCache;
}

/**
 * Check if reviews are enabled
 * @returns true if reviews are ENABLED (disableReviews = false)
 */
export async function areReviewsEnabled(): Promise<boolean> {
  const settings = await getStoreSettings();
  return !settings.disableReviews;
}

/**
 * Check if wishlist is enabled
 * @returns true if wishlist is ENABLED (disableWishlist = false)
 */
export async function isWishlistEnabled(): Promise<boolean> {
  const settings = await getStoreSettings();
  return !settings.disableWishlist;
}

/**
 * Check if maintenance mode is active
 * @returns true if maintenance mode is ACTIVE (disableMaintenanceMode = true)
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  const settings = await getStoreSettings();
  return settings.disableMaintenanceMode;
}

/**
 * Invalidate settings cache
 * Call this after updating settings via API
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

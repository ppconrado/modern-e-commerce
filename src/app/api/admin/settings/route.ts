import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';

// For now, we'll use a simple in-memory store
// In production, you'd want to use a database table for settings
const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeEmail: z.string().email('Invalid email address'),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  currency: z.string().default('USD'),
  taxRate: z.number().min(0).max(100).default(0),
  shippingFee: z.number().min(0).default(0),
  freeShippingThreshold: z.number().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  enableReviews: z.boolean().default(true),
  enableWishlist: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
});

// Default settings
const defaultSettings = {
  storeName: 'E-Commerce Store',
  storeEmail: 'contact@store.com',
  storePhone: '',
  storeAddress: '',
  currency: 'USD',
  taxRate: 0,
  shippingFee: 10,
  freeShippingThreshold: 100,
  lowStockThreshold: 10,
  enableReviews: true,
  enableWishlist: true,
  maintenanceMode: false,
};

// GET /api/admin/settings - Get store settings (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, fetch from database
    // For now, return default settings
    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings - Update store settings (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = settingsSchema.parse(body);

    // In production, save to database
    // For now, just return the validated data
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

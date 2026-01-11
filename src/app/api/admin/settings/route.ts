import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { invalidateSettingsCache } from '@/lib/settings-helpers';
import { z } from 'zod';

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeEmail: z.string().email('Invalid email address'),
  storePhone: z.string().optional().default(''),
  storeAddress: z.string().optional().default(''),
  currency: z.string().default('USD'),
  taxRate: z.number().min(0).max(100).default(0),
  shippingFee: z.number().min(0).default(0),
  freeShippingThreshold: z.number().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  disableReviews: z.boolean().default(false),
  disableWishlist: z.boolean().default(false),
  disableMaintenanceMode: z.boolean().default(false),
});

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
  disableReviews: false,
  disableWishlist: false,
  disableMaintenanceMode: false,
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

    // Fetch from database or create default if not exists
    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: defaultSettings,
      });
    }

    return NextResponse.json({ settings });
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
    console.log('📦 PATCH /api/admin/settings - Body recebido:', JSON.stringify(body, null, 2));
    
    const validatedData = settingsSchema.parse(body);
    console.log('✅ Dados validados:', JSON.stringify(validatedData, null, 2));

    // Find existing settings or create default
    let settings = await prisma.storeSettings.findFirst();
    console.log('🔍 Settings existentes:', settings ? 'Encontrado' : 'Não encontrado');

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: validatedData,
      });
      console.log('✨ Settings criado:', JSON.stringify(settings, null, 2));
    } else {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: validatedData,
      });
      console.log('🔄 Settings atualizado:', JSON.stringify(settings, null, 2));
    }

    // Invalidate cache after update
    invalidateSettingsCache();
    console.log('🗑️ Cache invalidado');

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      console.error('❌ Erro de validação Zod:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

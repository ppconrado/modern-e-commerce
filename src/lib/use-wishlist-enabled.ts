// Simple public API to expose only the disableWishlist flag
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    return NextResponse.json({ disableWishlist: false });
  }
  return NextResponse.json({ disableWishlist: settings.disableWishlist });
}

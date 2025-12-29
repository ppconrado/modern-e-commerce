import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addressSchema = z.object({
  type: z.enum(['HOME', 'SHIPPING', 'BILLING']),
  label: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  // Support Brazilian CEP (XXXXX-XXX), US ZIP (XXXXX or XXXXX-XXXX), and other international formats
  zipCode: z
    .string()
    .min(3)
    .regex(/^[0-9A-Za-z\s-]{3,12}$/, 'Invalid postal code format'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// GET - List all addresses for user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST - Create new address
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = addressSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

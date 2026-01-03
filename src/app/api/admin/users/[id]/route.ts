import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  sendUserDeactivatedEmail,
  sendUserReactivatedEmail,
} from '@/lib/email';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const userUpdateSchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

// PATCH - Update user role or status (SUPER_ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = userUpdateSchema.parse(body);

    // Prevent changing own role or status
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role or status' },
        { status: 400 }
      );
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, fullName: true, isActive: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send email notification if status changed
    if (
      validatedData.isActive !== undefined &&
      validatedData.isActive !== currentUser.isActive
    ) {
      try {
        if (validatedData.isActive) {
          await sendUserReactivatedEmail(user.email, user.fullName);
        } else {
          await sendUserDeactivatedEmail(user.email, user.fullName);
        }
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

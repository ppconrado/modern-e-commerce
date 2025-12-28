import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `cm${timestamp}${random}`;
};

export async function POST(request: Request) {
  try {
    const { token, password, fullName } = await request.json();

    // Validate input
    if (!token || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find invite
    const invite = await prisma.adminInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      );
    }

    // Check if already used
    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'This invite has already been used' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        id: generateId(),
        email: invite.email,
        fullName,
        password: hashedPassword,
        role: invite.role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // Mark invite as used
    await prisma.adminInvite.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validate invite token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invite = await prisma.adminInvite.findUnique({
      where: { token },
      select: {
        email: true,
        role: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'Invite already used' },
        { status: 400 }
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

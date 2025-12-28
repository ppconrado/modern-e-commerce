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
    const { email, password, fullName } = await request.json();

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user - first user becomes SUPER_ADMIN
    const user = await prisma.user.create({
      data: {
        id: generateId(),
        email,
        fullName,
        password: hashedPassword,
        role: isFirstUser ? 'SUPER_ADMIN' : 'CUSTOMER',
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limiter';
import { requireSuperAdminRole } from '@/lib/auth-helpers';

const generateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `cm${timestamp}${random}`;
};

const generateToken = () => {
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
};

// Create admin invite (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (10 requests per minute for strict limiter)
    const rateLimitError = rateLimit(request, { limiter: 'strict' });
    if (rateLimitError) return rateLimitError;

    const session = await auth();

    // Check if user is authenticated and is SUPER_ADMIN
    const authError = requireSuperAdminRole(session);
    if (authError) return authError;

    const { email, role } = await request.json();

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role (can only invite ADMIN or SUPER_ADMIN)
    const validRoles = ['ADMIN', 'SUPER_ADMIN'];
    const inviteRole = role || 'ADMIN';
    if (!validRoles.includes(inviteRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Can only invite ADMIN or SUPER_ADMIN' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.adminInvite.findUnique({
      where: { email },
    });

    if (
      existingInvite &&
      !existingInvite.usedAt &&
      new Date(existingInvite.expiresAt) > new Date()
    ) {
      return NextResponse.json(
        { error: 'An active invite already exists for this email' },
        { status: 400 }
      );
    }

    // Delete old invite if exists
    if (existingInvite) {
      await prisma.adminInvite.delete({
        where: { email },
      });
    }

    // Create new invite (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.adminInvite.create({
      data: {
        id: generateId(),
        email,
        token: generateToken(),
        role: inviteRole,
        invitedBy: session!.user.id, // session is guaranteed non-null after requireSuperAdminRole check
        expiresAt,
      },
    });

    // In production, you would send an email here with the invite link
    const inviteLink = `${process.env.NEXTAUTH_URL}/admin/accept-invite?token=${invite.token}`;

    return NextResponse.json(
      {
        message: 'Invite created successfully',
        inviteLink, // In production, this would be sent via email
        expiresAt: invite.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invite creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all invites (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    const authError = requireSuperAdminRole(session);
    if (authError) return authError;

    const invites = await prisma.adminInvite.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

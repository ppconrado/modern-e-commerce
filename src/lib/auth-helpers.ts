import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * Check if user is authenticated and has admin or super admin role
 * Returns error response if not authorized, null if authorized
 */
export function requireAdminRole(session: Session | null) {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (
    session.user.role !== 'ADMIN' &&
    session.user.role !== 'SUPER_ADMIN'
  ) {
    return NextResponse.json(
      { error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }

  return null; // Authorized
}

/**
 * Check if user is authenticated and has super admin role
 * Returns error response if not authorized, null if authorized
 */
export function requireSuperAdminRole(session: Session | null) {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden. Super admin access required.' },
      { status: 403 }
    );
  }

  return null; // Authorized
}

/**
 * Check if user is authenticated
 * Returns error response if not authenticated, null if authenticated
 */
export function requireAuth(session: Session | null) {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // Authenticated
}

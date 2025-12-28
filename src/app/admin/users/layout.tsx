import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Only SUPER_ADMIN can access /admin/users
  if (session.user?.role !== 'SUPER_ADMIN') {
    redirect('/admin');
  }

  return <>{children}</>;
}

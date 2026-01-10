'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  Loader2,
  Ticket,
} from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (
      status === 'authenticated' &&
      session?.user?.role !== 'ADMIN' &&
      session?.user?.role !== 'SUPER_ADMIN'
    ) {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your e-commerce store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            href: '/admin/products',
            label: 'Product Management',
            icon: <Package className="h-6 w-6 text-blue-600" />,
            description: 'Add, edit, and manage your product catalog',
            testId: 'admin-products-link',
          },
          {
            href: '/admin/orders',
            label: 'Orders',
            icon: <ShoppingCart className="h-6 w-6 text-green-600" />,
            description: 'View and manage customer orders',
            testId: 'admin-orders-link',
          },
          {
            href: '/admin/analytics',
            label: 'Analytics',
            icon: <BarChart3 className="h-6 w-6 text-orange-600" />,
            description: 'View sales and performance metrics',
            testId: 'admin-analytics-link',
          },
          {
            href: '/admin/coupons',
            label: 'Coupons',
            icon: <Ticket className="h-6 w-6 text-pink-600" />,
            description: 'Create and manage promotional coupons',
            testId: 'admin-coupons-link',
          },
          {
            href: '/admin/settings',
            label: 'Settings',
            icon: <Settings className="h-6 w-6 text-gray-600" />,
            description: 'Configure store settings and preferences',
            testId: 'admin-settings-link',
          },
          // Users always last; only for SUPER_ADMIN
          ...(session?.user?.role === 'SUPER_ADMIN'
            ? [
                {
                  href: '/admin/users',
                  label: 'Users',
                  icon: <Users className="h-6 w-6 text-purple-600" />,
                  description: 'Manage user accounts and roles',
                  testId: 'admin-users-link',
                },
              ]
            : []),
        ].map((item) => (
          <Link key={item.href} href={item.href} data-testid={item.testId} aria-label={item.label} title={`${item.label} (${item.href})`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">← Back to Store</Button>
        </Link>
      </div>
    </div>
  );
}

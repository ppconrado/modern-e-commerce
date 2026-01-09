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
        <Link href="/admin/products" data-testid="admin-products-link">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                Product Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add, edit, and manage your product catalog
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" data-testid="admin-orders-link">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-green-600" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage customer orders</p>
            </CardContent>
          </Card>
        </Link>

        {session?.user?.role === 'SUPER_ADMIN' && (
        <Link href="/admin/users" data-testid="admin-users-link">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-purple-600" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Manage user accounts and roles</p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/admin/analytics" data-testid="admin-analytics-link">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View sales and performance metrics
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/coupons" data-testid="admin-coupons-link">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Ticket className="h-6 w-6 text-pink-600" />
                Coupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create and manage promotional coupons
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings" data-testid="admin-settings-link">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-gray-600" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure store settings and preferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">← Back to Store</Button>
        </Link>
      </div>
    </div>
  );
}

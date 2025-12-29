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
        <Link href="/admin/products">
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

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">View and manage customer orders</p>
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Manage user accounts and roles</p>
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">View sales and performance metrics</p>
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
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
            <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">← Back to Store</Button>
        </Link>
      </div>
    </div>
  );
}

'use client';

import { ShoppingCart, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { Button } from './ui/button';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { data: session } = useSession();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          ShopHub
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:underline">
            Products
          </Link>

          {(session?.user?.role === 'ADMIN' ||
            session?.user?.role === 'SUPER_ADMIN') && (
            <Link href="/admin" className="text-sm font-medium hover:underline">
              Admin
            </Link>
          )}

          {session?.user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/admin/users"
              className="text-sm font-medium hover:underline"
            >
              Users
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="text-sm font-medium hover:underline"
              >
                My Account
              </Link>
              <span className="text-sm text-gray-600">
                <User className="inline h-4 w-4 mr-1" />
                {session.user?.name}
                {session.user?.role === 'SUPER_ADMIN' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                    SUPER ADMIN
                  </span>
                )}
                {session.user?.role === 'ADMIN' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    ADMIN
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          <Link href="/cart" className="relative">
            <Button variant="outline" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

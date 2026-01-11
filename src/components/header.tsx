'use client';

import { ShoppingCart, LogOut, User, Heart, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { Button } from './ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getTotalItems, clearCart } = useCart();
  const totalItems = getTotalItems();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    // Limpar carrinho local
    clearCart();
    // Limpar localStorage
    localStorage.removeItem('anonCartId');
    // Fazer logout
    await signOut({ callbackUrl: '/' });
  };

  // Consulta pública para saber se wishlist está desabilitada
  const { data: publicSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await fetch('/api/public-settings');
      if (!res.ok) return { enableWishlist: true };
      const data = await res.json();
      return {
        ...data,
        enableWishlist: data.disableWishlist === undefined ? true : !data.disableWishlist,
      };
    },
    staleTime: 60000,
  });

  // Fetch wishlist count (só se wishlist está habilitada)
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/wishlist');
      if (!res.ok) return { items: [] };
      return res.json();
    },
    enabled: !!session && publicSettings?.enableWishlist,
  });

  const wishlistCount = wishlistData?.items?.length || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b sticky top-0 bg-white z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-bold">
          ShopHub
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
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
                onClick={handleSignOut}
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
          {session && publicSettings?.enableWishlist && (
            <Link href="/wishlist" className="relative">
              <Button variant="outline" size="icon">
                <Heart className="h-5 w-5" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <Link href="/cart" className="relative">
            <Button variant="outline" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </nav>

        {/* Mobile Icons + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Wishlist - Mobile */}
          {session && publicSettings?.enableWishlist && (
            <Link href="/wishlist" className="relative">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* Cart - Mobile */}
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              href="/"
              className="text-sm font-medium hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>

            {(session?.user?.role === 'ADMIN' ||
              session?.user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/admin"
                className="text-sm font-medium hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}

            {session?.user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin/users"
                className="text-sm font-medium hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
            )}

            {session ? (
              <>
                <Link
                  href="/account"
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                <div className="text-sm text-gray-600 py-2 border-t">
                  <User className="inline h-4 w-4 mr-2" />
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
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

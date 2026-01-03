'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    averageRating: number;
  };
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/wishlist');
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      return res.json() as Promise<{ items: WishlistItem[] }>;
    },
    enabled: status === 'authenticated',
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove from wishlist');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: 'Removed',
        description: 'Product removed from wishlist',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove from wishlist',
        variant: 'destructive',
      });
    },
  });

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          My Wishlist
        </h1>
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Save items you love for later
            </p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Link href={`/products/${item.productId}`}>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <button
                  onClick={() => removeMutation.mutate(item.productId)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
              <CardContent className="p-4">
                <Link href={`/products/${item.productId}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-2xl font-bold text-green-600 mb-3">
                  ${item.product.price.toFixed(2)}
                </p>
                
                {item.product.stock > 0 ? (
                  <Link href={`/products/${item.productId}`}>
                    <Button className="w-full" size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" size="sm" disabled>
                    Out of Stock
                  </Button>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

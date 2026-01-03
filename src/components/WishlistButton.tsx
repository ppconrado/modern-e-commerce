'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function WishlistButton({
  productId,
  size = 'md',
  showText = false,
}: WishlistButtonProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Check if product is in wishlist
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/wishlist');
      if (!res.ok) return { items: [] };
      return res.json();
    },
    enabled: status === 'authenticated',
  });

  // Update local state when wishlist data changes
  useState(() => {
    if (wishlistData?.items) {
      const inList = wishlistData.items.some(
        (item: any) => item.productId === productId
      );
      setIsInWishlist(inList);
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error('Failed to add to wishlist');
      return res.json();
    },
    onSuccess: () => {
      setIsInWishlist(true);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: 'Added to wishlist',
        description: 'Product saved for later',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add to wishlist',
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove from wishlist');
      return res.json();
    },
    onSuccess: () => {
      setIsInWishlist(false);
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

  const handleClick = () => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (isInWishlist) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  if (showText) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
          isInWishlist
            ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Heart
          className={`${iconSizes[size]} ${isInWishlist ? 'fill-red-500' : ''}`}
        />
        <span className="font-medium">
          {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all ${
        isInWishlist
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`${iconSizes[size]} ${isInWishlist ? 'fill-current' : ''}`} />
    </button>
  );
}

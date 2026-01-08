'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cart';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { StarRating } from './star-rating';
import WishlistButton from './WishlistButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((item) => item.product.id === product.id);

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity - 1);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <Link href={`/products/${product.id}`}>
        <CardHeader className="p-0 cursor-pointer">
          <div className="relative h-48 w-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2">
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-1 flex flex-col gap-2">
        <Link href={`/products/${product.id}`}>
          <div className="flex items-start justify-between mb-2 cursor-pointer">
            <CardTitle className="text-lg hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
            <span className="text-lg font-bold">
              {formatCurrency(product.price)}
            </span>
          </div>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StarRating
              rating={product.averageRating || 0}
              size={16}
              showNumber={false}
            />
            {product.reviewCount && product.reviewCount > 0 ? (
              <span>
                {product.reviewCount}{' '}
                {product.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            ) : (
              <span className="opacity-70">No reviews yet</span>
            )}
          </div>
          <span className="text-xs font-black px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {cartItem ? (
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-medium">
              {cartItem.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              className="h-8 w-8"
              disabled={cartItem.quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

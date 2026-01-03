'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { fetchProductById } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { StarRating } from '@/components/star-rating';
import { ProductReviews } from '@/components/product-reviews';
import WishlistButton from '@/components/WishlistButton';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
  });

  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((item) => item.product.id === productId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 right-4">
            <WishlistButton productId={product.id} size="lg" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 mb-2">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(product.price)}
              </p>
            </div>
            {(product.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating || 0} size={20} />
                <span className="text-sm text-gray-600">
                  ({product.reviewCount}{' '}
                  {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Category</p>
              <p className="font-medium">{product.category}</p>
            </CardContent>
          </Card>

          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Availability</p>
              <p className="font-medium">
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : 'Out of stock'}
              </p>
            </CardContent>
          </Card>

          {cartItem ? (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className="h-12 w-12"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <span className="text-2xl font-medium min-w-[60px] text-center">
                {cartItem.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-12 w-12"
                disabled={cartItem.quantity >= product.stock}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <ProductReviews productId={productId} />
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-10 bg-muted rounded w-full" />
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}

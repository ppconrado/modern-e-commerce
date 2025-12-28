'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore } from '@/store/cart';
import { createOrder } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { CheckoutFormData } from '@/types';

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cardCVV: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
});

interface CheckoutFormProps {
  onSuccess: () => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { items, clearCart, getTotalPrice } = useCartStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const orderData = {
        email: data.email,
        fullName: data.fullName,
        address: data.address,
        city: data.city,
        zipCode: data.zipCode,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        total: getTotalPrice() * 1.1, // Including tax
      };

      await createOrder(orderData);
      
      toast({
        title: 'Order successful!',
        description: 'Your order has been placed successfully.',
      });
      
      clearCart();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Order failed',
        description: error instanceof Error ? error.message : 'Failed to place order',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              {...register('email')}
              type="email"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input {...register('fullName')} placeholder="John Doe" />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input {...register('address')} placeholder="123 Main St" />
            {errors.address && (
              <p className="text-sm text-destructive mt-1">
                {errors.address.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">City</label>
              <Input {...register('city')} placeholder="New York" />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">ZIP Code</label>
              <Input {...register('zipCode')} placeholder="10001" />
              {errors.zipCode && (
                <p className="text-sm text-destructive mt-1">
                  {errors.zipCode.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Card Number</label>
            <Input
              {...register('cardNumber')}
              placeholder="1234567890123456"
              maxLength={16}
            />
            {errors.cardNumber && (
              <p className="text-sm text-destructive mt-1">
                {errors.cardNumber.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                {...register('cardExpiry')}
                placeholder="MM/YY"
                maxLength={5}
              />
              {errors.cardExpiry && (
                <p className="text-sm text-destructive mt-1">
                  {errors.cardExpiry.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">CVV</label>
              <Input {...register('cardCVV')} placeholder="123" maxLength={4} />
              {errors.cardCVV && (
                <p className="text-sm text-destructive mt-1">
                  {errors.cardCVV.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 'Complete Purchase'}
      </Button>
    </form>
  );
}

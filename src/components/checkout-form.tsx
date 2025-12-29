'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const checkoutSchema = z.object({
  addressId: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  phone: z.string().optional(),
});

interface CheckoutFormData {
  addressId?: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
}

interface Address {
  id: string;
  type: string;
  label: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
  isDefault: boolean;
}

interface CheckoutFormProps {
  onSuccess: () => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // Load user's saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/addresses');
        if (response.ok) {
          const { addresses } = await response.json();
          setAddresses(addresses);
          
          // Auto-select default or first address
          const defaultAddr = addresses.find((a: Address) => a.isDefault);
          const addrToUse = defaultAddr || addresses[0];
          
          if (addrToUse) {
            setSelectedAddressId(addrToUse.id);
            setValue('addressId', addrToUse.id);
            setValue('address', addrToUse.address);
            setValue('city', addrToUse.city);
            setValue('zipCode', addrToUse.zipCode);
            if (addrToUse.phone) setValue('phone', addrToUse.phone);
          } else {
            setShowNewAddressForm(true);
          }
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [session, setValue]);

  const handleAddressSelect = (addressId: string) => {
    const addr = addresses.find(a => a.id === addressId);
    if (addr) {
      setSelectedAddressId(addressId);
      setValue('addressId', addr.id);
      setValue('address', addr.address);
      setValue('city', addr.city);
      setValue('zipCode', addr.zipCode);
      setValue('phone', addr.phone || '');
      setShowNewAddressForm(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to continue with checkout',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.product.id,
            quantity: item.quantity,
          })),
          shippingInfo: {
            address: data.address,
            city: data.city,
            zipCode: data.zipCode,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to proceed to checkout',
        variant: 'destructive',
      });
    }
  };

  const total = getTotalPrice();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Saved Addresses Selection */}
          {addresses.length > 0 && !showNewAddressForm && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Address</label>
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => handleAddressSelect(addr.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{addr.label}</p>
                        <p className="text-sm text-gray-600">{addr.address}</p>
                        <p className="text-sm text-gray-600">
                          {addr.city}, {addr.zipCode}
                        </p>
                        {addr.phone && (
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                        )}
                      </div>
                      {addr.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewAddressForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Use Different Address
              </Button>
            </div>
          )}

          {/* New Address Form */}
          {(showNewAddressForm || addresses.length === 0) && (
            <>
              {addresses.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewAddressForm(false);
                    if (addresses[0]) handleAddressSelect(addresses[0].id);
                  }}
                  className="mb-2"
                >
                  ← Back to saved addresses
                </Button>
              )}
              <div>
                <label className="text-sm font-medium">Street Address</label>
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
              <div>
                <label className="text-sm font-medium">Phone (Optional)</label>
                <Input {...register('phone')} placeholder="(555) 123-4567" />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Stripe Secure Checkout</p>
                <p className="text-xs text-gray-600">
                  You'll be redirected to Stripe to complete your payment
                  securely
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Secure 256-bit SSL encryption
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              PCI DSS compliant payment processing
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Accept all major credit cards
            </p>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || items.length === 0}
      >
        {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
      </Button>

      {!session && (
        <p className="text-sm text-center text-gray-600">
          You need to be signed in to checkout.{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            Sign in now
          </button>
        </p>
      )}
    </form>
  );
}

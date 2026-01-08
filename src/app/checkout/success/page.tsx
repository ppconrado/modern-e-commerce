'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCartStore } from '@/store/cart';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const paymentIntent = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get(
    'payment_intent_client_secret'
  );
  const redirectStatus = searchParams.get('redirect_status');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);

  const handleSuccessfulPayment = useCallback(async () => {
    try {
      // Get order data from sessionStorage (saved during checkout)
      const orderDataStr = sessionStorage.getItem('pendingOrder');
      if (orderDataStr) {
        const orderData = JSON.parse(orderDataStr);

        // Create order via API (for development - webhook alternative)
        const response = await fetch('/api/test-create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent,
            items: orderData.items,
            shippingInfo: orderData.shippingInfo,
            total: orderData.total,
          }),
        });

        if (response.ok) {
          setOrderCreated(true);
          // Clear order data from sessionStorage
          sessionStorage.removeItem('pendingOrder');
        }
      }

      // Clear cart
      clearCart();
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  }, [paymentIntent, clearCart]);

  useEffect(() => {
    // Check if payment was successful
    if (redirectStatus === 'failed') {
      setError('Payment failed. Please try again.');
      setLoading(false);
      return;
    }

    // Clear cart and create order
    if (redirectStatus === 'succeeded' && paymentIntent) {
      handleSuccessfulPayment();
    } else {
      setLoading(false);
    }
  }, [redirectStatus, paymentIntent, handleSuccessfulPayment]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/checkout')} className="w-full">
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="text-green-600 mb-4">
          <CheckCircle className="h-16 w-16 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been confirmed and will be
          processed shortly.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You will receive a confirmation email with your order details.
        </p>
        <div className="space-y-3">
          <Button onClick={() => router.push('/orders')} className="w-full">
            View My Orders
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

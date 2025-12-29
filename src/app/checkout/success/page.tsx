'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Clear cart from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart-storage');
    }

    // Simulate loading for user experience
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, [sessionId]);

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
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>Return to Home</Button>
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
          <Button onClick={() => router.push('/')} className="w-full">
            Continue Shopping
          </Button>
          <Button
            onClick={() => router.push('/orders')}
            variant="outline"
            className="w-full"
          >
            View My Orders
          </Button>
        </div>
      </Card>
    </div>
  );
}

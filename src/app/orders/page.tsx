'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, CheckCircle, Clock, XCircle, TruckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  Product: {
    id: string;
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  address: string;
  city: string;
  zipCode: string;
  createdAt: string;
  OrderItem: OrderItem[];
}

const statusIcons = {
  PENDING: Clock,
  PROCESSING: Package,
  SHIPPED: TruckIcon,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};

const statusColors = {
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  PROCESSING: 'text-blue-600 bg-blue-50 border-blue-200',
  SHIPPED: 'text-purple-600 bg-purple-50 border-purple-200',
  DELIVERED: 'text-green-600 bg-green-50 border-green-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
};

const paymentStatusColors = {
  PENDING: 'text-yellow-600',
  PROCESSING: 'text-blue-600',
  PAID: 'text-green-600',
  FAILED: 'text-red-600',
  REFUNDED: 'text-gray-600',
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-600">View and track your order history</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">
            Start shopping to see your orders here
          </p>
          <Button onClick={() => router.push('/')}>
            Browse Products
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Clock;
            const statusColor = statusColors[order.status as keyof typeof statusColors] || statusColors.PENDING;
            const paymentColor = paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors] || 'text-gray-600';

            return (
              <Card key={order.id}>
                <CardHeader className="border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg mb-1">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${statusColor}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">
                          {order.status.toLowerCase()}
                        </span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 ${paymentColor}`}>
                        <span className="text-sm font-medium">
                          Payment: {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {order.OrderItem.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <img
                          src={item.Product.image}
                          alt={item.Product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.Product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping & Total */}
                  <div className="border-t pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Shipping Address</h4>
                        <p className="text-sm text-gray-600">
                          {order.address}<br />
                          {order.city}, {order.zipCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          <div className="flex justify-end gap-4">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end gap-4 text-lg font-bold border-t pt-2">
                            <span>Total:</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

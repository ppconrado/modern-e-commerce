'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductForm } from '@/components/product-form';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Star,
  ShoppingCart,
  Loader2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  averageRating: number;
  reviewCount: number;
  _count: {
    Review: number;
    OrderItem: number;
  };
}

export default function ProductsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (
      status === 'authenticated' &&
      session?.user?.role !== 'ADMIN' &&
      session?.user?.role !== 'SUPER_ADMIN'
    ) {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      loadProducts();
    }
  }, [status, session, router]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const { products } = await response.json();
        setProducts(products);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeletingId(productId);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <ProductForm
          product={editingProduct || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first product
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.category}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex gap-6 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span
                          className={
                            product.stock > 0
                              ? 'text-green-600 font-bold'
                              : 'text-red-600 font-bold'
                          }
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>
                          {product.averageRating.toFixed(1)} (
                          {product._count.Review} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ShoppingCart className="h-4 w-4 text-gray-500" />
                        <span>{product._count.OrderItem} orders</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

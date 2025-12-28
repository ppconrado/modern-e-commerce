import type { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  return response.json();
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch product');
  }
  
  return response.json();
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products/category/${category}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch products by category');
  }
  
  return response.json();
}

export async function createOrder(orderData: {
  email: string;
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}) {
  const response = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }
  
  return response.json();
}

import type { Product } from '@/types';

// Mock product data
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description:
      'Premium noise-cancelling wireless headphones with 30-hour battery life.',
    price: 299.99,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 15,
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor and GPS.',
    price: 399.99,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 23,
  },
  {
    id: '3',
    name: 'Laptop Backpack',
    description: 'Durable water-resistant backpack with laptop compartment.',
    price: 79.99,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    category: 'Accessories',
    stock: 42,
  },
  {
    id: '4',
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with customizable switches.',
    price: 149.99,
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 18,
  },
  {
    id: '5',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking.',
    price: 49.99,
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 56,
  },
  {
    id: '6',
    name: 'Phone Stand',
    description: 'Adjustable aluminum phone stand for desk or bedside.',
    price: 24.99,
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    category: 'Accessories',
    stock: 78,
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProducts(): Promise<Product[]> {
  await delay(500);
  return mockProducts;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  await delay(300);
  return mockProducts.find((p) => p.id === id) || null;
}

export async function fetchProductsByCategory(
  category: string
): Promise<Product[]> {
  await delay(400);
  return mockProducts.filter((p) => p.category === category);
}

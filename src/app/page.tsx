import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';

function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-muted animate-pulse rounded-lg w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Featured Products</h1>
        <p className="text-muted-foreground">
          Discover our curated collection of premium products
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}

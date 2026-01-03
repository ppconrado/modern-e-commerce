# React Suspense - Complete Guide

## 📖 What is React Suspense?

**React Suspense** is a React feature that allows you to "suspend" component rendering while it's loading data or asynchronous resources. Instead of showing blank screens or complex loading states, Suspense displays a **fallback** (usually a skeleton/loading) while the actual content is being loaded.

### How Does It Work?

```tsx
import { Suspense } from 'react';

<Suspense fallback={<LoadingComponent />}>
  <ComponentThatLoadsData />
</Suspense>;
```

**Flow:**

1. React starts rendering the child component
2. If the component needs to load data (async), it "suspends"
3. React shows the `fallback` while waiting
4. When data arrives, React replaces the fallback with the actual content
5. Smooth and automatic transition

---

## 📍 Examples in the Project

### Example 1: Home Page - Product Grid

📁 **File:** `src/app/page.tsx`

```tsx
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';

// 1. Loading Component (Fallback)
function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton for title/filters */}
      <div className="h-10 bg-muted animate-pulse rounded-lg w-full max-w-md" />

      {/* Grid of skeletons (6 empty animated cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// 2. Using Suspense
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Featured Products</h1>
        <p className="text-muted-foreground">
          Discover our curated collection of premium products
        </p>
      </div>

      {/* While ProductGrid loads data, shows ProductGridSkeleton */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
```

**What happens:**

- User accesses the page
- Title and description appear **immediately**
- `ProductGridSkeleton` shows 6 animated cards (pulse)
- When products are loaded from database, skeleton is replaced by actual grid
- **Smooth transition** without loading "flash"

---

### Example 2: Product Page - Product Detail

📁 **File:** `src/app/products/[id]/page.tsx`

```tsx
import { Suspense } from 'react';

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        // Skeleton that mimics the final layout
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-square bg-muted rounded-lg" />

            {/* Details skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" /> {/* Title */}
              <div className="h-6 bg-muted rounded w-1/4" /> {/* Price */}
              <div className="h-20 bg-muted rounded" /> {/* Description */}
              <div className="h-10 bg-muted rounded w-full" /> {/* Button */}
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
```

**What happens:**

- User clicks on a product
- Skeleton appears **instantly** with exact layout of final page
- While fetching product from database (using `id` from URL)
- When data arrives, replaces skeleton with actual content
- **Much better UX** than blank screen or spinner

---

## 🎯 React Suspense Benefits

### 1. Better User Experience (UX)

```tsx
// ❌ WITHOUT Suspense - Blank screen or generic loading
{
  isLoading ? <Spinner /> : <ProductGrid products={data} />;
}

// ✅ WITH Suspense - Skeleton that mimics final layout
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductGrid />
</Suspense>;
```

**Advantages:**

- User sees something immediately (not blank screen)
- Skeleton mimics final layout (reduces visual surprise)
- Smooth transition between loading and content

### 2. Cleaner Code

**Before (without Suspense):**

```tsx
function ProductList() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <ProductGrid products={data} />;
}
```

**After (with Suspense):**

```tsx
async function ProductList() {
  const products = await fetchProducts(); // Suspends automatically
  return <ProductGrid products={products} />;
}

// Usage:
<Suspense fallback={<Spinner />}>
  <ProductList />
</Suspense>;
```

**Benefits:**

- No need for `isLoading`, `isError` states in each component
- Loading logic separated from data logic
- Components more focused on their primary responsibility

### 3. Better Perceived Performance

**User Psychology:**

- 🧠 Brain processes "content loading" better than "blank screen"
- ⏱️ Reduced waiting sensation with animated skeleton
- 👁️ Less visual "flash" when content appears

**Metrics:**

- **Without Suspense:** Blank screen → Flash → Content (bad)
- **With Suspense:** Skeleton → Smooth transition → Content (good)

### 4. Streaming SSR (Server-Side Rendering)

In Next.js 15, Suspense enables **HTML streaming**:

```
Client receives:
1. Initial HTML (layout, header, footer) → Renders NOW ⚡
2. Suspense boundaries show skeletons
3. When data arrives on server → Sends HTML of products
4. React replaces skeletons automatically (hydration)
```

**Result:**

- ✅ Much faster First Contentful Paint (FCP)!
- ✅ User sees page progressively
- ✅ No need to wait for all data on server

### 5. Loading Granularity

```tsx
<div>
  <Header /> {/* Always visible - doesn't block */}
  <Suspense fallback={<UserSkeleton />}>
    <UserProfile /> {/* Suspends independently */}
  </Suspense>
  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList /> {/* Suspends independently */}
  </Suspense>
  <Suspense fallback={<ReviewsSkeleton />}>
    <RecentReviews /> {/* Suspends independently */}
  </Suspense>
  <Footer /> {/* Always visible - doesn't block */}
</div>
```

**Benefits:**

- Each section loads independently
- If `UserProfile` loads quickly, shows while rest loads
- Doesn't block entire page
- Better visual progression

---

## 🛠️ How to Use React Suspense

### Step 1: Create a Fallback (Skeleton)

```tsx
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

**Tips for good skeletons:**

- ✅ Mimic final layout (same size, positions)
- ✅ Use Tailwind's `animate-pulse` for animation
- ✅ Neutral colors (`bg-muted`, `bg-gray-200`)
- ✅ Maintain proportionality with actual content
- ✅ Same grid/flex structure as final component

**Complex example:**

```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-10 bg-muted rounded w-32 animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

### Step 2: Wrap Component with Suspense

```tsx
import { Suspense } from 'react';

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>

      <Suspense fallback={<ProductCardSkeleton />}>
        <ProductCard id={123} />
      </Suspense>
    </div>
  );
}
```

### Step 3: Child Component Must "Suspend"

#### A. Server Components (Next.js 15)

In Next.js 15 with Server Components, this happens **automatically** when you `await`:

```tsx
// This is a Server Component (default in Next.js 15)
async function ProductCard({ id }: { id: number }) {
  // await makes component "suspend" automatically
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h2>{product.name}</h2>
      <p>${product.price}</p>
      <img src={product.imageUrl} alt={product.name} />
    </div>
  );
}
```

**React detects the `await` and:**

1. Suspends rendering
2. Shows Suspense fallback
3. When Promise resolves, renders actual content

#### B. Client Components (TanStack Query)

For Client Components, use `useSuspenseQuery`:

```tsx
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

function ProductList() {
  // useSuspenseQuery automatically "suspends"
  const { data: products } = useSuspenseQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}

// Usage:
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductList />
</Suspense>;
```

**Note:** Use `useSuspenseQuery` (not `useQuery`) for Suspense integration.

---

## 🔥 Advanced Patterns

### 1. Nested Suspense

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />

  <div className="grid grid-cols-2 gap-8">
    <Suspense fallback={<UserSkeleton />}>
      <UserInfo />
    </Suspense>

    <Suspense fallback={<StatsSkeleton />}>
      <UserStats />
    </Suspense>
  </div>

  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList />
  </Suspense>

  <Footer />
</Suspense>
```

**Benefits:**

- Granular loading (each section independent)
- If `UserInfo` loads fast, shows while `ProductList` still loading
- Better visual progression
- User sees content as it becomes ready

**When to use:**

- Dashboard with multiple sections
- Page with data from multiple APIs
- Parts of page with different loading speeds

### 2. Suspense with Error Boundary

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="text-red-800 font-bold">Error loading</h3>
      <p className="text-red-600">{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSkeleton />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**Complete flow:**

- Loading → `<LoadingSkeleton />`
- Success → `<DataComponent />`
- Error → `<ErrorFallback />`

### 3. Multiple Components in Same Suspense

```tsx
<Suspense fallback={<DashboardSkeleton />}>
  <UserStats /> {/* Loads in parallel */}
  <RecentOrders /> {/* Loads in parallel */}
  <Analytics /> {/* Loads in parallel */}
</Suspense>
```

**Warning:**

- ⚠️ All 3 must finish loading to replace skeleton
- ⚠️ Slowest component blocks the others
- ✅ If you want independent loading, use separate Suspense for each

**Better example:**

```tsx
{/* Each loads independently */}
<Suspense fallback={<UserStatsSkeleton />}>
  <UserStats />
</Suspense>

<Suspense fallback={<OrdersSkeleton />}>
  <RecentOrders />
</Suspense>

<Suspense fallback={<AnalyticsSkeleton />}>
  <Analytics />
</Suspense>
```

### 4. Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react';

// Load component only when needed
const HeavyChart = lazy(() => import('./HeavyChart'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

**Benefits:**

- Reduces initial bundle
- Loads code on demand
- Improves initial performance

### 5. Suspense with Transitions (useTransition)

```tsx
'use client';

import { useState, useTransition, Suspense } from 'react';

function ProductSearch() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSearch(e) {
    const newQuery = e.target.value;

    // Mark update as non-urgent
    startTransition(() => {
      setQuery(newQuery);
    });
  }

  return (
    <div>
      <input
        type="text"
        onChange={handleSearch}
        placeholder="Search products..."
        className={isPending ? 'opacity-50' : ''}
      />

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductResults query={query} />
      </Suspense>
    </div>
  );
}
```

**Benefits:**

- Input doesn't freeze during search
- Shows loading indicator (`isPending`)
- Better UX for searches/filters

---

## 📊 Comparison: With vs Without Suspense

| Aspect          | Without Suspense                       | With Suspense                        |
| --------------- | -------------------------------------- | ------------------------------------ |
| **Code**        | `if (loading) return <Spinner />`      | `<Suspense fallback={<Skeleton />}>` |
| **States**      | Manage `isLoading`, `isError` manually | Suspense manages automatically       |
| **UX**          | Generic spinner or blank screen        | Skeleton that mimics final layout    |
| **Performance** | Blank screen until everything loads    | Progressive streaming                |
| **Granularity** | Hard to have loading per section       | Easy with nested Suspense            |
| **SSR**         | Blocks entire page                     | Progressive HTML streaming           |
| **Bundle Size** | All code in initial bundle             | Easy lazy loading with `React.lazy`  |
| **Maintenance** | Loading logic scattered                | Centralized in boundaries            |

---

## 🚀 When to Use Suspense?

### ✅ Use Suspense when:

- **Loading data from API/database**

  ```tsx
  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList />
  </Suspense>
  ```

- **Lazy loading components**

  ```tsx
  const AdminPanel = lazy(() => import('./AdminPanel'));
  <Suspense fallback={<Spinner />}>
    <AdminPanel />
  </Suspense>;
  ```

- **Want better UX with skeletons**

  - Mimic final layout
  - Reduce perceived waiting time

- **Need streaming SSR**

  - Next.js with Server Components
  - Progressive content

- **Multiple sections loading independently**
  - Dashboard with multiple parts
  - Page with multiple APIs

### ❌ Don't use Suspense for:

- **CSS animations/transitions**

  ```tsx
  // ❌ Don't use Suspense
  <div className="animate-fade-in">...</div>

  // ✅ Use CSS or Framer Motion
  ```

- **Regular image loading**

  ```tsx
  // ❌ Don't use Suspense
  <Suspense fallback={...}>
    <img src="..." />
  </Suspense>

  // ✅ Use native loading
  <Image src="..." loading="lazy" />
  ```

- **Form states**

  ```tsx
  // ❌ Don't use Suspense
  <Suspense fallback={...}>
    <ContactForm />
  </Suspense>

  // ✅ Use React Hook Form or local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  ```

- **Static asset loading**
  - CSS, fonts → use preload
  - Images → use Next.js `<Image>`

---

## 🎓 Practical Project Examples

### Real Example 1: Home Page

**File:** `src/app/page.tsx`

```tsx
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
```

**Why it works well:**

- ✅ Title/description appear immediately (not blocked)
- ✅ Skeleton shows 6 cards (same number that will appear)
- ✅ Grid layout matches final version
- ✅ Tailwind's `animate-pulse` animation

### Real Example 2: Product Detail Page

**File:** `src/app/products/[id]/page.tsx`

```tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

async function ProductDetailContent({ id }: { id: string }) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover rounded-lg"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold">${product.price}</p>
          <p className="text-muted-foreground">{product.description}</p>
          <button className="w-full bg-primary text-white py-3 rounded-lg">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
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
      <ProductDetailContent id={params.id} />
    </Suspense>
  );
}
```

**Why it works well:**

- ✅ Skeleton exactly mimics final layout (2 columns)
- ✅ Correct proportions (square image, full button)
- ✅ User sees structure before data
- ✅ Database query with `include` suspends automatically

---

## 🧪 Testing

### How to test Suspense

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

test('shows fallback while loading', async () => {
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  );

  // Verify fallback appears
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for component to load
  await waitFor(() => {
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
```

---

## 📚 Additional Resources

- [React Docs - Suspense](https://react.dev/reference/react/Suspense)
- [Next.js Docs - Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [TanStack Query - Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

---

## 📝 Summary

**React Suspense enables:**

1. ✅ **Declare** where to show loading (don't manage states manually)
2. ✅ **Professional skeletons** that mimic final layout
3. ✅ **Streaming SSR** in Next.js (faster FCP)
4. ✅ **Granular loading** (each section independent)
5. ✅ **Cleaner code** (no `if (loading)` everywhere)
6. ✅ **Better UX** (progressive content, less blank screen)
7. ✅ **Easy lazy loading** with `React.lazy()`

**In current project:**

- ✅ Home page uses Suspense for product grid
- ✅ Product detail page uses Suspense for product details
- ✅ Skeletons with Tailwind's `animate-pulse`
- ✅ Server Components with automatic `await`
- ✅ Streaming SSR enabled automatically

**Next steps:**

1. Add Suspense to more pages (admin dashboard, orders)
2. Create reusable skeleton library
3. Implement Error Boundaries for error handling
4. Monitor performance metrics (FCP, LCP)

---

**Status:** ✅ Suspense implemented and working
**Version:** React 19 + Next.js 15
**Last updated:** January 2026

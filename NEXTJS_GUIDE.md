# Next.js Complete Guide - E-Commerce Project Implementation

## Table of Contents

1. [What is Next.js?](#what-is-nextjs)
2. [How Next.js Works](#how-nextjs-works)
3. [Project Structure](#project-structure)
4. [Key Features & Implementation](#key-features--implementation)
5. [App Router vs Pages Router](#app-router-vs-pages-router)
6. [Main Configuration Files](#main-configuration-files)
7. [Advantages of Next.js](#advantages-of-nextjs)
8. [Best Practices](#best-practices)
9. [Project Examples from ShopHub](#project-examples-from-shophub)

---

## What is Next.js?

Next.js is a **React framework** for building full-stack web applications. It enhances React with additional features and optimizations that make it production-ready out of the box.

### Core Capabilities:

- **Server-Side Rendering (SSR)**: Render React components on the server
- **Static Site Generation (SSG)**: Pre-render pages at build time
- **API Routes**: Build backend endpoints within your Next.js app
- **File-based Routing**: Automatic routing based on file structure
- **Image Optimization**: Automatic image optimization with the Image component
- **Code Splitting**: Automatic code splitting for faster page loads
- **React Server Components**: New paradigm for building React apps

---

## How Next.js Works

### The Request-Response Cycle

```
User Request → Next.js Server → React Component Rendering → HTML Response
                    ↓
              API Routes (Optional)
                    ↓
              Database/External APIs
```

### Rendering Strategies

1. **Server Components (Default in App Router)**

   - Rendered on the server
   - No JavaScript sent to client for component logic
   - Direct database access
   - Better performance and SEO

2. **Client Components**

   - Marked with `'use client'` directive
   - Interactive components (hooks, event handlers)
   - Run in browser

3. **Static Generation**

   - Pre-rendered at build time
   - Cached and served instantly

4. **Dynamic Rendering**
   - Rendered on each request
   - Fresh data every time

---

## Project Structure

### Standard Next.js App Router Structure

```
e-commerce/
├── public/                    # Static assets (images, fonts, etc.)
│   └── uploads/              # User-uploaded files
│       └── products/
├── src/
│   ├── app/                  # App Router directory (Next.js 13+)
│   │   ├── layout.tsx        # Root layout (wraps all pages)
│   │   ├── page.tsx          # Home page (/)
│   │   ├── globals.css       # Global styles
│   │   ├── api/              # API routes
│   │   │   ├── products/
│   │   │   │   ├── route.ts  # /api/products endpoint
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # /api/products/:id
│   │   │   ├── auth/
│   │   │   ├── checkout/
│   │   │   └── webhooks/
│   │   ├── products/         # Product pages
│   │   │   └── [id]/
│   │   │       └── page.tsx  # /products/:id
│   │   ├── cart/
│   │   │   └── page.tsx      # /cart
│   │   ├── checkout/
│   │   │   └── page.tsx      # /checkout
│   │   ├── admin/            # Admin pages
│   │   │   └── products/
│   │   │       └── page.tsx  # /admin/products
│   │   ├── login/
│   │   │   └── page.tsx      # /login
│   │   └── register/
│   │       └── page.tsx      # /register
│   ├── components/           # Reusable React components
│   │   ├── header.tsx
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── providers.tsx     # Context providers
│   │   └── ui/               # UI component library
│   ├── lib/                  # Utility functions & configurations
│   │   ├── prisma.ts         # Database client
│   │   ├── api.ts            # API client functions
│   │   ├── stripe.ts         # Payment integration
│   │   └── utils.ts          # Helper functions
│   ├── hooks/                # Custom React hooks
│   │   └── use-toast.ts
│   ├── store/                # State management (Zustand)
│   │   └── cart.ts
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   └── auth.ts               # Authentication configuration (NextAuth)
├── prisma/                   # Database schema & migrations
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── tests/                    # Test files (Playwright)
│   ├── e-commerce.spec.ts
│   └── auth.setup.ts
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── package.json              # Dependencies & scripts
└── docker-compose.yml        # Docker setup
```

### Directory Naming Conventions

| Pattern         | Purpose               | Example                                        |
| --------------- | --------------------- | ---------------------------------------------- |
| `page.tsx`      | Creates a route       | `app/products/page.tsx` → `/products`          |
| `layout.tsx`    | Shared UI wrapper     | `app/layout.tsx` wraps all pages               |
| `[param]/`      | Dynamic route segment | `app/products/[id]/page.tsx` → `/products/123` |
| `route.ts`      | API endpoint          | `app/api/products/route.ts` → `/api/products`  |
| `loading.tsx`   | Loading UI            | Automatic loading state                        |
| `error.tsx`     | Error boundary        | Automatic error handling                       |
| `not-found.tsx` | 404 page              | Custom 404 UI                                  |

---

## Key Features & Implementation

### 1. File-Based Routing

**Automatic routing based on file structure:**

```tsx
// src/app/page.tsx → renders at "/"
export default function HomePage() {
  return <h1>Home</h1>;
}

// src/app/products/page.tsx → renders at "/products"
export default function ProductsPage() {
  return <h1>Products</h1>;
}

// src/app/products/[id]/page.tsx → renders at "/products/:id"
export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <h1>Product {params.id}</h1>;
}
```

### 2. Layouts

**Shared UI that persists across pages:**

```tsx
// src/app/layout.tsx - Root Layout (Required)
import { Header } from '@/components/header';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

**Benefits:**

- Header and navigation rendered once
- State persists when navigating
- Partial page updates (no full reload)

### 3. Server & Client Components

**Server Component (Default):**

```tsx
// src/app/page.tsx
import { ProductGrid } from '@/components/product-grid';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Featured Products</h1>
      <ProductGrid />
    </div>
  );
}
```

**Client Component (Interactive):**

```tsx
// src/components/product-grid.tsx
'use client'; // This directive makes it a client component

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function ProductGrid() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {/* Products display */}
    </div>
  );
}
```

**When to use Client Components:**

- useState, useEffect, or other React hooks
- Event handlers (onClick, onChange, etc.)
- Browser APIs (window, localStorage, etc.)
- Third-party libraries that use hooks

### 4. Data Fetching

**Server Component (Direct Database Access):**

```tsx
// Can fetch data directly in Server Components
import { prisma } from '@/lib/prisma';

export default async function ProductsPage() {
  const products = await prisma.product.findMany();

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

**Client Component (API Routes):**

```tsx
// src/lib/api.ts
export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products', {
    cache: 'no-store',
  });
  return response.json();
}

// Client component uses API
('use client');
import { useQuery } from '@tanstack/react-query';

export function ProductList() {
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  // ...
}
```

### 5. API Routes

**Creating Backend Endpoints:**

```tsx
// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: body,
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
```

**Dynamic API Routes:**

```tsx
// src/app/api/products/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });
  return NextResponse.json(product);
}
```

### 6. Metadata & SEO

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShopHub - E-commerce MVP',
  description: 'Modern e-commerce platform built with Next.js',
};
```

**Dynamic Metadata:**

```tsx
// src/app/products/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await fetchProductById(params.id);

  return {
    title: `${product.name} - ShopHub`,
    description: product.description,
  };
}
```

### 7. Image Optimization

```tsx
import Image from 'next/image';

export function ProductCard({ product }) {
  return (
    <Image
      src={product.image}
      alt={product.name}
      width={400}
      height={400}
      className="rounded-lg"
      priority={false} // Lazy load by default
    />
  );
}
```

**Benefits:**

- Automatic resizing
- Format conversion (WebP, AVIF)
- Lazy loading
- Blur placeholder

### 8. Loading States

```tsx
// src/app/loading.tsx - Automatic loading UI
export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin">Loading...</div>
    </div>
  );
}
```

**Suspense Boundaries:**

```tsx
// src/app/page.tsx
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';

function ProductGridSkeleton() {
  return <div className="animate-pulse">Loading products...</div>;
}

export default function HomePage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductGrid />
    </Suspense>
  );
}
```

### 9. Error Handling

```tsx
// src/app/error.tsx - Automatic error boundary
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## App Router vs Pages Router

### App Router (Recommended - Used in This Project)

**Features:**

- Server Components by default
- Nested layouts
- Loading & error states
- Streaming & Suspense
- File-based conventions (layout.tsx, page.tsx, error.tsx)

**Structure:**

```
app/
├── layout.tsx
├── page.tsx
├── products/
│   ├── [id]/
│   │   └── page.tsx
│   └── page.tsx
```

### Pages Router (Legacy)

**Structure:**

```
pages/
├── _app.tsx
├── index.tsx
├── products/
│   ├── [id].tsx
│   └── index.tsx
```

**This project uses the App Router** because it provides:

- Better performance with Server Components
- Improved developer experience
- Modern React features
- Better SEO and data fetching

---

## Main Configuration Files

### 1. next.config.ts

**Primary Next.js configuration file:**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // External packages that should not be bundled
  serverExternalPackages: ['pg', '@prisma/client'],
};

export default nextConfig;
```

**Key Configuration Options:**

- `images`: Configure image optimization domains
- `output`: Build output type ('standalone', 'export')
- `serverExternalPackages`: Exclude packages from server bundling
- `reactStrictMode`: Enable React strict mode
- `redirects`: Set up URL redirects
- `rewrites`: Create URL rewrites

### 2. tsconfig.json

**TypeScript configuration:**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"] // Path alias for imports
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Important Settings:**

- `paths`: Import path aliases (`@/` maps to `src/`)
- `plugins.name: "next"`: Next.js TypeScript plugin
- `strict: true`: Enable strict type checking

### 3. package.json

**Dependencies and scripts:**

```json
{
  "name": "ecommerce-mvp",
  "scripts": {
    "dev": "next dev", // Start development server
    "build": "next build", // Build for production
    "start": "next start", // Start production server
    "lint": "next lint", // Run ESLint
    "db:generate": "prisma generate", // Generate Prisma Client
    "db:migrate": "prisma migrate dev", // Run database migrations
    "db:seed": "tsx prisma/seed.ts" // Seed database
  },
  "dependencies": {
    "next": "^15.1.0", // Next.js framework
    "react": "^19.0.0", // React library
    "react-dom": "^19.0.0", // React DOM
    "@prisma/client": "^7.2.0", // Database ORM
    "@tanstack/react-query": "^5.62.8", // Data fetching
    "next-auth": "^5.0.0-beta.30", // Authentication
    "tailwindcss": "^3.4.17", // CSS framework
    "typescript": "^5" // TypeScript
  }
}
```

### 4. tailwind.config.ts

**Tailwind CSS configuration:**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
    },
  },
  plugins: [],
};

export default config;
```

### 5. Environment Variables (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## Advantages of Next.js

### 1. **Performance**

- **Automatic Code Splitting**: Only load code needed for each page
- **Image Optimization**: Automatic resizing, lazy loading, modern formats
- **Font Optimization**: Automatically optimize and inline fonts
- **Prefetching**: Automatically prefetch linked pages

### 2. **SEO & Accessibility**

- **Server-Side Rendering**: Search engines can crawl content easily
- **Meta Tags**: Dynamic metadata for each page
- **Semantic HTML**: Better accessibility by default

### 3. **Developer Experience**

- **Fast Refresh**: Instant feedback while developing
- **TypeScript**: Built-in TypeScript support
- **File-based Routing**: No need to configure routes
- **API Routes**: Full-stack in one framework
- **Error Messages**: Helpful error overlays

### 4. **Production Ready**

- **Built-in Optimization**: Minification, compression, caching
- **Security**: CSRF protection, sanitization
- **Deployment**: Easy deployment to Vercel or any Node.js host
- **Monitoring**: Built-in analytics support

### 5. **Scalability**

- **Incremental Static Regeneration**: Update static pages without rebuilding
- **Edge Runtime**: Deploy to edge for lower latency
- **Middleware**: Run code before requests are processed
- **API Routes**: Scale backend with frontend

### 6. **Full-Stack Framework**

- **API Routes**: Build backend APIs in the same project
- **Database Integration**: Direct database access in Server Components
- **Authentication**: Easy integration with NextAuth
- **File Uploads**: Handle file uploads with API routes

---

## Best Practices

### 1. **Component Organization**

```
components/
├── ui/              # Generic UI components (buttons, inputs)
├── features/        # Feature-specific components
└── layouts/         # Layout components
```

### 2. **Server vs Client Components**

**Use Server Components for:**

- Static content
- Data fetching
- Direct database access
- Sensitive operations

**Use Client Components for:**

- Interactivity (onClick, onChange)
- State management (useState, useReducer)
- Browser APIs (localStorage, window)
- Real-time features

### 3. **Data Fetching Patterns**

```tsx
// ✅ Good: Server Component with direct DB access
async function ProductList() {
  const products = await prisma.product.findMany();
  return <div>{/* Render products */}</div>;
}

// ✅ Good: Client Component with API route
('use client');
function ProductList() {
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then((r) => r.json()),
  });
  return <div>{/* Render products */}</div>;
}
```

### 4. **Error Handling**

```tsx
// Global error boundary
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 5. **Loading States**

```tsx
// app/loading.tsx
export default function Loading() {
  return <Skeleton />;
}

// Or use Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <ProductList />
</Suspense>;
```

### 6. **Environment Variables**

```tsx
// ✅ Expose to client with NEXT_PUBLIC_ prefix
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ Server-only (no prefix)
const secretKey = process.env.SECRET_KEY;
```

### 7. **Image Optimization**

```tsx
import Image from 'next/image';

// ✅ Always specify width and height
<Image
  src="/product.jpg"
  alt="Product"
  width={500}
  height={500}
  priority={false} // Use priority for above-fold images only
/>;
```

### 8. **Metadata**

```tsx
// Static metadata
export const metadata = {
  title: 'My App',
  description: 'Description',
};

// Dynamic metadata
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
  };
}
```

---

## Project Examples from ShopHub

### Example 1: Homepage with Suspense

**File: src/app/page.tsx**

```tsx
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';

// Skeleton loader
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

### Example 2: Dynamic Product Page

**File: src/app/products/[id]/page.tsx**

```tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchProductById } from '@/lib/api';
import Image from 'next/image';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Image
          src={product.image}
          alt={product.name}
          width={600}
          height={600}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold mt-4">${product.price}</p>
          <p className="mt-4">{product.description}</p>
        </div>
      </div>
    </div>
  );
}
```

### Example 3: API Route with Database

**File: src/app/api/products/route.ts**

```tsx
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, image, category, stock } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: { name, description, price, image, category, stock },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
```

### Example 4: Root Layout with Providers

**File: src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ShopHub - E-commerce MVP',
  description:
    'Modern e-commerce platform built with Next.js, TypeScript, and Tailwind CSS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### Example 5: Client Component with State

**File: src/components/product-grid.tsx**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/lib/api';
import { ProductCard } from './product-card';
import { Input } from './ui/input';
import { Button } from './ui/button';

export function ProductGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    if (!products) return ['All'];
    const unique = Array.from(new Set(products.map((p) => p.category))).sort();
    return ['All', ...unique];
  }, [products]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### Example 6: Authentication Setup

**File: src/auth.ts**

```tsx
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
```

### Example 7: Database Connection

**File: src/lib/prisma.ts**

```tsx
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## How to Implement a Next.js Project from Scratch

### Step 1: Create New Project

```bash
npx create-next-app@latest my-app
# Choose:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ src/ directory: Yes
# ✓ App Router: Yes
# ✓ Import alias (@/*): Yes
```

### Step 2: Install Dependencies

```bash
cd my-app
npm install @prisma/client @tanstack/react-query next-auth bcryptjs
npm install -D prisma tsx
```

### Step 3: Initialize Prisma

```bash
npx prisma init
# Edit prisma/schema.prisma with your models
npx prisma migrate dev --name init
npx prisma generate
```

### Step 4: Create Project Structure

```bash
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/app/api
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/types
```

### Step 5: Configure Next.js

Edit `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'your-cdn.com' }],
  },
};
```

### Step 6: Set Up Environment Variables

Create `.env`:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-a-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Step 7: Create Your First Pages

- `src/app/page.tsx` - Home page
- `src/app/layout.tsx` - Root layout
- `src/app/api/*/route.ts` - API endpoints

### Step 8: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run Playwright tests
```

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Configure environment variables
4. Deploy automatically on every push

### Docker

```bash
# Build and run with Docker
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs
```

### Manual Deployment

```bash
npm run build
npm run start
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js Discord](https://discord.com/invite/bUG2bvbtHy)

---

## Conclusion

Next.js is a powerful framework that makes building modern web applications easier and faster. This e-commerce project demonstrates:

✅ **File-based routing** with the App Router  
✅ **Server and Client Components** for optimal performance  
✅ **API Routes** for full-stack development  
✅ **Database integration** with Prisma  
✅ **Authentication** with NextAuth  
✅ **Image optimization** with next/image  
✅ **Type safety** with TypeScript  
✅ **Modern styling** with Tailwind CSS

The combination of these features creates a production-ready, scalable e-commerce platform that is easy to maintain and extend.

---

**Document Version:** 1.0  
**Last Updated:** January 3, 2026  
**Project:** ShopHub E-commerce MVP  
**Framework:** Next.js 15.1.0 (App Router)

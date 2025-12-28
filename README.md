# E-commerce MVP - Enhanced

A modern, full-featured e-commerce platform built with cutting-edge technologies from the 2026 Web Development landscape.

## 🚀 Technologies Used

This project implements the technologies recommended in the **Web Development in 2026 Study Guide**:

### Core Framework

- **Next.js 15** - React framework with App Router for server-side rendering and SEO
- **React 19** - Latest version with improved performance and Suspense
- **TypeScript** - Type-safe development

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives (Dialog, Toast)
- **Lucide React** - Beautiful icon library

### State Management

- **Zustand** - Minimal, fast state management (cart functionality)
- **TanStack Query** - Data fetching, caching, and server state management

### Forms & Validation

- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### Advanced Features

- **React Suspense** - Better loading states and streaming UX
- **Toast Notifications** - Real-time user feedback with Radix Toast

### Additional Tools

- **class-variance-authority** - Component variant styling
- **tailwind-merge** - Merge Tailwind classes without conflicts

## 📦 Features

- ✅ Product catalog with grid view
- ✅ **Product search and filtering by category**
- ✅ **Individual product detail pages**
- ✅ Shopping cart with persistent storage (Zustand + localStorage)
- ✅ Add/remove products with quantity controls
- ✅ **Toast notifications for cart actions**
- ✅ Real-time cart updates and totals
- ✅ Checkout form with validation (React Hook Form + Zod)
- ✅ **React Suspense for improved loading UX**
- ✅ Responsive design for mobile and desktop
- ✅ Loading states and error handling
- ✅ Order success flow
- ✅ Type-safe development with TypeScript
- ✅ Server-side rendering with Next.js
- ✅ Accessible UI components with Radix UI

## 🛠️ Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
e-commerce/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page (product grid)
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Product detail page
│   │   ├── cart/               # Cart page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components (Radix)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── toast.tsx       # Toast component
│   │   │   └── toaster.tsx     # Toast container
│   │   ├── header.tsx          # Navigation header
│   │   ├── product-card.tsx    # Product display card
│   │   ├── product-grid.tsx    # Product grid with search/filter
│   │   ├── checkout-form.tsx   # Checkout form with validation
│   │   └── providers.tsx       # Query client provider
│   ├── hooks/                  # Custom React hooks
│   │   └── use-toast.ts        # Toast notification hook
│   ├── store/                  # Zustand stores
│   │   └── cart.ts             # Cart state management
│   ├── lib/                    # Utilities and API
│   │   ├── api.ts              # Mock API functions
│   │   └── utils.ts            # Helper functions
│   └── types/                  # TypeScript types
│       └── index.ts            # Shared type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 🎯 Key Implementation Details

### React Suspense (NEW!)

Streaming UI with better loading states:

- Skeleton screens while data loads
- Non-blocking UI updates
- Improved perceived performance

### Toast Notifications (NEW!)

Real-time user feedback using Radix Toast:

- Add to cart confirmations
- Remove from cart notifications
- Clean, accessible notifications

### Product Search & Filtering (NEW!)

Enhanced product discovery:

- Real-time search across name and description
- Category filtering (All, Electronics, Accessories)
- Optimized with useMemo for performance

### Product Detail Pages (NEW!)

Individual product pages with:

- Full product information
- Large product images
- Add to cart functionality
- Stock availability
- Breadcrumb navigation

### State Management with Zustand

The cart state is managed using Zustand with persistence:

- Add/remove items
- Update quantities
- Calculate totals
- Persist to localStorage

### Data Fetching with TanStack Query

Product data is fetched using TanStack Query:

- Automatic caching
- Background refetching
- Loading and error states
- Optimistic updates

### Form Validation with Zod

Checkout form uses Zod schemas for validation:

- Email validation
- Address validation
- Credit card format validation
- Real-time error messages

### UI Components with Radix UI

Accessible, unstyled components styled with Tailwind:

- Dialog (checkout modal)
- Cards (product cards)
- Buttons with variants
- Input fields

## 🧪 Testing

This project is configured for E2E testing with Playwright (as recommended in the study guide):

```bash
npm run test
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Playwright tests

## 🔮 Future Enhancements

Following the 2026 Web Development roadmap, consider adding:

- **TanStack Router** - File-based routing
- **ElectricSQL/Zero** - Offline-first functionality
- **Playwright Tests** - E2E testing automation
- **Design Mode Integration** - Enhanced design-to-code workflow

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form](https://react-hook-form.com/get-started)
- [Zod](https://zod.dev)

## 📄 License

MIT License - feel free to use this project for learning and development.

---

Built with ❤️ using modern web technologies for 2026 and beyond!

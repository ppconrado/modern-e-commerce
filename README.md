# E-commerce MVP - Full-Stack Edition

A modern, production-ready e-commerce platform built with cutting-edge technologies from the 2026 Web Development landscape. **Now with PostgreSQL backend!**

## 🚀 Technologies Used

This project implements the technologies recommended in the **Web Development in 2026 Study Guide**:

### Core Framework

- **Next.js 15** - Full-stack framework with App Router and API routes
- **React 19** - Latest version with improved performance and Suspense
- **TypeScript** - End-to-end type safety

### Backend & Database

- **PostgreSQL** - Production-grade relational database
- **Prisma ORM** - Type-safe database access with migrations
- **Next.js API Routes** - RESTful API endpoints

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives (Dialog, Toast)
- **Lucide React** - Beautiful icon library

### State Management

- **Zustand** - Minimal, fast state management (cart functionality)
- **TanStack Query** - Data fetching, caching, and server state management

### Forms & Validation

- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation (frontend & backend)

### Advanced Features

- **NextAuth.js** - Complete authentication system with role-based access
- **React Suspense** - Better loading states and streaming UX
- **Toast Notifications** - Real-time user feedback with Radix Toast
- **Prisma Studio** - Database GUI for development
- **Stripe Integration** - Secure payment processing
- **Admin Dashboard** - Complete store management system

## 📦 Features

### Customer Features

- ✅ Product catalog with grid view
- ✅ **Product search and filtering by category**
- ✅ **Individual product detail pages with reviews**
- ✅ **Wishlist system** - Save favorite products
- ✅ Shopping cart with persistent storage (Zustand + localStorage)
- ✅ Add/remove products with quantity controls
- ✅ **Toast notifications for cart actions**
- ✅ Real-time cart updates and totals
- ✅ **User authentication (Login/Register)**
- ✅ **User profile and address management**
- ✅ **Order history and tracking**
- ✅ **Product reviews (verified purchasers only)**
- ✅ **Star ratings with average display**
- ✅ Checkout form with validation (React Hook Form + Zod)
- ✅ **Stripe payment integration**

### Admin Features

- ✅ **Role-based access control (CUSTOMER, ADMIN, SUPER_ADMIN)**
- ✅ **Product management (CRUD operations)**
- ✅ **Order management with status updates**
- ✅ **Analytics dashboard**
  - Revenue tracking and trends
  - Customer metrics
  - Product performance
  - Top-selling products
  - Low stock alerts
- ✅ **Store settings management**
  - Financial settings
  - Inventory controls
  - Feature toggles (reviews, wishlist)
- ✅ **Admin invite system**

### Backend

- ✅ **RESTful API with Next.js**
- ✅ **PostgreSQL database with Prisma**
- ✅ **User management with NextAuth.js**
- ✅ **Order processing and tracking**
- ✅ **Automatic stock updates**
- ✅ **Webhook handling (Stripe)**
- ✅ **Data validation and error handling**
- ✅ **Database seeding with sample data**
- ✅ **Verified purchaser review system**

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database:
   ```bash
   createdb ecommerce_db
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update `DATABASE_URL` in `.env` with your credentials

**Option B: Use Prisma Postgres (Recommended - Easiest!)**

```bash
npx prisma-postgres-create-database
```

### 3. Configure Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32

# Stripe (optional - for payment processing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Run Migrations & Seed

```bash
npx prisma migrate dev
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Create Admin User (Optional)

To access the admin dashboard, you need to create an admin user. You can do this by:

1. Register a normal user account
2. Update the user role in the database using Prisma Studio:
   ```bash
   npm run db:studio
   ```
3. Find your user and change the `role` field to `ADMIN` or `SUPER_ADMIN`

Or use the admin invite system (requires an existing admin).

### 5. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

**Default test account:**

- Email: `customer@test.com`
- Password: `password123`

## 🎨 User Roles & Access

The application has three user roles:

### CUSTOMER (Default)

- Browse products and categories
- Add products to cart and wishlist
- Place orders and make payments
- Write reviews for purchased products
- Manage profile and addresses
- View order history

### ADMIN

- All customer permissions
- Access admin dashboard
- Manage products (CRUD)
- View and update orders
- View analytics
- Invite other admins

### SUPER_ADMIN

- All admin permissions
- Manage store settings
- Full system configuration
- User role management

## 📊 Database Management

### Prisma Studio (Database GUI)

```bash
npm run db:studio
```

Opens at http://localhost:5555

### Database Scripts

```bash
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Prisma Studio
```

## 🚦 Testing the Application

### Testing Customer Features

1. **Browse Products**: Visit home page to see product grid
2. **Search/Filter**: Use search bar and category filters
3. **Product Details**: Click any product to view details
4. **Add to Cart**: Add products with quantity controls
5. **Wishlist**: Click heart icon to save favorites
6. **Checkout**: Go to cart and proceed to checkout
7. **Payment**: Use Stripe test card: `4242 4242 4242 4242`
8. **Orders**: View order history in account page
9. **Reviews**: After order is delivered, write product reviews

### Testing Admin Features

1. **Login as Admin**: Use admin credentials or update user role
2. **Dashboard**: View analytics at `/admin/analytics`
3. **Products**: Manage products at `/admin/products`
4. **Orders**: Update order statuses at `/admin/orders`
5. **Settings**: Configure store at `/admin/settings`

### Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

## 🗄️ API Endpoints

### Public Endpoints

- `GET /api/products` - Fetch all products
- `GET /api/products/[id]` - Get product by ID
- `GET /api/products/category/[category]` - Filter by category
- `GET /api/products/[id]/reviews` - Get product reviews
- `POST /api/register` - User registration
- `POST /api/auth/[...nextauth]` - Authentication (NextAuth)

### Authenticated User Endpoints

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `GET /api/user/addresses` - Get user addresses
- `POST /api/user/addresses` - Create new address
- `PATCH /api/user/addresses/[id]` - Update address
- `DELETE /api/user/addresses/[id]` - Delete address
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist` - Add product to wishlist
- `DELETE /api/wishlist` - Remove product from wishlist
- `POST /api/products/[id]/reviews` - Create review (verified purchasers only)
- `PATCH /api/reviews/[id]` - Update own review
- `DELETE /api/reviews/[id]` - Delete own review

### Admin Endpoints

- `GET /api/admin/products` - Get all products (admin view)
- `POST /api/admin/products` - Create new product
- `PATCH /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/[id]` - Get order details
- `PATCH /api/admin/orders/[id]` - Update order status
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/settings` - Get store settings
- `PATCH /api/admin/settings` - Update store settings

### Webhooks

- `POST /api/webhooks/stripe` - Stripe payment webhook

## � Project Structure

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
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Database seed script
│   └── migrations/             # Database migrations
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── products/       # Product endpoints
│   │   │   ├── orders/         # Order endpoints
│   │   │   ├── user/           # User profile endpoints
│   │   │   ├── wishlist/       # Wishlist endpoints
│   │   │   ├── reviews/        # Review endpoints
│   │   │   ├── admin/          # Admin endpoints
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── register/       # User registration
│   │   │   ├── checkout/       # Stripe checkout
│   │   │   └── webhooks/       # Stripe webhooks
│   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page (product grid)
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Product detail page
│   │   ├── cart/               # Cart page
│   │   ├── wishlist/           # Wishlist page
│   │   ├── checkout/           # Checkout page
│   │   ├── orders/             # Order history
│   │   ├── account/            # User account page
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components (Radix)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx       # Status badges
│   │   │   ├── switch.tsx      # Toggle switch
│   │   │   ├── toast.tsx       # Toast component
│   │   │   └── toaster.tsx     # Toast container
│   │   ├── header.tsx          # Navigation header
│   │   ├── product-card.tsx    # Product display card
│   │   ├── product-grid.tsx    # Product grid with search/filter
│   │   ├── product-reviews.tsx # Review system component
│   │   ├── star-rating.tsx     # Star rating display
│   │   ├── WishlistButton.tsx  # Wishlist toggle button
│   │   ├── checkout-form.tsx   # Checkout form with validation
│   │   └── providers.tsx       # Query client provider
│   ├── hooks/                  # Custom React hooks
│   │   └── use-toast.ts        # Toast notification hook
│   ├── store/                  # Zustand stores
│   │   └── cart.ts             # Cart state management
│   ├── lib/                    # Utilities and API
│   │   ├── api.ts              # API client functions
│   │   ├── prisma.ts           # Prisma client
│   │   └── utils.ts            # Helper functions
│   ├── types/                  # TypeScript types
│   │   └── index.ts            # Shared type definitions
│   └── auth.ts                 # NextAuth configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 🎯 Key Implementation Details

### Authentication & Authorization

Complete authentication system using NextAuth.js:

- Email/password authentication
- Role-based access control (CUSTOMER, ADMIN, SUPER_ADMIN)
- Protected routes and API endpoints
- Session management
- Admin invite system

### Wishlist System

Save favorite products for later:

- Add/remove products from wishlist
- Persistent storage per user
- Wishlist count badge in header
- Quick access wishlist button on product cards
- Empty state with helpful messaging

### Product Reviews & Ratings

Verified purchaser review system:

- **Only customers who purchased and received products can review**
- 5-star rating system with averages
- Written reviews with edit/delete capabilities
- Verified purchaser badges
- Review count display on products
- Frontend and backend validation

### Admin Dashboard

Comprehensive store management:

- **Analytics**: Revenue trends, customer metrics, product performance
- **Order Management**: View, filter, and update order statuses
- **Product Management**: CRUD operations for products
- **Settings**: Store configuration and feature toggles
- Role-based access with protected routes

### Stripe Integration

Secure payment processing:

- Stripe Checkout sessions
- Payment intent creation
- Webhook handling for order confirmation
- Automatic stock updates on successful payment
- Payment status tracking

### React Suspense

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
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio GUI

## 🔐 Security Features

- Password hashing with bcrypt
- NextAuth.js session management
- Protected API routes with middleware
- Role-based access control
- CSRF protection
- SQL injection prevention (Prisma ORM)
- XSS protection
- Stripe secure payment handling
- Environment variable protection

## 🌟 Best Practices Implemented

- **TypeScript**: Full type safety across the stack
- **Code Organization**: Clean separation of concerns
- **API Design**: RESTful endpoints with proper HTTP methods
- **Error Handling**: Comprehensive error handling and validation
- **Loading States**: Proper loading and error states
- **Responsive Design**: Mobile-first approach with Tailwind
- **Accessibility**: Radix UI for accessible components
- **Performance**: Query caching with TanStack Query
- **Database**: Proper indexing and relationships
- **Git Commits**: Semantic commit messages

## 🔮 Future Enhancements

Following the 2026 Web Development roadmap, consider adding:

- **Email Notifications** - Order confirmations, shipping updates
- **Product Images Gallery** - Multiple images per product
- **Product Variants** - Size, color options
- **Inventory Management** - Stock alerts, reorder points
- **Shipping Integration** - Real-time shipping rates
- **Discount Codes** - Coupon system
- **Product Recommendations** - AI-based suggestions
- **Social Authentication** - Google, GitHub login
- **PWA Support** - Offline functionality
- **Real-time Updates** - WebSocket for order status
- **Advanced Search** - Elasticsearch integration
- **Multi-language** - i18n support

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Stripe Documentation](https://stripe.com/docs)
- [Radix UI](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form](https://react-hook-form.com/get-started)
- [Zod](https://zod.dev)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 📧 Support

For questions and support, please open an issue in the GitHub repository.

---

Built with ❤️ using modern web technologies for 2026 and beyond!

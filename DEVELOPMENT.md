# E-Commerce MVP - Development Guide

## 🚀 Quick Start

### Development (Local)

**Use this for daily development with hot reload:**

```bash
# 1. Install dependencies
npm install

# 2. Setup database (first time only)
npm run dev:setup

# 3. Start development server
npm run dev
```

**Access:**

- Application: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- Prisma Studio: `npm run db:studio`

---

### Production (Docker)

**Use this for testing production build or deployment:**

```bash
# Build and start containers
npm run docker:rebuild

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

**Access:**

- Application: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- PostgreSQL: localhost:5433

---

## 📋 Available Scripts

### Development

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start Next.js development server         |
| `npm run build`     | Create production build                  |
| `npm run start`     | Start production server                  |
| `npm run lint`      | Run ESLint                               |
| `npm run dev:setup` | Setup database (generate, migrate, seed) |

### Database

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `npm run db:generate` | Generate Prisma Client         |
| `npm run db:migrate`  | Run database migrations        |
| `npm run db:push`     | Push schema changes (dev only) |
| `npm run db:seed`     | Seed database with sample data |
| `npm run db:studio`   | Open Prisma Studio (GUI)       |

### Docker

| Command                  | Description                    |
| ------------------------ | ------------------------------ |
| `npm run docker:build`   | Build Docker images            |
| `npm run docker:up`      | Start containers               |
| `npm run docker:down`    | Stop containers                |
| `npm run docker:logs`    | View application logs          |
| `npm run docker:restart` | Restart app container          |
| `npm run docker:rebuild` | Rebuild and restart everything |
| `npm run docker:clean`   | Stop and remove volumes        |

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/ecommerce_db?schema=public"

# Next.js
NODE_ENV="development"
```

### Database Ports

- **Local PostgreSQL**: 5432
- **Docker PostgreSQL**: 5433 (mapped to 5432 inside container)

---

## 🏗️ Project Structure

```
e-commerce/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard
│   │   │   ├── page.tsx        # Product management table
│   │   │   └── products/
│   │   │       ├── new/        # Create product form
│   │   │       └── [id]/edit/  # Edit product form
│   │   ├── api/                # API routes
│   │   │   └── products/       # Product CRUD endpoints
│   │   ├── cart/               # Shopping cart
│   │   ├── products/           # Product listing
│   │   └── layout.tsx
│   ├── components/             # Reusable components
│   ├── lib/                    # Utilities (Prisma, etc.)
│   └── store/                  # Zustand state management
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed script
│   └── migrations/             # Migration history
├── Dockerfile                  # Multi-stage Docker build
└── docker-compose.yml          # Container orchestration
```

---

## 🎯 Recommended Workflow

### For Development (Daily Work)

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Open admin panel:**

   - Navigate to http://localhost:3000/admin
   - Manage products with full CRUD operations

3. **Database changes:**
   ```bash
   # Make changes to schema.prisma
   npm run db:migrate  # Creates migration
   npm run db:generate # Updates Prisma Client
   ```

### For Production Testing

1. **Stop local dev server** (if running)

2. **Rebuild Docker:**

   ```bash
   npm run docker:rebuild
   ```

3. **Check logs:**

   ```bash
   npm run docker:logs
   ```

4. **Clean up:**
   ```bash
   npm run docker:down
   ```

---

## 🐛 Troubleshooting

### Port Conflicts

**Error:** Port 3000 already in use

**Solution:**

```bash
# Stop local dev server OR stop Docker
npm run docker:down
```

### Database Connection Issues

**Error:** Cannot connect to database

**Solution:**

```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart postgres
```

### Admin Panel 404

**Cause:** Docker doesn't have latest code

**Solution:**

```bash
# Rebuild Docker image
npm run docker:rebuild
```

---

## 📦 Technologies

- **Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript 5.7.2
- **Database:** PostgreSQL 16 + Prisma ORM 7.2.0
- **State:** Zustand + TanStack Query v5
- **UI:** Tailwind CSS + Radix UI
- **Forms:** React Hook Form + Zod
- **Deployment:** Docker + Docker Compose

---

## 🔐 Admin Features

### Product Management

- ✅ View all products in table format
- ✅ Create new products with validation
- ✅ Edit existing products
- ✅ Delete products with confirmation
- ✅ Real-time updates with TanStack Query
- ✅ Toast notifications for all actions
- ✅ Color-coded stock indicators

### API Endpoints

- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

---

## 📝 Notes

- **Development:** Use local dev server for fast iteration
- **Docker:** Use for production testing or deployment
- **Never run both simultaneously** - causes port conflicts
- **Database seeding:** Run `npm run db:seed` after migrations

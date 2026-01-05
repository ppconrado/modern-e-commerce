# 🚀 Production Deployment Guide - Vercel + Neon

> **✅ Tested and Working:** This guide contains the exact steps that successfully deployed the application to production.

## 📋 Overview

Deploy the e-commerce application to production using:

- **Vercel** - Frontend & Backend hosting (Next.js) - Free tier: 100GB bandwidth
- **Neon** - PostgreSQL Database - Free tier: 0.5GB storage
- **Cloudinary** - Image Storage - Free tier: 25GB/month
- **Stripe** - Payment Processing (test keys initially)
- **Resend** - Email Service (optional, console logging if not configured)

**⏱️ Time to Deploy:** ~15 minutes

---

## 🎯 Quick Start Deployment

### Step 1: Create Neon Database (3 minutes)

1. Go to https://console.neon.tech/
2. Sign up/Login (can use GitHub)
3. Click **"Create Project"**
4. Configure:
   - **Name**: `ecommerce-production`
   - **Region**: Choose closest to your users (e.g., `US East (Ohio)` or `São Paulo`)
5. Click **"Create Project"**
6. **COPY** the connection string shown (starts with `postgresql://`)

**⚠️ CRITICAL:** The connection string format you'll see is:

```
psql 'postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require'
```

**For Vercel, you MUST use ONLY:**

```
postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

**Remove:**

- ❌ `psql '` from the beginning
- ❌ `'` from the end
- ❌ `&channel_binding=require` from the end

---

### Step 2: Deploy to Vercel (5 minutes)

1. Go to https://vercel.com/
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. **Import** your GitHub repository
5. Vercel will auto-detect Next.js - Click **"Deploy"**
6. Wait ~2 minutes for initial build (it will fail - that's expected, we need env vars)

---

### Step 3: Configure Environment Variables (5 minutes)

1. Go to **Settings** → **Environment Variables**
2. Add each variable below one by one:

#### Database (Required)

```bash
Name: DATABASE_URL
Value: postgresql://your-user:your-password@ep-xxx.neon.tech/neondb?sslmode=require
Environment: ✓ Production ✓ Preview ✓ Development
```

#### Authentication (Required)

```bash
Name: AUTH_SECRET
Value: [Generate below]
Environment: ✓ Production ✓ Preview ✓ Development
```

To generate AUTH_SECRET, run in terminal:

```bash
# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Mac/Linux
openssl rand -base64 32
```

```bash
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
Environment: ✓ Production (only)
```

#### Stripe (Required - Use Test Keys Initially)

```bash
Name: STRIPE_SECRET_KEY
Value: sk_test_your_stripe_secret_key
Environment: ✓ Production ✓ Preview ✓ Development

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_your_stripe_publishable_key
Environment: ✓ Production ✓ Preview ✓ Development

Name: STRIPE_WEBHOOK_SECRET
Value: whsec_your_webhook_secret
Environment: ✓ Production ✓ Preview ✓ Development
```

Get Stripe keys from: https://dashboard.stripe.com/test/apikeys

#### Cloudinary (Required)

```bash
Name: CLOUDINARY_CLOUD_NAME
Value: your_cloud_name
Environment: ✓ Production ✓ Preview ✓ Development

Name: CLOUDINARY_API_KEY
Value: your_api_key
Environment: ✓ Production ✓ Preview ✓ Development

Name: CLOUDINARY_API_SECRET
Value: your_api_secret
Environment: ✓ Production ✓ Preview ✓ Development
```

Get from: https://console.cloudinary.com/

#### Email (Optional)

```bash
Name: EMAIL_FROM
Value: onboarding@resend.dev
Environment: ✓ Production ✓ Preview ✓ Development

# RESEND_API_KEY is optional - emails will log to console if not set
```

---

### Step 4: Redeploy Application (2 minutes)

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Wait ~2 minutes for build to complete
5. Build should succeed now

---

### Step 5: Run Database Migrations (3 minutes)

Now we need to create the database tables. Run these commands locally:

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link your project
vercel link --yes

# 4. Set DATABASE_URL for migration
# Windows PowerShell:
$env:DATABASE_URL = "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Mac/Linux:
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# 5. Run migrations
npx prisma migrate deploy

# 6. Seed database with initial data (products, test users)
npx tsx prisma/seed.ts
```

**Expected output:**

```
✔ Generated Prisma Client
10 migrations found
Applying migration `20251228211420_init`
...
All migrations have been successfully applied.

Start seeding...
Created product: Wireless Headphones
Created product: Smart Watch
...
Seeding finished.
```

---

### Step 6: Test Your Application (2 minutes)

1. Open your Vercel URL: `https://your-app-name.vercel.app`
2. You should see:
   - ✅ Homepage with products
   - ✅ Images loading from Cloudinary
   - ✅ Login/Register working

**Test Login:**

- Email: `test@test.com`
- Password: `Test@123`

---

## ✅ Deployment Checklist

Use this to track your progress:

### Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] Local development working
- [ ] All tests passing

### Neon Database

- [ ] Created Neon account
- [ ] Created project
- [ ] Copied connection string (removed `psql '`, `'`, and `&channel_binding=require`)

### Vercel Setup

- [ ] Created Vercel account
- [ ] Imported GitHub repository
- [ ] Added all environment variables:
  - [ ] DATABASE_URL (without psql, without channel_binding)
  - [ ] AUTH_SECRET (generated)
  - [ ] NEXTAUTH_URL (your Vercel URL)
  - [ ] STRIPE_SECRET_KEY
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - [ ] STRIPE_WEBHOOK_SECRET
  - [ ] CLOUDINARY_CLOUD_NAME
  - [ ] CLOUDINARY_API_KEY
  - [ ] CLOUDINARY_API_SECRET
  - [ ] EMAIL_FROM
- [ ] Redeployed after adding variables

### Database Migration

- [ ] Installed Vercel CLI
- [ ] Linked project: `vercel link`
- [ ] Set DATABASE_URL locally
- [ ] Ran: `npx prisma migrate deploy`
- [ ] Ran: `npx tsx prisma/seed.ts`

### Testing

- [ ] Homepage loads
- [ ] Products display
- [ ] Images load
- [ ] Can register
- [ ] Can login
- [ ] Cart works
- [ ] Admin dashboard accessible (first user is SUPER_ADMIN)

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**

1. Check DATABASE_URL in Vercel Settings
2. Ensure it does NOT have:
   - `psql '` at the beginning
   - `'` at the end
   - `&channel_binding=require` at the end
3. Should be: `postgresql://user:pass@host/db?sslmode=require`
4. Redeploy after fixing

### Issue: "No products showing"

**Solution:**

```bash
# Seed the database
$env:DATABASE_URL = "your-neon-url"
npx tsx prisma/seed.ts
```

### Issue: "Authentication not working"

**Solution:**

1. Check AUTH_SECRET is set in Vercel
2. Check NEXTAUTH_URL matches your Vercel domain exactly
3. Redeploy

### Issue: "Images not uploading"

**Solution:**

1. Verify Cloudinary credentials in Vercel
2. Check console for specific errors
3. Ensure CLOUDINARY_API_SECRET is correct

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
vercel logs your-app-name --follow
```

Or via web: Vercel Dashboard → Your Project → Deployments → Click deployment → Logs

### Database Management

Access your Neon database:

```bash
# Via Neon Console
https://console.neon.tech/ → Your Project → SQL Editor

# Via Prisma Studio (local)
$env:DATABASE_URL = "your-neon-url"
npx prisma studio
```

### Update Environment Variables

1. Vercel Dashboard → Settings → Environment Variables
2. Edit variable → Save
3. Go to Deployments → Redeploy

---

## 🚀 Upgrading to Production (When Ready)

### Stripe Live Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Toggle to "Live" mode
3. Copy live keys
4. Update in Vercel:
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
5. Create webhook for `https://your-app.vercel.app/api/webhooks/stripe`
6. Update `STRIPE_WEBHOOK_SECRET`
7. Redeploy

### Resend Email (Optional)

1. Go to https://resend.com/
2. Create account
3. Get API key
4. Add to Vercel:
   - `RESEND_API_KEY` = `re_...`
   - `EMAIL_FROM` = `noreply@yourdomain.com` (requires domain verification)
5. Redeploy

### Custom Domain

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Redeploy

---

## 📝 Environment Variables Reference

| Variable                             | Required    | Description                | Example                                          |
| ------------------------------------ | ----------- | -------------------------- | ------------------------------------------------ |
| `DATABASE_URL`                       | ✅ Yes      | Neon PostgreSQL connection | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET`                        | ✅ Yes      | NextAuth JWT secret        | Generated with `openssl rand -base64 32`         |
| `NEXTAUTH_URL`                       | ✅ Yes      | Your app URL               | `https://your-app.vercel.app`                    |
| `STRIPE_SECRET_KEY`                  | ✅ Yes      | Stripe secret key          | `sk_test_...` or `sk_live_...`                   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes      | Stripe public key          | `pk_test_...` or `pk_live_...`                   |
| `STRIPE_WEBHOOK_SECRET`              | ✅ Yes      | Stripe webhook secret      | `whsec_...`                                      |
| `CLOUDINARY_CLOUD_NAME`              | ✅ Yes      | Cloudinary cloud name      | Your cloud name                                  |
| `CLOUDINARY_API_KEY`                 | ✅ Yes      | Cloudinary API key         | Your API key                                     |
| `CLOUDINARY_API_SECRET`              | ✅ Yes      | Cloudinary API secret      | Your API secret                                  |
| `EMAIL_FROM`                         | ⚠️ Optional | Email sender address       | `onboarding@resend.dev`                          |
| `RESEND_API_KEY`                     | ❌ Optional | Resend API key             | `re_...`                                         |

---

## 🎉 Success!

Your e-commerce application is now live in production!

**What you have:**

- ✅ Fully functional e-commerce platform
- ✅ Secure authentication
- ✅ Payment processing (Stripe)
- ✅ Image uploads (Cloudinary)
- ✅ Admin dashboard
- ✅ Order management
- ✅ Product reviews
- ✅ Wishlist functionality

**Next steps:**

1. Test all functionality thoroughly
2. Create real products
3. Configure Stripe webhook for production
4. Add custom domain (optional)
5. Enable Vercel Analytics
6. Monitor errors in Vercel logs

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

**Need Help?**

- Check Vercel logs: Dashboard → Deployments → Logs
- Check Neon monitoring: Dashboard → Monitoring
- Review this guide's "Common Issues & Solutions" section

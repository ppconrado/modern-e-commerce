# Production Deployment Guide - Vercel + Neon

## 📋 Overview

This guide covers deploying the e-commerce application to production using:

- **Vercel** - Frontend & Backend (Next.js)
- **Neon** - PostgreSQL Database
- **Cloudinary** - Image Storage (already configured)
- **Resend** - Email Service (already configured)

---

## 🎯 Prerequisites

- [x] GitHub account
- [x] Vercel account (free) - [vercel.com](https://vercel.com)
- [x] Neon account (free) - [neon.tech](https://neon.tech)
- [x] Cloudinary credentials (already have)
- [x] Resend API key (already have)

---

## 📦 Step 1: Prepare Project for Production

### 1.1 Update package.json Build Scripts

Add Prisma generation to build process:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

### 1.2 Create Production Environment File

Create `.env.production.example`:

```bash
# Database - Will be provided by Neon
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# Next.js
NEXT_PUBLIC_API_URL="https://your-app.vercel.app"

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_production_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_production_key"
STRIPE_WEBHOOK_SECRET="whsec_production_webhook_secret"

# Cloudinary (same as local)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Resend
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

### 1.3 Create vercel.json Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "prisma generate && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**": {
      "maxDuration": 10
    }
  }
}
```

### 1.4 Verify .gitignore

Make sure these are in `.gitignore`:

```
.env
.env.local
.env.production
node_modules
.next
```

### 1.5 Commit and Push Changes

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## 🗄️ Step 2: Setup Neon Database

### 2.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended)
3. No credit card required

### 2.2 Create Database Project

1. Click **"Create Project"**
2. Project settings:
   - **Name**: `ecommerce-production`
   - **Region**: Choose closest to your users (e.g., `US East (N. Virginia)` for US)
   - **PostgreSQL Version**: `16` (latest stable)
3. Click **"Create Project"**

### 2.3 Get Connection String

After project creation:

1. Go to **Dashboard** → **Connection Details**
2. Copy the **Connection String**
3. It looks like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

**Important:** Save this connection string - you'll need it for Vercel!

### 2.4 Test Connection (Optional)

Test locally before deployment:

```bash
# Temporarily use Neon database
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" npx prisma db push

# Verify connection
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" npx prisma studio
```

---

## 🚀 Step 3: Deploy to Vercel

### 3.1 Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository: `ppconrado/modern-e-commerce`
5. Vercel auto-detects Next.js - Click **"Import"**

### 3.2 Configure Environment Variables

**Before deploying**, add all environment variables:

1. In Vercel project settings, go to **"Environment Variables"**
2. Add each variable:

#### Database

```
DATABASE_URL = postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

#### Next.js

```
NEXT_PUBLIC_API_URL = https://your-project.vercel.app
```

_Note: Replace `your-project` with actual Vercel domain_

#### NextAuth

```bash
# Generate secure secret first:
# Run locally: openssl rand -base64 32
AUTH_SECRET = [paste generated secret here]
NEXTAUTH_URL = https://your-project.vercel.app
```

#### Stripe

```
STRIPE_SECRET_KEY = sk_live_your_production_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_your_production_key
STRIPE_WEBHOOK_SECRET = whsec_production_webhook_secret
```

_Note: Use production keys, not test keys_

#### Cloudinary

```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

#### Resend

```
RESEND_API_KEY = re_xxxxxxxxxxxx
EMAIL_FROM = noreply@yourdomain.com
```

### 3.3 Deploy

1. After adding all variables, click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Run `prisma generate`
   - Build Next.js app
   - Deploy to global CDN
3. Wait 2-3 minutes for first deployment

---

## 🔧 Step 4: Database Migration

### 4.1 Run Migrations in Production

After successful Vercel deployment, migrate database:

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull production environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma studio
```

**Option B: Direct Connection (Alternative)**

```bash
# Use Neon connection string directly
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
```

### 4.2 Seed Production Database (Optional)

Add initial data (first admin user, sample products):

```bash
# Using .env.production
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" npm run db:seed
```

**Alternative: Create admin via app**

1. Go to `https://your-app.vercel.app/register`
2. First user automatically becomes SUPER_ADMIN
3. Login and verify admin dashboard access

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Application Health

Visit your Vercel URL: `https://your-project.vercel.app`

**Test checklist:**

- [ ] Homepage loads correctly
- [ ] Products display with images from Cloudinary
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Admin user can access `/admin` dashboard
- [ ] Can add products to cart
- [ ] Images upload works (admin panel)

### 5.2 Check Database Connection

```bash
# From Vercel deployment logs
# Should see: "✓ Prisma Client generated successfully"
```

### 5.3 Test Email Service

1. Login as SUPER_ADMIN
2. Go to `/admin/users`
3. Create invite
4. Check email inbox (should receive invite email)

### 5.4 Check Vercel Logs

If something fails:

1. Go to Vercel Dashboard → **Deployments**
2. Click latest deployment
3. Check **Logs** tab for errors
4. Common issues:
   - Missing environment variables
   - Database connection errors
   - Prisma generation errors

---

## 🔄 Step 6: Setup Continuous Deployment

### 6.1 Automatic Deployments

Vercel automatically deploys on every push to `main`:

```bash
# Make a change
git add .
git commit -m "feat: add new feature"
git push origin main

# Vercel deploys automatically (1-2 minutes)
```

### 6.2 Preview Deployments

For pull requests:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and push
git push origin feature/new-feature

# Create PR on GitHub
# Vercel creates preview deployment automatically
# URL: https://your-project-git-feature-branch.vercel.app
```

### 6.3 Production vs Preview

- **Production**: `main` branch → `your-project.vercel.app`
- **Preview**: Other branches → `your-project-git-branch.vercel.app`

---

## 🎛️ Step 7: Configure Stripe Webhooks (Production)

### 7.1 Get Vercel Production URL

Your webhook URL: `https://your-project.vercel.app/api/webhooks/stripe`

### 7.2 Setup Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter URL: `https://your-project.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copy **Signing Secret** (starts with `whsec_`)
6. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_production_secret
   ```

### 7.3 Redeploy

```bash
# Trigger redeployment to pick up new env var
vercel --prod
```

---

## 🔐 Step 8: Security Checklist

### 8.1 Environment Variables

- [ ] `AUTH_SECRET` is random and secure (32+ characters)
- [ ] `DATABASE_URL` has `?sslmode=require`
- [ ] All secrets are in Vercel env vars, NOT in code
- [ ] `.env` is in `.gitignore`

### 8.2 Authentication

- [ ] NEXTAUTH_URL matches production domain
- [ ] First user tested as SUPER_ADMIN
- [ ] Admin routes protected (test `/admin` logged out)

### 8.3 Database

- [ ] Neon database has SSL enabled
- [ ] Connection pooling enabled (default in Neon)
- [ ] No public IP exposure

### 8.4 API Security

- [ ] API routes check authentication
- [ ] Admin routes check SUPER_ADMIN role
- [ ] CORS properly configured (Next.js default is secure)

---

## 📊 Step 9: Monitoring & Maintenance

### 9.1 Vercel Analytics

Free tier includes:

- Real-time visitors
- Page performance metrics
- Core Web Vitals

Enable in Vercel Dashboard → **Analytics**

### 9.2 Neon Monitoring

Check database health:

1. Go to Neon Dashboard
2. **Monitoring** tab shows:
   - Active connections
   - Storage usage
   - Query performance

### 9.3 Error Tracking (Optional)

Add Sentry for error monitoring:

```bash
npm install @sentry/nextjs

# Follow setup wizard
npx @sentry/wizard@latest -i nextjs
```

---

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"

**Solution:**

```bash
# Add to package.json
"postinstall": "prisma generate"

# Redeploy
git commit -m "fix: add prisma postinstall hook"
git push
```

### Error: "Database connection failed"

**Check:**

1. DATABASE_URL has `?sslmode=require`
2. Neon database is active (not paused)
3. Connection string is correct
4. No typos in environment variable

**Test connection:**

```bash
DATABASE_URL="..." npx prisma db pull
```

### Error: "NEXTAUTH_URL not set"

**Solution:**

```bash
# Add to Vercel environment variables
NEXTAUTH_URL = https://your-project.vercel.app

# Redeploy
vercel --prod
```

### Error: "Images not loading"

**Check:**

1. Cloudinary credentials correct
2. Images uploaded to Cloudinary
3. `NEXT_PUBLIC_` prefix for client-side variables
4. Network tab shows 200 status for images

### Deployment Fails

**Check build logs:**

1. Vercel Dashboard → Deployments
2. Click failed deployment
3. Check "Build Logs" tab
4. Common issues:
   - TypeScript errors
   - Missing dependencies
   - Environment variables missing

---

## 📈 Scaling Considerations

### Free Tier Limits

**Vercel:**

- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Serverless functions: 100 GB-hours

**Neon:**

- ✅ 0.5 GB storage
- ✅ 1 project
- ✅ 10 branches

**When to upgrade:**

- Vercel: > 100 GB bandwidth → Pro ($20/month)
- Neon: > 0.5 GB data → Scale ($19/month)

### Performance Optimization

1. **Enable Vercel Edge Functions** (auto-enabled)
2. **Database connection pooling** (enabled in Neon)
3. **Image optimization** (Cloudinary handles this)
4. **Caching**:
   ```tsx
   // Add to API routes
   export const revalidate = 60; // Cache for 60 seconds
   ```

---

## 🔄 Backup Strategy

### Database Backups

**Neon automatic backups:**

- Daily backups (last 7 days on free tier)
- Point-in-time restore available

**Manual backup:**

```bash
# Export database
DATABASE_URL="..." npx prisma db pull
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Code Backups

- GitHub repository is your backup
- Vercel keeps deployment history
- Can rollback any deployment in Vercel Dashboard

---

## 📝 Post-Deployment Checklist

- [ ] Application accessible at production URL
- [ ] Database migrations completed
- [ ] First admin user created
- [ ] All features tested:
  - [ ] User registration/login
  - [ ] Product browsing
  - [ ] Add to cart
  - [ ] Admin dashboard
  - [ ] Image upload
  - [ ] Email sending
- [ ] Environment variables configured
- [ ] Stripe webhooks setup
- [ ] Custom domain configured (if applicable)
- [ ] SSL/HTTPS working (automatic in Vercel)
- [ ] Analytics enabled
- [ ] Monitoring setup

---

## 🌐 Custom Domain (Optional)

### Add Custom Domain

1. Vercel Dashboard → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `example.com`
4. Follow DNS configuration instructions
5. Vercel provisions SSL automatically

### Update Environment Variables

After adding domain:

```bash
NEXTAUTH_URL = https://example.com
NEXT_PUBLIC_API_URL = https://example.com
```

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma Production**: https://www.prisma.io/docs/guides/deployment

---

## ✅ Summary

**Total deployment time: ~30 minutes**

1. ✅ Prepare project (5 min)
2. ✅ Setup Neon database (5 min)
3. ✅ Deploy to Vercel (10 min)
4. ✅ Run migrations (5 min)
5. ✅ Verify & test (5 min)

**Cost: $0/month** for free tier limits!

**Next steps:**

- Monitor usage in Vercel/Neon dashboards
- Add custom domain
- Enable analytics
- Setup error tracking (Sentry)
- Plan for scaling when needed

---

**Status:** Ready for production! 🚀
**Updated:** January 2026

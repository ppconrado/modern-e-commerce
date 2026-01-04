# 🚀 Quick Deployment Checklist

Use this checklist to track your deployment progress.

## ☑️ Pre-Deployment

- [ ] Code is working locally
- [ ] All tests passing
- [ ] Code pushed to GitHub
- [ ] `.env` is in `.gitignore`
- [ ] `package.json` has `postinstall` script
- [ ] `vercel.json` created

## ☑️ Neon Database Setup

- [ ] Created Neon account at [neon.tech](https://neon.tech)
- [ ] Created project: `ecommerce-production`
- [ ] Copied connection string
- [ ] Tested connection locally (optional)

## ☑️ Vercel Deployment

- [ ] Created Vercel account at [vercel.com](https://vercel.com)
- [ ] Imported GitHub repository
- [ ] Added environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `AUTH_SECRET` (generated with `openssl rand -base64 32`)
  - [ ] `NEXTAUTH_URL`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM`
- [ ] Clicked "Deploy"
- [ ] Deployment successful

## ☑️ Database Migration

- [ ] Installed Vercel CLI: `npm i -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Linked project: `vercel link`
- [ ] Pulled env vars: `vercel env pull .env.production`
- [ ] Ran migrations: `npx prisma migrate deploy`
- [ ] Verified with Prisma Studio (optional)

## ☑️ Testing

- [ ] Homepage loads: `https://your-app.vercel.app`
- [ ] Products display correctly
- [ ] Images load from Cloudinary
- [ ] Can register new user
- [ ] Can login
- [ ] First user is SUPER_ADMIN
- [ ] Admin dashboard accessible
- [ ] Can upload images (admin)
- [ ] Cart functionality works
- [ ] Email service works (invite test)

## ☑️ Stripe Configuration

- [ ] Created Stripe webhook endpoint
- [ ] URL: `https://your-app.vercel.app/api/webhooks/stripe`
- [ ] Selected events: `checkout.session.completed`, `payment_intent.succeeded`
- [ ] Copied webhook secret
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Vercel
- [ ] Redeployed

## ☑️ Post-Deployment

- [ ] Checked Vercel logs for errors
- [ ] Checked Neon database connections
- [ ] Enabled Vercel Analytics
- [ ] Setup monitoring (optional)
- [ ] Added custom domain (optional)
- [ ] Updated DNS records (if custom domain)

## ☑️ Documentation

- [ ] Updated README with production URL
- [ ] Documented environment variables
- [ ] Created deployment notes

## 🎉 Done!

Your e-commerce application is now live in production!

**Production URL:** https://your-app.vercel.app

---

## 📝 Quick Commands

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Test build locally
npm run build

# Run migrations (with .env.production)
npx prisma migrate deploy

# Seed database (with .env.production)
npm run db:seed

# Deploy to Vercel
git push origin main  # Auto-deploys

# Manual deploy
vercel --prod
```

## 🆘 Help

If you encounter issues, check:

1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
2. Vercel logs - Dashboard → Deployments → Logs
3. Neon dashboard - Monitoring tab
4. Run helper script: `.\scripts\deploy-helper.ps1` (Windows) or `./scripts/deploy-helper.sh` (Mac/Linux)

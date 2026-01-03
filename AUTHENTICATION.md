# Authentication Implementation

## Overview

This project uses **NextAuth.js v5** (beta) for authentication with credentials-based login and a **professional admin invite system**.

## Features Implemented

### 1. User Authentication

- ✅ Registration with email, password, and full name
- ✅ Login with email and password
- ✅ Secure password hashing using bcryptjs (10 rounds)
- ✅ JWT-based session management
- ✅ Role-based access control (CUSTOMER/ADMIN/SUPER_ADMIN)
- ✅ **User account activation/deactivation** (soft delete)
- ✅ **Active user validation** on login

### 2. Professional Admin System

- ✅ **First user automatically becomes SUPER_ADMIN** (bootstrap)
- ✅ **Invite-only admin creation** (cannot register as admin publicly)
- ✅ Super admins can invite new ADMIN or SUPER_ADMIN users
- ✅ Invite tokens expire after 7 days
- ✅ Email-based invites (link provided, ready for email integration)
- ✅ One-time use invite links

### 3. Protected Routes

- ✅ Admin panel (`/admin/*`) requires ADMIN or SUPER_ADMIN role
- ✅ User management (`/admin/users`) requires SUPER_ADMIN only
- ✅ Server-side route protection (using Next.js layouts)
- ✅ Login redirect for unauthenticated users
- ✅ Role-based access restrictions

### 4. UI Components

- ✅ Login page with email/password form
- ✅ Registration page (creates CUSTOMER or SUPER_ADMIN if first user)
- ✅ User management page (`/admin/users`) for SUPER_ADMIN
- ✅ Invite creation interface with copy-to-clipboard
- ✅ Invite acceptance page (`/admin/accept-invite`)
- ✅ Role badges in header (SUPER ADMIN / ADMIN)
- ✅ Sign in/Sign up buttons in header (when logged out)
- ✅ User name display and sign out button (when logged in)
- ✅ Admin link in header (ADMIN + SUPER_ADMIN)
- ✅ Users link in header (SUPER_ADMIN only)
- ✅ **User statistics table** (orders, spending, reviews)
- ✅ **Activate/Deactivate buttons** (SUPER_ADMIN only)
- ✅ **Status badges** (Active/Inactive)

### 5. Email Notifications

- ✅ **Admin invitation emails** (HTML template with invite link)
- ✅ **Account deactivation emails** (notification to user)
- ✅ **Account reactivation emails** (welcome back with sign-in link)
- ✅ **Resend integration** (production-ready)
- ✅ **Console logging mode** (development testing)
- ✅ **Professional HTML templates** (responsive, inline CSS)

## Test Credentials

### Super Admin (First User)

- **Email:** john@example.com
- **Password:** password123
- **Role:** SUPER_ADMIN
- **Access:**
  - Full admin panel access
  - User management
  - Create admin invites

### Regular Users

- **Email:** jane@example.com OR ppconrado@yahoo.com.br
- **Password:** password123
- **Role:** CUSTOMER
- **Access:** Regular shopping features only

## How to Test

### Test Bootstrap (First User = Super Admin)

1. **OPTIONAL:** Clear database to test first user flow
   ```bash
   docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_db -c 'DELETE FROM "User";'
   ```
2. Go to http://localhost:3000/register
3. Register with any email (e.g., admin@mystore.com)
4. You should become SUPER_ADMIN automatically
5. Login and verify "SUPER ADMIN" badge appears
6. Verify "Users" link appears in header

### Test Admin Invite System

**As SUPER_ADMIN:**

1. Login: john@example.com / password123
2. Click "Users" link in header
3. Go to http://localhost:3000/admin/users
4. Fill invite form:
   - Email: newadmin@example.com
   - Role: ADMIN or SUPER_ADMIN
5. Click "Create Invite"
6. Copy the invite link shown

**As Invited User:** 7. Open invite link in private/incognito window (or logout) 8. Fill in full name and password 9. Click "Create Admin Account" 10. Login with new admin credentials 11. Verify role badge and access level

### Test Role-Based Access

**SUPER_ADMIN (john@example.com):**

- ✅ Can access /admin
- ✅ Can access /admin/users
- ✅ "Users" link visible in header

**ADMIN (created via invite):**

- ✅ Can access /admin
- ❌ Cannot access /admin/users (redirects to /admin)
- ❌ "Users" link NOT visible

**CUSTOMER (jane@example.com):**

- ❌ Cannot access /admin (redirects to /)
- ❌ No admin links visible

### Test Login Flow

1. Go to http://localhost:3000/login
2. Enter email: john@example.com
3. Enter password: password123
4. Click "Sign in"
5. Header should show "John Doe" with "SUPER ADMIN" purple badge
6. "Admin" and "Users" links should appear

### Test Logout

1. Click "Sign out" button in header
2. Session should be cleared
3. You should be redirected to home page
4. Header should show "Sign in" and "Sign up" buttons

### Test User Deactivation (SUPER_ADMIN)

1. Login as SUPER_ADMIN (john@example.com)
2. Go to http://localhost:3000/admin/users
3. Find a CUSTOMER user in the table
4. Click "Deactivate" button (red button)
5. Confirm in dialog
6. **Check console** for deactivation email (dev mode)
7. Status badge should turn red "Inactive"
8. Logout and try to login with deactivated user → Should fail

### Test User Reactivation (SUPER_ADMIN)

1. Login as SUPER_ADMIN (john@example.com)
2. Go to http://localhost:3000/admin/users
3. Find an inactive user (red badge)
4. Click "Activate" button (green button)
5. Confirm in dialog
6. **Check console** for reactivation email (dev mode)
7. Status badge should turn green "Active"
8. User can now login again

### Test Email Service (Production)

**Setup:**

```bash
# 1. Create account at resend.com (free tier: 100 emails/day)
# 2. Get API key from dashboard
# 3. Add to .env:
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
# 4. Verify your domain in Resend
# 5. Restart dev server
```

**Testing:**

1. Create admin invite → Real email sent
2. Deactivate user → Real email sent
3. Reactivate user → Real email sent
4. Check Resend dashboard for delivery status

## Technical Implementation

### Database Schema

```prisma
model User {
  id        String   @id
  email     String   @unique
  fullName  String
  password  String   @default("")
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)  // Soft delete: false = deactivated
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  Order     Order[]
  Review    Review[]
  Address   Address[]
}

enum UserRole {
  CUSTOMER
  ADMIN
  SUPER_ADMIN
}
```

### API Endpoints

#### POST /api/register

Register a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "User Name"
}
```

**Response (201):**

```json
{
  "id": "cm...",
  "email": "user@example.com",
  "fullName": "User Name",
  "role": "CUSTOMER",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error (400):**

```json
{
  "error": "User already exists"
}
```

#### POST /api/auth/signin

Login endpoint (handled by NextAuth).

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Configuration Files

#### src/auth.ts

Main NextAuth configuration with:

- Credentials provider
- JWT callbacks for role and ID
- Session strategy
- Custom sign-in page

#### src/app/admin/layout.tsx

Server Component that protects `/admin` routes:

- Checks authentication
- Requires ADMIN or SUPER_ADMIN role
- Redirects to /login if not authenticated
- Redirects to / if wrong role

#### src/app/admin/users/layout.tsx

Server Component that protects `/admin/users` routes:

- Requires SUPER_ADMIN role only
- Redirects ADMIN users back to /admin
- Redirects unauthenticated users to /login

#### .env

Required environment variables:

```env
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/ecommerce_db?schema=public"

# Email Service (Optional - for production)
RESEND_API_KEY="re_xxxxxxxxxxxx"  # Get from resend.com
EMAIL_FROM="noreply@yourdomain.com"
```

## Security Considerations

### ✅ Implemented

- Passwords hashed with bcryptjs (10 rounds)
- JWT tokens for stateless authentication
- Three-tier role-based access control
- Server-side route protection (Next.js layouts)
- Invite-only admin creation
- Invite token expiration (7 days)
- One-time use invite tokens
- Secure session management
- **Soft delete pattern** (preserves data integrity)
- **Active user validation** on login
- **Email notifications** for security events
- **Self-deactivation prevention**

### 🔒 Production Recommendations

1. **Change NEXTAUTH_SECRET** to a strong random value
   - Generate with: `openssl rand -base64 32`
2. **Use HTTPS** in production
   - Set NEXTAUTH_URL to https://yourdomain.com
3. **Add email integration** for invite system
   - SendGrid, Resend, or AWS SES
4. **Add rate limiting** to prevent brute force attacks
5. **Add email verification** for new registrations
6. **Implement password strength requirements**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, symbols
7. **Add "forgot password" functionality**
8. **Implement 2FA** for super admin accounts
9. **Monitor failed login attempts**
10. **Implement account lockout** after multiple failed attempts
11. **Add audit logs** for admin actions

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth API handler
│   │   ├── register/
│   │   │   └── route.ts              # Registration endpoint (first user = SUPER_ADMIN)
│   │   └── admin/
│   │       ├── invite/
│   │       │   └── route.ts          # Create/list admin invites (SUPER_ADMIN only)
│   │       ├── accept-invite/
│   │       │   └── route.ts          # Accept invite and create admin account
│   │       └── users/
│   │           ├── route.ts          # List all users with statistics (SUPER_ADMIN only)
│   │           └── [id]/
│   │               └── route.ts      # Update user (role, isActive) (SUPER_ADMIN only)
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── register/
│   │   └── page.tsx                  # Registration page
│   └── admin/
│       ├── layout.tsx                # Route protection for ADMIN + SUPER_ADMIN
│       ├── page.tsx                  # Admin dashboard
│       ├── users/
│       │   ├── layout.tsx            # Additional protection (SUPER_ADMIN only)
│       │   └── page.tsx              # User management + invite system
│       └── accept-invite/
│           └── page.tsx              # Invite acceptance form
├── auth.ts                           # NextAuth configuration
├── lib/
│   └── email.ts                      # Email service (Resend integration + templates)
├── components/
│   ├── header.tsx                    # Updated with role badges + conditional links
│   └── providers.tsx                 # Added SessionProvider
└── types/
    └── next-auth.d.ts                # NextAuth type definitions (added role field)

prisma/
├── schema.prisma                     # Added AdminInvite model, UserRole enum
└── migrations/
    ├── add_auth_fields/
    └── add_super_admin_and_invites/
```

## API Endpoints

### POST /api/register

Create new user account. First user automatically becomes SUPER_ADMIN.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "fullName": "John Doe"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "role": "SUPER_ADMIN" // or "CUSTOMER"
}
```

### POST /api/auth/signin

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### POST /api/admin/invite

Create admin invite (SUPER_ADMIN only).

**Request:**

```json
{
  "email": "admin@example.com",
  "role": "ADMIN" // or "SUPER_ADMIN"
}
```

**Response:**

```json
{
  "inviteLink": "http://localhost:3000/admin/accept-invite?token=..."
}
```

### GET /api/admin/invite

List all invites (SUPER_ADMIN only).

**Response:**

```json
{
  "invites": [
    {
      "id": "...",
      "email": "admin@example.com",
      "role": "ADMIN",
      "createdAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2024-01-22T10:00:00Z",
      "usedAt": null
    }
  ]
}
```

### GET /api/admin/accept-invite?token=...

Validate invite token.

**Response:**

```json
{
  "valid": true,
  "invite": {
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### POST /api/admin/accept-invite

Accept invite and create admin account.

**Request:**

```json
{
  "token": "invite-token",
  "password": "secure-password",
  "fullName": "Admin User"
}
```

### GET /api/admin/users

List all users with statistics (SUPER_ADMIN only).

**Response:**

```json
[
  {
    "id": "...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "totalSpent": 1250.0,
    "orderCount": 5,
    "reviewCount": 3,
    "addressCount": 2
  }
]
```

### PATCH /api/admin/users/[id]

Update user role or activation status (SUPER_ADMIN only).

**Request:**

```json
{
  "role": "ADMIN", // Optional
  "isActive": false // Optional
}
```

**Response:**

```json
{
  "id": "...",
  "email": "user@example.com",
  "fullName": "User Name",
  "role": "ADMIN",
  "isActive": false,
  "updatedAt": "2026-01-03T..."
}
```

**Features:**

- Sends email notification on status change
- Prevents deactivating your own account
- Validates user exists
- Updates role if provided

## Common Issues & Solutions

### Issue: "NEXTAUTH_SECRET is not set"

**Solution:** Add `NEXTAUTH_SECRET` to your .env file

### Issue: Admin routes accessible without proper role

**Solution:** Verify that layouts are async Server Components and calling `auth()` correctly

### Issue: Login not working

**Solution:**

1. Verify database connection
2. Check that user exists with correct password hash
3. Verify NEXTAUTH_URL matches your current URL

### Issue: Session not persisting

**Solution:** Clear cookies and try again. Check that NEXTAUTH_URL is correct.

### Issue: First user not becoming SUPER_ADMIN

**Solution:**

1. Check database is empty before first registration
2. Verify Prisma migration applied (UserRole enum exists)
3. Check [register/route.ts](src/app/api/register/route.ts) has bootstrap logic

### Issue: Invite link not working

**Solution:**

1. Check token is valid and not expired (7 day limit)
2. Verify token hasn't been used already (check `usedAt` field)
3. Ensure AdminInvite model exists in database

## Next Steps

This authentication implementation is ready for development. For production:

1. Add email verification
2. Implement "forgot password" flow
3. Add 2FA for admin accounts
4. Set up rate limiting
5. Configure production secrets
6. Add monitoring and logging
7. Implement account recovery
8. Add OAuth providers (Google, GitHub, etc.)

---

**Status:** ✅ Feature #1 Complete - Ready for commit
**Next Feature:** Stripe Payment Integration

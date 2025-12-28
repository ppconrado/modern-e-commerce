# Feature #1: Authentication - Testing Checklist

## Pre-Testing Setup

- ✅ Database migration applied (added password and role fields)
- ✅ Existing users updated with passwords
- ✅ Prisma Client regenerated
- ✅ All TypeScript errors resolved
- ✅ NextAuth.js v5 configured
- ✅ Environment variables set

## Test Scenarios

### 1. Registration Flow

- [ ] Navigate to /register
- [ ] Fill form with new user data
- [ ] Submit form
- [ ] Verify redirect to /login
- [ ] Login with new credentials
- [ ] Verify user is logged in (name shows in header)
- [ ] Verify user role is CUSTOMER (no Admin link visible)

### 2. Login Flow - Admin

- [ ] Navigate to /login
- [ ] Enter email: john@example.com
- [ ] Enter password: password123
- [ ] Submit form
- [ ] Verify redirect to homepage
- [ ] Verify "John Doe" appears in header
- [ ] Verify "Admin" link appears in header
- [ ] Verify "Sign out" button appears

### 3. Login Flow - Regular User

- [ ] Navigate to /login
- [ ] Enter email: jane@example.com
- [ ] Enter password: password123
- [ ] Submit form
- [ ] Verify redirect to homepage
- [ ] Verify "Jane Doe" appears in header
- [ ] Verify NO "Admin" link in header
- [ ] Verify "Sign out" button appears

### 4. Admin Access Protection - Not Logged In

- [ ] Ensure you are logged out
- [ ] Navigate to /admin directly
- [ ] Verify redirect to /login
- [ ] Login as admin
- [ ] Verify redirect back to /admin

### 5. Admin Access Protection - Regular User

- [ ] Login as jane@example.com (CUSTOMER)
- [ ] Try to navigate to /admin
- [ ] Verify redirect to homepage (/)
- [ ] Verify cannot access admin panel

### 6. Admin Access - Admin User

- [ ] Login as john@example.com (ADMIN)
- [ ] Click "Admin" link in header
- [ ] Verify admin dashboard loads
- [ ] Verify can see product management table
- [ ] Verify can create new products
- [ ] Verify can edit products
- [ ] Verify can delete products

### 7. Logout Flow

- [ ] While logged in, click "Sign out"
- [ ] Verify redirect to homepage
- [ ] Verify header shows "Sign in" and "Sign up" buttons
- [ ] Verify "Admin" link removed (if was admin)
- [ ] Verify user name removed from header
- [ ] Try to access /admin
- [ ] Verify redirect to /login

### 8. Error Handling - Login

- [ ] Navigate to /login
- [ ] Enter invalid email
- [ ] Enter any password
- [ ] Submit form
- [ ] Verify error message: "Invalid email or password"
- [ ] Verify not logged in

### 9. Error Handling - Registration

- [ ] Navigate to /register
- [ ] Enter existing email (e.g., john@example.com)
- [ ] Fill other fields
- [ ] Submit form
- [ ] Verify error message: "User already exists"
- [ ] Verify user not created

### 10. Session Persistence

- [ ] Login as any user
- [ ] Navigate to different pages
- [ ] Verify session persists (user stays logged in)
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Close and reopen browser
- [ ] Verify session persists (depends on browser settings)

## Test Credentials Reference

### Admin Account

- **Email:** john@example.com
- **Password:** password123
- **Expected Role:** ADMIN
- **Expected Access:** Full admin panel

### Customer Accounts

1. **Jane's Account**

   - **Email:** jane@example.com
   - **Password:** password123
   - **Expected Role:** CUSTOMER
   - **Expected Access:** No admin panel

2. **Paulo's Account**
   - **Email:** ppconrado@yahoo.com.br
   - **Password:** password123
   - **Expected Role:** CUSTOMER
   - **Expected Access:** No admin panel

## Expected Behavior Summary

### Header (Logged Out)

```
ShopHub | Products | [Sign in] [Sign up] [Cart]
```

### Header (Logged In - Customer)

```
ShopHub | Products | 👤 Jane Doe [Sign out] [Cart]
```

### Header (Logged In - Admin)

```
ShopHub | Products | Admin | 👤 John Doe [Sign out] [Cart]
```

## Success Criteria

✅ All test scenarios pass
✅ No TypeScript errors
✅ No console errors
✅ Proper redirects working
✅ Role-based access control functioning
✅ Session management working
✅ Error messages displayed correctly
✅ UI updates based on auth state

## Known Limitations (To Address in Future)

- No email verification
- No password reset functionality
- No rate limiting on login attempts
- No 2FA
- Default password in .env (needs to be changed for production)
- No account lockout after failed attempts

## Next Steps After Testing

1. Test all scenarios
2. Fix any issues found
3. Update documentation if needed
4. Create git commit: `feat: add authentication with NextAuth.js v5`
5. Move to Feature #2: Stripe Payment Integration

---

**Date:** December 28, 2024
**Feature:** Authentication with NextAuth.js v5
**Status:** Ready for testing

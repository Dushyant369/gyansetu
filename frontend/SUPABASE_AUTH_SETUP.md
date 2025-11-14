# Supabase Auth Email Verification Setup Guide

This guide ensures email verification links redirect to your deployed Vercel domain instead of localhost.

## ✅ STEP 1 — Update Supabase Auth Redirect URLs

### In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**

2. **Site URL**: Set to your deployed URL:
   ```
   https://gyansetu-six.vercel.app
   ```

3. **Redirect URLs**: Add the following (remove all localhost entries unless needed for dev):
   ```
   https://gyansetu-six.vercel.app
   https://gyansetu-six.vercel.app/**
   https://gyansetu-six.vercel.app/auth/callback
   https://gyansetu-six.vercel.app/auth/confirm
   https://gyansetu-six.vercel.app/api/auth/callback
   ```

4. **Save** the changes

---

## ✅ STEP 2 — Set Environment Variables

### Local Development (`.env.local`)

Create or update `frontend/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application URL - for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Site URL (optional, for metadata)
NEXT_PUBLIC_SITE_URL=https://gyansetu-six.vercel.app
```

### Production (Vercel)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add/Update the following:
   ```
   NEXT_PUBLIC_APP_URL = https://gyansetu-six.vercel.app
   ```

3. **Redeploy** your application after adding the variable

---

## ✅ STEP 3 — Verify Code Updates

The following files have been updated to use `NEXT_PUBLIC_APP_URL`:

- ✅ `frontend/app/auth/sign-up/page.tsx` - Uses env var for email redirect
- ✅ `frontend/app/auth/sign-up-success/page.tsx` - Uses env var for resend email redirect
- ✅ `frontend/app/auth/callback/route.ts` - Handles email verification callback

The code now uses:
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
const redirectUrl = `${appUrl}/auth/callback`
```

This ensures:
- **Production**: Uses `https://gyansetu-six.vercel.app`
- **Local Dev**: Falls back to `window.location.origin` (localhost:3000)

---

## ✅ STEP 4 — Clear Supabase Redirect Cache (If Needed)

If Supabase still redirects to localhost, run this SQL in **Supabase SQL Editor**:

```sql
-- Clear cached redirect URLs (if needed)
-- Note: This is usually not necessary, but can help if redirects are cached
```

Then re-add ONLY the deployed domain URLs in the Supabase Dashboard (Step 1).

---

## 🎯 Expected Outcome

After completing these steps:

- ✅ All verification emails redirect to: `https://gyansetu-six.vercel.app/auth/callback`
- ✅ No users are sent to localhost when signing up in production
- ✅ Login/signup flows work correctly in both dev & production
- ✅ Email verification links work properly

---

## 🔍 Testing

1. **Test in Production**:
   - Sign up with a new email
   - Check the verification email
   - Verify the link points to `https://gyansetu-six.vercel.app/auth/callback`

2. **Test in Local Dev**:
   - Sign up with a new email
   - Check the verification email
   - Verify the link points to `http://localhost:3000/auth/callback`

---

## 📝 Notes

- The `NEXT_PUBLIC_APP_URL` environment variable is used at build time and runtime
- If the variable is not set, the code falls back to `window.location.origin` for client-side code
- Make sure to redeploy on Vercel after adding environment variables
- The callback route (`/auth/callback`) handles the email verification automatically

---

## 🐛 Troubleshooting

**Issue**: Emails still redirect to localhost
- **Solution**: Double-check Supabase Dashboard → Authentication → URL Configuration
- Ensure `NEXT_PUBLIC_APP_URL` is set in Vercel and the app is redeployed

**Issue**: Environment variable not working
- **Solution**: Restart your local dev server after updating `.env.local`
- For Vercel: Ensure variable is added and app is redeployed

**Issue**: Callback route not working
- **Solution**: Verify `/auth/callback/route.ts` exists and is properly configured


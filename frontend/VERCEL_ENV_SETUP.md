# Vercel Environment Variables Setup

## Required Environment Variables

Add these in **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

### Production Environment

```
NEXT_PUBLIC_APP_URL=https://gyansetu-six.vercel.app
NEXT_PUBLIC_SITE_URL=https://gyansetu-six.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Preview Environment (Optional)

```
NEXT_PUBLIC_APP_URL=https://your-preview-url.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-preview-url.vercel.app
```

### Development Environment (Optional - for Vercel CLI)

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

1. **After adding variables, redeploy your application**
2. **`NEXT_PUBLIC_APP_URL`** is used for email verification redirects
3. **`NEXT_PUBLIC_SITE_URL`** is used for metadata and Open Graph tags
4. Make sure to select the correct **Environment** (Production/Preview/Development) when adding variables

## Quick Setup Steps

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above
5. Select **Production** environment
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment


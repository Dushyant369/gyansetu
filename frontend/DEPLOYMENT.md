# GyanSetu - Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project set up

### Step 1: Prepare Your Code

1. **Ensure all environment variables are set:**
   ```bash
   # In frontend/.env.local
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ```

2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (or `pnpm build`)
   - **Output Directory:** `.next`
   - **Install Command:** `npm install` (or `pnpm install`)

5. **Add Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `NEXT_PUBLIC_SITE_URL` - Your Vercel deployment URL (auto-filled)

6. **Click "Deploy"**

### Step 3: Configure Supabase

1. **Update Supabase Auth Settings:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to:
     - **Site URL:** `https://your-app.vercel.app`
     - **Redirect URLs:** 
       - `https://your-app.vercel.app/auth/callback`
       - `https://your-app.vercel.app/**`

2. **Enable Realtime (Optional):**
   - Go to Database → Replication
   - Enable replication for `notifications` table

3. **Run Database Migrations:**
   - Go to SQL Editor
   - Copy and run `backend/scripts/00-run-all-migrations.sql`

### Step 4: Verify Deployment

✅ **Checklist:**
- [ ] Site loads without errors
- [ ] Sign up/Sign in works
- [ ] Questions can be created
- [ ] Answers can be posted
- [ ] Notifications work (if Realtime enabled)
- [ ] Admin routes are protected
- [ ] All pages are responsive

### Step 5: Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update Supabase redirect URLs with new domain

## 📊 Performance Optimization

### Already Implemented:
- ✅ Next.js Image optimization
- ✅ Font optimization (Geist)
- ✅ Code splitting
- ✅ Lazy loading for modals
- ✅ Optimized CSS with Tailwind
- ✅ Server-side rendering

### Additional Optimizations:
- Use Vercel Analytics (already included)
- Enable Edge Functions for faster responses
- Use Supabase Edge Functions for heavy operations

## 🔒 Security Checklist

- ✅ Environment variables secured in Vercel
- ✅ Row Level Security (RLS) enabled in Supabase
- ✅ Route protection via middleware
- ✅ Server-side validation for all actions
- ✅ CSRF protection via Next.js

## 📱 Mobile Responsiveness

All pages are responsive:
- Mobile: ≤640px
- Tablet: 641-1024px
- Desktop: ≥1025px

Test using:
- Chrome DevTools Device Mode
- BrowserStack
- Real devices

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript errors

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding new variables

### Supabase Connection Issues
- Verify URL and keys are correct
- Check Supabase project is active
- Verify RLS policies allow access

## 📝 Post-Deployment

1. **Create an admin user:**
   - Sign up normally
   - Go to Supabase Dashboard → Table Editor → profiles
   - Change your user's `role` to `'admin'`

2. **Test all features:**
   - User registration/login
   - Course enrollment
   - Question/Answer flow
   - Notifications
   - Admin features

3. **Monitor:**
   - Vercel Analytics
   - Supabase Dashboard → Logs
   - Error tracking (optional: Sentry)

## 🎉 You're Live!

Your GyanSetu platform is now production-ready and deployed!


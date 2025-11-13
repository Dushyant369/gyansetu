# GyanSetu - Academic Q&A Platform

> **Ask, answer, and learn together – instantly.**

A modern, real-time academic question and answer platform built with Next.js, Supabase, and Tailwind CSS.

## ✨ Features

- 🔐 **Authentication** - Secure sign up/login with email verification
- 📚 **Course Management** - Enroll in courses and ask course-specific questions
- 💬 **Q&A System** - Ask questions, provide answers, and mark accepted solutions
- ⭐ **Karma System** - Earn points for helpful answers (+10 for upvotes, +20 for accepted)
- 🔔 **Real-time Notifications** - Get notified when your questions are answered or answers are upvoted
- 👤 **User Profiles** - Track your activity, karma, and achievements
- 🛡️ **Admin Panel** - Manage users, courses, and moderate content
- 📱 **Fully Responsive** - Works seamlessly on mobile, tablet, and desktop
- 🎨 **Modern UI** - Dark theme with smooth animations and transitions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd GyanSetu/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up the database:**
   - Go to Supabase Dashboard → SQL Editor
   - Run `../backend/scripts/00-run-all-migrations.sql`

5. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Authentication pages
│   ├── courses/           # Course pages
│   ├── dashboard/         # User dashboard
│   └── question/          # Question detail pages
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── courses/          # Course-related components
│   ├── notifications/    # Notification components
│   ├── profile/          # Profile components
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and helpers
│   └── supabase/         # Supabase client setup
└── public/                # Static assets
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS 4
- **UI Components:** ShadCN UI + Radix UI
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📚 Key Pages

- `/` - Landing page
- `/auth/login` - Login
- `/auth/sign-up` - Sign up
- `/dashboard` - User dashboard
- `/dashboard/profile` - User profile
- `/courses` - Browse all courses
- `/my-courses` - Enrolled courses
- `/courses/[id]/questions` - Course questions
- `/question/[id]` - Question detail
- `/admin` - Admin dashboard (admin only)
- `/admin/moderation` - Content moderation (admin only)
- `/notifications` - All notifications

## 🔐 User Roles

- **Student** - Default role, can ask/answer questions, enroll in courses
- **Admin** - Can manage users, courses, and moderate content

## 🎨 Design System

- **Primary Color:** Blue (#2563EB)
- **Accent Color:** Sky (#38BDF8)
- **Background:** Dark Slate (#0F172A)
- **Text:** Slate-200 (#E2E8F0)

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Database Schema](../backend/scripts/00-run-all-migrations.sql)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is built for academic purposes.

## 🙏 Credits

Built with ❤️ by GyanSetu Team

---

**Need help?** Check the [Deployment Guide](./DEPLOYMENT.md) or open an issue.

# 🎓 GyanSetu – A Real-Time Digital Classroom Q&A Platform

<div align="center">

![GyanSetu Logo](https://img.shields.io/badge/GyanSetu-Academic%20Q%26A%20Platform-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

**Ask, answer, and learn together – instantly.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#%EF%B8%8F-installation--setup) • [Deployment](#-deployment) • [Team](#-team-members)

</div>

---

## 📋 Project Overview

**GyanSetu** is a full-stack academic collaboration platform designed to help college students ask, answer, and discuss academic doubts in real time. It provides a structured Q&A experience similar to Stack Overflow, but focused on college-level learning.

The platform enables seamless interaction between students and educators, with course-based organization, karma-based reputation system, and real-time notifications. Admins can manage courses and moderate content, while students can engage in discussions, upvote helpful answers, and earn karma points for their contributions.

### 🎯 Problem Statement

Traditional classroom environments often lack efficient mechanisms for students to get quick answers to their academic questions. Email threads, WhatsApp groups, and physical office hours are fragmented and don't scale well. GyanSetu addresses this by providing a centralized, organized platform where students can:

- Ask course-specific questions
- Get answers from peers and mentors
- Build reputation through helpful contributions
- Access a searchable knowledge base of past discussions

### ✨ Solution

A modern, real-time web application that combines the best aspects of Q&A platforms with academic course management, featuring:

- **Course-based organization** – Questions are organized by semester and course
- **Real-time collaboration** – Instant notifications and live updates
- **Gamification** – Karma system rewards quality contributions
- **Role-based access** – Separate interfaces for students and administrators
- **Modern UI/UX** – Dark-themed, responsive design with smooth animations

---

## 🚀 Features

### 👨‍🎓 For Students

- ✅ **Browse and Enroll in Courses** – Explore available courses and enroll with one click
- ✅ **Post Questions** – Ask course-related questions with tags and optional anonymity
- ✅ **Answer Questions** – Provide detailed answers to help peers
- ✅ **Upvote System** – Upvote helpful answers to highlight quality content
- ✅ **Accept Answers** – Mark the best answer as accepted (question authors only)
- ✅ **Karma Points** – Earn reputation:
  - **+10 karma** for each upvote on your answer
  - **+20 karma** for accepted answers
- ✅ **Real-time Notifications** – Get notified when:
  - You log in for the first time (welcome message)
  - Your questions receive answers
  - Your answers receive replies
  - Your answers are upvoted/downvoted
  - Your answers are accepted or marked as best answer
- ✅ **Profile Dashboard** – View your activity, karma, and achievements
- ✅ **Course Q&A Boards** – Access course-specific question boards for enrolled courses
- ✅ **Resolved Questions** – Browse all questions that have been marked as resolved with best answers, grouped by subject
- ✅ **Solve Questions** – Browse and answer questions by subject or general topics
- ✅ **Enrolled Courses Questions** – View and answer questions from your enrolled courses
- ✅ **Upvote/Downvote System** – Vote on questions and answers (with role-based rules)
- ✅ **Reply System** – Reply to answers to create threaded discussions
- ✅ **Best Answer Feature** – Admins/teachers can mark student answers as best answer (+10 karma)
- ✅ **Edit/Delete Content** – Edit or delete your own questions and answers

### 👨‍💼 For Admins

- ✅ **Course Management** – Create, edit, and delete courses with semester organization
- ✅ **User Management** – View all users with search and pagination (10 users per page), change roles
- ✅ **Content Moderation** – Edit or delete any questions and answers, mark best answers
- ✅ **Analytics Dashboard** – View platform statistics:
  - Total registered users (clickable → Manage Users)
  - Total courses created (clickable → Manage Courses)
  - Total questions posted (clickable → View/Manage Questions)
  - Top 5 students by karma
- ✅ **Role Management** – Promote/demote users between "student", "admin", and "superadmin" roles
- ✅ **Admin Assignment** – Assign admins to specific courses for better management
- ✅ **Course Management** – Create, edit, delete courses with search and pagination (10 courses per page)
- ✅ **Best Answer Moderation** – Mark student answers as best answer and reward karma (+10 points)

### 🌐 Common Features

- ✅ **Dark-themed Modern UI** – Professional dark theme with blue accents
- ✅ **Fully Responsive** – Seamless experience on mobile, tablet, and desktop
- ✅ **Secure Authentication** – Email-based signup with verification (Supabase Auth)
- ✅ **Role-based Access Control** – Protected routes based on user roles
- ✅ **Live Updates** – Real-time notifications using Supabase Realtime
- ✅ **Smooth Animations** – Fade-in, slide-up, and scale transitions
- ✅ **Loading States** – Skeleton loaders and spinners for better UX
- ✅ **Empty States** – Helpful messages when no content is available
- ✅ **Auto-Mark Notifications** – Notifications automatically marked as seen after 10 seconds when dropdown is opened
- ✅ **Pagination & Search** – Server-side pagination and search for courses, users, and questions
- ✅ **Image Uploads** – Support for images in questions, answers, and replies (max 5MB, JPEG/PNG)
- ✅ **Keyboard Shortcuts** – Submit answers/replies with Enter (Shift+Enter for new line)
- ✅ **Date Formatting** – Human-readable "time ago" format for all timestamps

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend Framework** | Next.js 16.0 (App Router), React 19.2, TypeScript 5.0 |
| **Styling** | Tailwind CSS 4.1, CSS Animations |
| **UI Components** | ShadCN UI, Radix UI (Headless) |
| **Icons** | Lucide React |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Authentication** | Supabase Auth (Email verification) |
| **State Management** | React Hooks, Server Actions |
| **Form Handling** | React Hook Form, Zod validation |
| **Date Handling** | date-fns |
| **Deployment** | Vercel (Frontend), Supabase Cloud (Backend & DB) |
| **Version Control** | Git & GitHub |
| **Analytics** | Vercel Analytics |

### Key Libraries

- **`@supabase/ssr`** – Server-side rendering support for Supabase
- **`@supabase/supabase-js`** – Supabase JavaScript client
- **`sonner`** – Toast notifications
- **`recharts`** – Analytics charts (admin dashboard)
- **`zod`** – Schema validation
- **`class-variance-authority`** – Component variants
- **`tailwind-merge`** – Tailwind class merging utility

---

## 🏗️ Database Schema

The platform uses PostgreSQL via Supabase with the following main tables:

### Core Tables

```sql
-- User Profiles
profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  role TEXT DEFAULT 'student', -- 'student' | 'admin'
  karma_points INTEGER DEFAULT 0,
  created_at TIMESTAMP
)

-- Courses
courses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  semester TEXT,
  created_at TIMESTAMP
)

-- Student Course Enrollments
student_courses (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  created_at TIMESTAMP,
  UNIQUE(student_id, course_id)
)

-- Questions
questions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  is_anonymous BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  best_answer_id UUID REFERENCES answers(id), -- Best answer reference
  created_at TIMESTAMP
)

-- Answers
answers (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES profiles(id),
  image_url TEXT, -- Image support
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
)

-- Replies (threaded discussions)
replies (
  id UUID PRIMARY KEY,
  answer_id UUID REFERENCES answers(id),
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  image_url TEXT, -- Image support
  created_at TIMESTAMP
)

-- Question Votes
question_votes (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES profiles(id),
  vote_type TEXT, -- 'upvote' or 'downvote'
  created_at TIMESTAMP,
  UNIQUE(question_id, user_id)
)

-- Answer Votes
answer_votes (
  id UUID PRIMARY KEY,
  answer_id UUID REFERENCES answers(id),
  user_id UUID REFERENCES profiles(id),
  vote_type TEXT, -- 'upvote' or 'downvote'
  created_at TIMESTAMP,
  UNIQUE(answer_id, user_id)
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  type TEXT, -- 'answer', 'upvote', 'accepted', 'reply', 'welcome'
  seen BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Additional metadata (e.g., reply_id, is_welcome)
  related_question_id UUID REFERENCES questions(id),
  related_answer_id UUID REFERENCES answers(id),
  created_at TIMESTAMP
)

-- Karma Log (Optional)
karma_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  change INTEGER, -- +10, +20, etc.
  reason TEXT,
  related_answer_id UUID REFERENCES answers(id),
  created_at TIMESTAMP
)
```

### Security

- **Row Level Security (RLS)** enabled on all tables
- **Policies** restrict access based on user roles
- **Server-side validation** for all mutations
- **Middleware protection** for admin routes

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Supabase account** (free tier works)
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/<your-username>/gyansetu.git
cd gyansetu/frontend
```

### Step 2: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Get these values from:**
- Supabase Dashboard → Settings → API
- [https://supabase.com/dashboard/project/_/settings/api](https://supabase.com/dashboard/project/_/settings/api)

### Step 4: Set Up the Database

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `backend/scripts/00-run-all-migrations.sql`
3. Paste and run the SQL script
4. Verify all tables are created:
   - `profiles`
   - `courses`
   - `questions`
   - `answers`
   - `student_courses`
   - `notifications`
   - `karma_log`

### Step 5: Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### Step 6: Create an Admin User (Optional)

1. Sign up normally through the app
2. Go to **Supabase Dashboard** → **Table Editor** → **profiles**
3. Find your user and change `role` from `'student'` to `'admin'`
4. Refresh the app to access admin features

---

## 🔐 Roles & Access

| Role | Permissions |
|------|-------------|
| **Student** | • Ask questions<br>• Answer questions<br>• Upvote answers<br>• Enroll in courses<br>• Mark accepted answers (own questions)<br>• View profile and karma |
| **Admin** | • All student permissions<br>• Create/edit/delete courses<br>• Manage users (promote/demote roles)<br>• Moderate content (edit/delete questions & answers)<br>• View analytics dashboard<br>• Assign admins to courses |

### Route Protection

- **Public Routes:** `/`, `/auth/login`, `/auth/sign-up`
- **Authenticated Routes:** All `/dashboard/*` routes
- **Admin Routes:** `/admin/*` (protected by middleware)

---

## 📚 Key Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page with features and CTA | Public |
| `/auth/login` | User login page | Public |
| `/auth/sign-up` | User registration page | Public |
| `/dashboard` | Student dashboard with quick actions | Authenticated |
| `/dashboard/profile` | User profile with karma and activity | Authenticated |
| `/dashboard/questions` | Browse all questions | Authenticated |
| `/dashboard/questions/new` | Ask a new question | Authenticated |
| `/dashboard/questions/[id]` | View question details | Authenticated |
| `/dashboard/courses` | Browse all available courses | Authenticated |
| `/resolved-questions` | View all resolved questions grouped by subject | Authenticated |
| `/solve-questions` | Browse and answer questions by subject | Authenticated |
| `/solve-questions/[subjectId]` | Questions for a specific subject | Authenticated |
| `/enrolled-questions` | View enrolled courses and their questions | Authenticated (students) |
| `/enrolled-questions/[courseId]` | Questions for a specific enrolled course | Authenticated (enrolled) |
| `/question/[id]` | Detailed Q&A page with answers, replies, voting | Authenticated |
| `/notifications` | View all notifications | Authenticated |
| `/admin` | Admin dashboard with stats | Admin only |
| `/admin/moderation` | Content moderation tools | Admin only |

---

## 📁 Project Structure

```
GyanSetu/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── auth/           # Authentication pages
│   │   ├── courses/        # Course pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── question/       # Question detail pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── admin/         # Admin-specific components
│   │   ├── courses/       # Course-related components
│   │   ├── notifications/ # Notification components
│   │   ├── profile/       # Profile components
│   │   └── ui/            # Reusable UI components
│   ├── lib/                # Utilities and helpers
│   │   └── supabase/      # Supabase client setup
│   ├── public/            # Static assets
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── README.md          # This file
│   └── package.json       # Dependencies
│
└── backend/                # Database scripts
    └── scripts/           # SQL migration files
        └── 00-run-all-migrations.sql
```

---

## 🎨 Design System

### Color Palette

- **Primary Color:** Blue (#2563EB) – Main actions and links
- **Accent Color:** Sky (#38BDF8) – Highlights and secondary actions
- **Background:** Dark Slate (#0F172A) – Main background
- **Card Background:** Slate-800 (#1E293B) – Card surfaces
- **Text Primary:** Slate-200 (#E2E8F0) – Main text
- **Text Muted:** Slate-400 (#94A3B8) – Secondary text
- **Border:** Slate-700 (#334155) – Dividers and borders

### Typography

- **Font Family:** Geist Sans (via Next.js)
- **Headings:** Bold, 2xl-6xl
- **Body:** Regular, base-lg
- **Code:** Geist Mono

### Components

- **Cards:** Rounded corners, subtle shadows, hover effects
- **Buttons:** Gradient variants, icon support, loading states
- **Forms:** Clean inputs with validation feedback
- **Modals:** Smooth animations, backdrop blur

---

## 🆕 Recent Features Added

### Version 2.0 Updates

- ✅ **Resolved Questions Section** – Browse all questions with best answers, grouped by subject
- ✅ **Enhanced Notifications** – First login welcome, reply notifications, best answer alerts
- ✅ **Auto-Mark Notifications** – Notifications automatically marked as seen after 10 seconds
- ✅ **Pagination & Search** – Server-side pagination and search for admin tables (users, courses)
- ✅ **Enrolled Courses Questions** – Dedicated workflow for students to solve questions from enrolled courses
- ✅ **Full Voting System** – Upvote/downvote questions and answers with role-based rules
- ✅ **Reply System** – Threaded discussions with image support
- ✅ **Best Answer Feature** – Admins/teachers can mark student answers as best answer (+10 karma)
- ✅ **Edit/Delete Functionality** – Users can edit/delete their own content; admins can moderate any content
- ✅ **Image Uploads** – Support for images in questions, answers, and replies (max 5MB, JPEG/PNG)
- ✅ **Keyboard Shortcuts** – Submit answers/replies with Enter key
- ✅ **Human-Readable Dates** – "Time ago" format for all timestamps

## 🚀 Future Enhancements

- [ ] **AI-Powered Suggestions** – Use free LLM APIs to suggest answers
- [ ] **Gamified Badges** – Award badges for milestones (First Answer, 100 Karma, etc.)
- [ ] **Leaderboard** – Top contributors by course and overall
- [ ] **Advanced Analytics** – More detailed charts and insights for admins
- [ ] **Full-Text Search** – Search across questions and answers
- [ ] **Email Notifications** – Optional email digests for activity
- [ ] **Markdown Support** – Rich text formatting in questions and answers
- [ ] **Course Categories** – Organize courses by department or program
- [ ] **Private Messaging** – Direct messaging between users

---

## 📸 Screenshots

> **Note:** Add screenshots to `public/screenshots/` and update the paths below.

### Landing Page
![Landing Page](./public/screenshots/landing.png)

### Dashboard
![Dashboard](./public/screenshots/dashboard.png)

### Course Q&A Board
![Course Q&A](./public/screenshots/course-questions.png)

### Question Detail
![Question Detail](./public/screenshots/question-detail.png)

### Admin Panel
![Admin Panel](./public/screenshots/admin.png)

### Profile Page
![Profile](./public/screenshots/profile.png)

---

## 🧑‍💻 Team Members

| Name | Roll No | Role | Contributions |
|------|---------|------|---------------|
| **Dushyant Mathur** | 226301083 | Full-Stack Developer | Project architecture, backend integration, deployment |
| **Abhishek Kumar Jha** | 226301006 | Frontend Developer | UI/UX design, component development, responsive design |
| **Abhishek Jangra** | 226301004 | Backend Developer | Database schema, API design, security implementation |

---

## 🧩 Project Highlights

- ✅ **Fully Functional Role-Based Web App** – Complete student and admin workflows
- ✅ **End-to-End Built with Next.js + Supabase** – Modern full-stack architecture
- ✅ **Real-time Updates** – Live notifications and instant UI updates
- ✅ **Modern Academic Interface** – Dark theme with smooth animations
- ✅ **Production Ready** – Deployed on Vercel with Supabase backend
- ✅ **Scalable Architecture** – Server-side rendering, optimized performance
- ✅ **Secure by Default** – Row Level Security, role-based access control
- ✅ **Perfect for Student Communities** – Course-based organization, karma system

---

## 🌐 Deployment

### Live Demo

👉 **[https://gyansetu.vercel.app](https://gyansetu.vercel.app)**

### Deployment Platforms

- **Frontend:** [Vercel](https://vercel.com) – Automatic deployments from GitHub
- **Backend & Database:** [Supabase Cloud](https://supabase.com) – Managed PostgreSQL and Auth

### Deployment Status

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Supabase-Live-green?style=flat-square&logo=supabase)](https://supabase.com)

### Deployment Guide

For detailed deployment instructions, see [DEPLOYMENT.md](./frontend/DEPLOYMENT.md).

---

## 📖 Documentation

- **[Deployment Guide](./frontend/DEPLOYMENT.md)** – Step-by-step Vercel deployment
- **[Production Checklist](./frontend/PRODUCTION_CHECKLIST.md)** – Pre-deployment checklist
- **[Database Schema](./backend/scripts/00-run-all-migrations.sql)** – Complete SQL schema

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes locally before submitting

---

## 🐛 Known Issues

- Email verification may take a few minutes (Supabase free tier limitation)
- Real-time notifications require Realtime to be enabled in Supabase
- Large file uploads not yet supported (future enhancement)

---

## 📄 License

This project is built for **academic purposes** as part of a final-year project.

**License:** MIT License

---

## 🏁 Conclusion

GyanSetu bridges the gap between classroom learning and peer collaboration. It empowers students to learn interactively, helps admins maintain quality, and fosters a self-sustaining academic community.

The platform demonstrates modern web development practices, including server-side rendering, real-time updates, role-based access control, and a scalable architecture. It's ready for production use and can be easily extended with additional features.

> **"Ask, Answer, and Learn — Together."**

---

## 🙏 Acknowledgments

- **Next.js Team** – For the amazing framework
- **Supabase** – For the powerful backend platform
- **ShadCN UI** – For the beautiful component library
- **Tailwind CSS** – For the utility-first CSS framework
- **Vercel** – For seamless deployment

---

## 📞 Contact & Support

- **Email:** support@gyansetu.com
- **GitHub Issues:** [Report a bug or request a feature](https://github.com/your-username/gyansetu/issues)
- **Documentation:** See [DEPLOYMENT.md](./frontend/DEPLOYMENT.md) for setup help

---

<div align="center">

**Built with ❤️ by Dushyant Mathur, Abhishek Kumar Jha, and Abhishek Jangra**

⭐ **Star this repo if you find it helpful!** ⭐

[⬆ Back to Top](#-gyansetu--a-real-time-digital-classroom-qa-platform)

</div>


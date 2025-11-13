# GyanSetu Backend

Database scripts and migrations for the GyanSetu application.

## Database Setup

### Initial Setup

Run the scripts in order:

1. **01-init-schema.sql** - Creates all tables, RLS policies, and initial schema
2. **02-add-profile-trigger.sql** - Creates trigger to auto-create profiles on user signup
3. **03-make-question-content-optional.sql** - Makes question content field optional
4. **04-update-role-column-and-policies.sql** - Sets up role management and admin permissions

### Running Scripts

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor: https://supabase.com/dashboard/project/_/sql
3. Copy and paste each script, then run them in order

## User Roles

The application supports the following user roles:

- **student** (default) - Regular users who can ask questions and provide answers
- **admin** - Full access, can manage users, courses, and all content

### Default Role Assignment

- All new signups automatically get `role = 'student'`
- This is handled by the `handle_new_user()` trigger function

### Updating User Roles

**For Admins in Supabase Dashboard:**

1. Go to Table Editor: https://supabase.com/dashboard/project/_/editor
2. Select the `profiles` table
3. Find the user you want to update
4. Click on the `role` column
5. Change the value to: `admin` or `student`
6. Save the changes

**Note:** Only users with `role = 'admin'` can update other users' roles through the application. Regular users can only update their own profile (but not their role).

## Role-Based Permissions

### Students
- Can create questions and answers
- Can vote on questions and answers
- Can update their own profile (except role)
- Can view courses and questions

### Admins
- All student permissions
- Can create and update courses
- Can update any user's role
- Can manage all content
- Can view and handle moderation reports
- Can update moderation report status

## Database Schema

### Profiles Table

```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',  -- 'student', 'admin'
  karma_points INTEGER DEFAULT 0,
  courses_enrolled TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only update their own profiles (except role)
- Only admins can update user roles
- All policies are defined in the schema scripts


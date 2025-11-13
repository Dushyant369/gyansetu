-- ============================================
-- GyanSetu Database Setup - Combined Script
-- Run this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- Script 1: Initial Schema Setup
-- ============================================

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student', -- 'student', 'admin'
  karma_points INTEGER DEFAULT 0,
  courses_enrolled TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  semester TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create votes table (tracks user votes on questions/answers)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id, answer_id)
);

-- Create moderation_reports table
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR (SELECT auth.uid() IS NOT NULL)
);

-- RLS Policies for courses table
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
CREATE POLICY "Courses are viewable by everyone" ON courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can create courses" ON courses;
CREATE POLICY "Only admins can create courses" ON courses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Only admins can update courses" ON courses;
CREATE POLICY "Only admins can update courses" ON courses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for questions table
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON questions;
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create questions" ON questions;
CREATE POLICY "Users can create questions" ON questions FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update their own questions" ON questions;
CREATE POLICY "Users can update their own questions" ON questions FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete their own questions" ON questions;
CREATE POLICY "Users can delete their own questions" ON questions FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for answers table
DROP POLICY IF EXISTS "Answers are viewable by everyone" ON answers;
CREATE POLICY "Answers are viewable by everyone" ON answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create answers" ON answers;
CREATE POLICY "Users can create answers" ON answers FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update their own answers" ON answers;
CREATE POLICY "Users can update their own answers" ON answers FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete their own answers" ON answers;
CREATE POLICY "Users can delete their own answers" ON answers FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for replies table
DROP POLICY IF EXISTS "Replies are viewable by everyone" ON replies;
CREATE POLICY "Replies are viewable by everyone" ON replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create replies" ON replies;
CREATE POLICY "Users can create replies" ON replies FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update their own replies" ON replies;
CREATE POLICY "Users can update their own replies" ON replies FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete their own replies" ON replies;
CREATE POLICY "Users can delete their own replies" ON replies FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for comments table
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for votes table
DROP POLICY IF EXISTS "Users can see their own votes" ON votes;
CREATE POLICY "Users can see their own votes" ON votes FOR SELECT USING (auth.uid() = user_id OR true);
DROP POLICY IF EXISTS "Users can create votes" ON votes;
CREATE POLICY "Users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
CREATE POLICY "Users can update their own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
CREATE POLICY "Users can delete their own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for moderation_reports table
DROP POLICY IF EXISTS "Admins can view all reports" ON moderation_reports;
CREATE POLICY "Admins can view all reports" ON moderation_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR reporter_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can create reports" ON moderation_reports;
CREATE POLICY "Users can create reports" ON moderation_reports FOR INSERT WITH CHECK (
  auth.uid() = reporter_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Only admins can update reports" ON moderation_reports;
CREATE POLICY "Only admins can update reports" ON moderation_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- Script 2: Profile Trigger Setup
-- ============================================

-- Create a trigger function to automatically create a profile when a user signs up
-- This ensures all new users get a profile with role='student' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    'student'  -- Always set default role to 'student' for new signups
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Script 3: Make Question Content Optional
-- ============================================

-- Make question content field optional
-- This allows questions to be created with just a title
ALTER TABLE questions 
ALTER COLUMN content DROP NOT NULL;

-- ============================================
-- Script 4: Role Management Setup
-- ============================================

-- Step 1: Ensure role column exists with proper default (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student';
  END IF;
END $$;

-- Step 2: Update existing NULL roles to 'student' (if any exist)
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Step 3: Add constraint to ensure role values are valid
-- Drop constraint if it exists first
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add constraint for valid role values: student, admin
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin'));

-- Step 4: Ensure default value is set
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student';

-- Step 5: Update RLS policies to allow admins to update any user's role
-- Drop existing update policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any user role" ON profiles;
DROP POLICY IF EXISTS "Admins can update any user profile" ON profiles;

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy: Admins can update any user's profile and role
CREATE POLICY "Admins can update any user profile" ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Step 5.1: Create trigger to prevent non-admins from changing roles
-- This allows role changes when:
-- 1. The user is an admin, OR
-- 2. There's no authenticated user (direct database edit via Supabase dashboard)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Allow if no authenticated user (dashboard edit) OR user is admin
    IF auth.uid() IS NULL OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      -- Allow the role change
      RETURN NEW;
    ELSE
      -- If not admin and user is authenticated, prevent role change
      NEW.role := OLD.role;
      RAISE WARNING 'Only admins can change user roles. Role change prevented.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 6: Update the trigger function to ensure role is always set to 'student' for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    'student'  -- Always set default role to 'student' for new signups
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create an index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- Script 5: Add assigned_to field to courses
-- ============================================

-- Add the assigned_to column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'courses' 
    AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE courses ADD COLUMN assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_assigned_to ON courses(assigned_to);

-- ============================================
-- Script 6: Create student_courses table
-- ============================================

-- Create student_courses table to track course enrollments
CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)  -- Prevent duplicate enrollments
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);

-- Enable Row Level Security
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_courses table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own enrollments" ON student_courses;
DROP POLICY IF EXISTS "Students can enroll in courses" ON student_courses;
DROP POLICY IF EXISTS "Students can unenroll from courses" ON student_courses;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON student_courses;

-- Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments" ON student_courses 
FOR SELECT 
USING (auth.uid() = student_id);

-- Students can enroll themselves in courses
CREATE POLICY "Students can enroll in courses" ON student_courses 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can unenroll from courses
CREATE POLICY "Students can unenroll from courses" ON student_courses 
FOR DELETE 
USING (auth.uid() = student_id);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON student_courses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Migration 07: Add is_anonymous to questions
-- ============================================
-- Add is_anonymous field to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_is_anonymous ON questions(is_anonymous);

-- ============================================
-- Migration 08: Update answers for karma system
-- ============================================
-- Update answers table to support upvotes tracking and karma system
-- Add upvoted_by array column
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS upvoted_by UUID[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_answers_upvoted_by ON answers USING GIN(upvoted_by);

-- Create karma_log table to track karma history
CREATE TABLE IF NOT EXISTS karma_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change INTEGER NOT NULL, -- positive for increase, negative for decrease
  reason TEXT NOT NULL, -- e.g., "Answer upvoted", "Answer accepted"
  related_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
  related_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for karma_log
CREATE INDEX IF NOT EXISTS idx_karma_log_user_id ON karma_log(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_log_created_at ON karma_log(created_at);

-- Enable Row Level Security
ALTER TABLE karma_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for karma_log
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own karma log" ON karma_log;
DROP POLICY IF EXISTS "Admins can view all karma logs" ON karma_log;

-- Users can view their own karma log
CREATE POLICY "Users can view their own karma log" ON karma_log
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all karma logs
CREATE POLICY "Admins can view all karma logs" ON karma_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Migration 09: Add semester courses
-- ============================================
-- Add semester-wise courses to the database
-- Semester I
INSERT INTO courses (name, code, description, semester) VALUES
('Engineering Chemistry', 'BAC-C102', 'Fundamentals of chemistry principles applied to engineering, including chemical bonding, thermodynamics, and electrochemistry.', 'Semester I'),
('Engineering Chemistry', 'BAC-C202', 'Advanced chemistry concepts for engineering applications, focusing on materials science and chemical processes.', 'Semester I'),
('Engineering Mathematics–I', 'BEM-C102', 'Introduction to calculus, differential equations, and linear algebra for engineering problem-solving.', 'Semester I'),
('Programming for Problem Solving', 'BCE-C102', 'Introduction to programming fundamentals using C/C++, focusing on problem-solving techniques and algorithm development.', 'Semester I'),
('Programming for Problem Solving', 'BCE-C202', 'Advanced programming concepts including data structures, algorithms, and software engineering principles.', 'Semester I'),
('Basic Mechanical Engineering', 'BME-C103', 'Introduction to mechanical engineering principles including statics, dynamics, and thermodynamics.', 'Semester I'),
('Environmental Studies', 'BEN-A103', 'Study of environmental systems, sustainability, and the impact of engineering on the environment.', 'Semester I')

ON CONFLICT (code) DO NOTHING;

-- Semester II
INSERT INTO courses (name, code, description, semester) VALUES
('Engineering Physics', 'BAP-C202', 'Advanced physics concepts including mechanics, waves, optics, and modern physics applications in engineering.', 'Semester II'),
('Engineering Mathematics–II', 'BEM-C202', 'Continuation of mathematical foundations including multivariable calculus, differential equations, and numerical methods.', 'Semester II'),
('Basic Electrical Engineering', 'BEE-C202', 'Fundamentals of electrical circuits, AC/DC systems, transformers, and electrical machines.', 'Semester II'),
('Electronic Devices', 'BET-C202', 'Introduction to semiconductor devices, diodes, transistors, and their applications in electronic circuits.', 'Semester II'),
('Vedic Science & Engineering', 'BHU-S202', 'Integration of traditional Vedic knowledge with modern engineering principles and practices.', 'Semester II')

ON CONFLICT (code) DO NOTHING;

-- Semester III
INSERT INTO courses (name, code, description, semester) VALUES
('Engineering Mathematics–III', 'BEM-C302', 'Advanced mathematical methods including complex analysis, probability, statistics, and transform methods.', 'Semester III'),
('Digital System Design', 'BET-C306', 'Design and analysis of digital circuits, combinational and sequential logic, and digital system architecture.', 'Semester III'),
('Python Programming', 'BCE-C307', 'Comprehensive Python programming covering data structures, object-oriented programming, and Python libraries for engineering applications.', 'Semester III'),
('Data Structure–I', 'BCE-C305', 'Fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs with implementation and analysis.', 'Semester III'),
('Data Structure–I', 'BCE-C405', 'Advanced data structures and algorithms including balanced trees, hash tables, and graph algorithms.', 'Semester III'),
('Computer Architecture & Organization', 'BCE-C306', 'Study of computer system architecture, CPU design, memory systems, and instruction set architecture.', 'Semester III')

ON CONFLICT (code) DO NOTHING;

-- Semester IV
INSERT INTO courses (name, code, description, semester) VALUES
('Discrete Mathematics', 'BEM-C403', 'Mathematical foundations for computer science including logic, set theory, combinatorics, and graph theory.', 'Semester IV'),
('Database Management System', 'BCE-C408', 'Design and implementation of database systems, SQL, normalization, and database administration.', 'Semester IV'),
('Object Oriented Programming using Java', 'BCE-C406', 'Object-oriented programming concepts using Java, including classes, inheritance, polymorphism, and design patterns.', 'Semester IV'),
('Operating System', 'BCE-C407', 'Operating system concepts including process management, memory management, file systems, and concurrency.', 'Semester IV'),
('Microprocessor and Interfacing', 'BET-C411', 'Microprocessor architecture, assembly language programming, and interfacing with peripheral devices.', 'Semester IV'),
('Bhartiya Gyan Parampara (IKT)', 'BKT-A403', 'Indian knowledge traditions and their relevance to modern engineering and technology.', 'Semester IV')

ON CONFLICT (code) DO NOTHING;

-- Semester V
INSERT INTO courses (name, code, description, semester) VALUES
('Computer Network', 'BCE-C511', 'Network architecture, protocols, TCP/IP, routing, switching, and network security fundamentals.', 'Semester V'),
('Advance Data Structure', 'BCE-C512', 'Advanced data structures and algorithms including advanced trees, heaps, and complex algorithmic techniques.', 'Semester V'),
('Design & Analysis of Algorithm', 'BCE-C513', 'Algorithm design techniques, complexity analysis, dynamic programming, greedy algorithms, and graph algorithms.', 'Semester V'),
('Cloud Computing', 'BCE-C514', 'Cloud computing fundamentals, virtualization, cloud services, and distributed systems architecture.', 'Semester V'),
('Universal Human Values', 'BCE-M001', 'Ethics, values, and human-centered design principles in engineering and technology.', 'Semester V')

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Migration 10: Create notifications system
-- ============================================
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'answer', 'upvote', 'accepted', 'question_answered'
  related_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  related_answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_seen ON notifications(seen);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as seen)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to create notification when answer is accepted
CREATE OR REPLACE FUNCTION notify_answer_accepted()
RETURNS TRIGGER AS $$
DECLARE
  answer_author_id UUID;
  question_title TEXT;
BEGIN
  -- Only notify if answer was just accepted (not unaccepted)
  IF NEW.is_accepted = TRUE AND (OLD.is_accepted IS NULL OR OLD.is_accepted = FALSE) THEN
    -- Get answer author
    SELECT author_id INTO answer_author_id
    FROM answers
    WHERE id = NEW.id;

    -- Get question title
    SELECT q.title INTO question_title
    FROM questions q
    INNER JOIN answers a ON a.question_id = q.id
    WHERE a.id = NEW.id;

    -- Don't notify if user accepted their own answer (shouldn't happen, but safety check)
    IF answer_author_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, related_question_id, related_answer_id)
      VALUES (
        answer_author_id,
        'Your answer to "' || LEFT(question_title, 50) || '" was accepted!',
        'accepted',
        NEW.question_id,
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for answer acceptance
DROP TRIGGER IF EXISTS on_answer_accepted ON answers;
CREATE TRIGGER on_answer_accepted
  AFTER UPDATE OF is_accepted ON answers
  FOR EACH ROW
  WHEN (NEW.is_accepted IS DISTINCT FROM OLD.is_accepted)
  EXECUTE FUNCTION notify_answer_accepted();

-- Enable Realtime for notifications table (if publication exists and table not already added)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Check if notifications table is already in the publication
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
  END IF;
END $$;

-- ============================================
-- Script 10: Add SuperAdmin Role Support
-- ============================================
-- This script adds support for 'superadmin' role and sets up permissions

-- Step 1: Update role constraint to include 'superadmin'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin', 'superadmin'));

-- Step 2: Auto-assign SuperAdmin role to specific email
-- This function will be called on login/auth check
CREATE OR REPLACE FUNCTION public.ensure_superadmin()
RETURNS TRIGGER AS $$
BEGIN
  -- If user email is the SuperAdmin email, ensure role is 'superadmin'
  IF NEW.email = 'icygenius08@gmail.com' THEN
    NEW.role := 'superadmin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign SuperAdmin on profile creation/update
DROP TRIGGER IF EXISTS ensure_superadmin_trigger ON profiles;
CREATE TRIGGER ensure_superadmin_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_superadmin();

-- Step 3: Update existing SuperAdmin user if exists
UPDATE profiles 
SET role = 'superadmin' 
WHERE email = 'icygenius08@gmail.com';

-- Step 4: Update RLS policies for SuperAdmin
-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can update any user profile" ON profiles;
DROP POLICY IF EXISTS "SuperAdmins can update any user profile" ON profiles;

-- Create policy: SuperAdmins can update any user's profile and role
CREATE POLICY "SuperAdmins can update any user profile" ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Create policy: Admins can update students only (not admins or superadmins)
CREATE POLICY "Admins can update student profiles" ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profiles.id AND role = 'student'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profiles.id AND role = 'student'
  )
);

-- Step 4.5: Support image attachments on questions and answers
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 5: Update prevent_role_change trigger to allow SuperAdmin changes
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Prevent changing SuperAdmin role (unless it's the SuperAdmin themselves or direct DB edit)
    IF OLD.role = 'superadmin' AND auth.uid() IS NOT NULL THEN
      -- Only allow if the SuperAdmin is changing their own role (shouldn't happen, but safety)
      -- OR if it's a direct database edit (auth.uid() IS NULL)
      IF auth.uid() = OLD.id OR auth.uid() IS NULL THEN
        RETURN NEW;
      ELSE
        -- Prevent any role change to/from superadmin by non-superadmin users
        NEW.role := OLD.role;
        RAISE WARNING 'Only SuperAdmin can modify SuperAdmin role. Role change prevented.';
        RETURN NEW;
      END IF;
    END IF;
    
    -- Allow if no authenticated user (dashboard edit) OR user is superadmin OR (user is admin AND target is student)
    IF auth.uid() IS NULL OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    ) OR (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ) AND OLD.role = 'student'
    ) THEN
      RETURN NEW;
    ELSE
      -- If not admin/superadmin and user is authenticated, prevent role change
      NEW.role := OLD.role;
      RAISE WARNING 'Only admins can change user roles. Role change prevented.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 6: Create function to check and auto-assign SuperAdmin on auth
-- This will be called from the application on login
CREATE OR REPLACE FUNCTION public.check_and_assign_superadmin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET role = 'superadmin' 
  WHERE email = user_email AND email = 'icygenius08@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Setup Complete!
-- ============================================
-- All database migrations have been applied successfully.
-- 
-- Next steps:
-- 1. Go to Table Editor and verify tables exist
-- 2. Sign up a user through your app
-- 3. The email 'icygenius08@gmail.com' will automatically get 'superadmin' role
-- 4. Manually change other users' role to 'admin' in the profiles table if needed
-- 5. Enable Realtime for notifications in Supabase Dashboard if needed
-- ============================================


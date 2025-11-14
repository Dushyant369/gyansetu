-- ============================================
-- Script 19: Fix RLS and Add Missing Features
-- ============================================

-- PART 0: Fix any invalid role values before applying constraints
-- First, drop the constraint temporarily to allow updates
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Temporarily disable session replication to bypass triggers during bulk update
SET session_replication_role = 'replica';

-- Comprehensive fix for all invalid role values
-- Update NULL roles
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Update empty strings and whitespace-only strings
UPDATE profiles SET role = 'student' WHERE TRIM(role) = '' OR role = '';

-- Update any role that doesn't match exactly (case-insensitive check)
UPDATE profiles 
SET role = CASE 
  WHEN LOWER(TRIM(role)) = 'student' THEN 'student'
  WHEN LOWER(TRIM(role)) = 'admin' THEN 'admin'
  WHEN LOWER(TRIM(role)) = 'superadmin' THEN 'superadmin'
  ELSE 'student'
END
WHERE role IS NOT NULL 
AND LOWER(TRIM(role)) NOT IN ('student', 'admin', 'superadmin');

-- Normalize all roles to lowercase and trim whitespace
UPDATE profiles 
SET role = LOWER(TRIM(role))
WHERE role IS NOT NULL;

-- Final safety check - set any remaining invalid values to 'student'
UPDATE profiles 
SET role = 'student'
WHERE role IS NULL 
OR TRIM(role) = ''
OR role NOT IN ('student', 'admin', 'superadmin');

-- Re-enable session replication
SET session_replication_role = 'origin';

-- Re-apply the constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin', 'superadmin'));

-- PART 1: Fix RLS for Courses
-- Drop existing policies
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Only admins can create courses" ON courses;
DROP POLICY IF EXISTS "Only admins can update courses" ON courses;
DROP POLICY IF EXISTS "course_select" ON courses;
DROP POLICY IF EXISTS "course_admin_insert" ON courses;
DROP POLICY IF EXISTS "course_admin_update" ON courses;
DROP POLICY IF EXISTS "course_admin_delete" ON courses;
DROP POLICY IF EXISTS "course_admin_write" ON courses;

-- Create new policies
CREATE POLICY "course_select" 
ON courses FOR SELECT 
TO authenticated 
USING (true);

-- Separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "course_admin_insert"
ON courses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "course_admin_update"
ON courses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "course_admin_delete"
ON courses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- PART 2: Add resolved column to questions if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;

-- PART 3: Block self-voting on questions
DROP POLICY IF EXISTS "no_self_vote" ON question_votes;
CREATE POLICY "no_self_vote"
ON question_votes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() != (SELECT author_id FROM questions WHERE id = question_id)
);

-- PART 4: Ensure answers table has all required columns
ALTER TABLE answers ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
-- Note: question_id and author_id should already exist, but ensure they do
-- The table structure should have: question_id, author_id, content, image_url

-- If user_id doesn't exist but author_id does, we can create a view or use author_id
-- For now, we'll ensure author_id is used consistently

-- PART 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author_id ON answers(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_resolved ON questions(resolved);

-- ============================================
-- Verification queries
-- ============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'questions' AND column_name = 'resolved';
--
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'answers' AND column_name IN ('content', 'image_url', 'author_id', 'question_id');


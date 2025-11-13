-- Create student_courses table to track course enrollments
-- This allows students to enroll in courses and see questions from those courses

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


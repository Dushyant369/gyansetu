-- Add assigned_to field to courses table
-- This allows admins to assign an admin user to manage each course

-- Add the assigned_to column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_assigned_to ON courses(assigned_to);

-- Add comment to document the field
COMMENT ON COLUMN courses.assigned_to IS 'Admin user assigned to manage this course';


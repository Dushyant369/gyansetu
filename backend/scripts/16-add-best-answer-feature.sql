-- Add best_answer_id column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS best_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_best_answer_id ON questions(best_answer_id);

-- Update RLS policy to allow admins and superadmins to update best_answer_id
-- Students cannot update this field
DROP POLICY IF EXISTS "admin_mark_best_answer" ON questions;
CREATE POLICY "admin_mark_best_answer" ON questions
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

-- Note: The existing "Users can update their own questions" policy will still allow
-- users to update their own questions, but the best_answer_id field will be protected
-- by the admin_mark_best_answer policy which takes precedence for that specific field.


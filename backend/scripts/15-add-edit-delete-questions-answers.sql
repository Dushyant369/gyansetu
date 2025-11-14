-- Update RLS policies for questions to allow users to edit/delete their own questions
-- Students can edit/delete only their own questions
-- Admins can edit/delete student questions only (not admin/superadmin questions)
-- SuperAdmins can edit/delete any question

DROP POLICY IF EXISTS "Users can update their own questions" ON questions;
CREATE POLICY "Users can update their own questions" ON questions
FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
  OR (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = author_id 
      AND role = 'student'
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own questions" ON questions;
CREATE POLICY "Users can delete their own questions" ON questions
FOR DELETE TO authenticated
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
  OR (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = author_id 
      AND role = 'student'
    )
  )
);

-- Update RLS policies for answers to allow users to edit/delete their own answers
-- Students can edit/delete only their own answers
-- Admins can edit/delete student answers only (not admin/superadmin answers)
-- SuperAdmins can edit/delete any answer

DROP POLICY IF EXISTS "Users can update their own answers" ON answers;
CREATE POLICY "Users can update their own answers" ON answers
FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
  OR (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = author_id 
      AND role = 'student'
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own answers" ON answers;
CREATE POLICY "Users can delete their own answers" ON answers
FOR DELETE TO authenticated
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
  OR (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = author_id 
      AND role = 'student'
    )
  )
);


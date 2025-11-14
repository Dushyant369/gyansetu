-- Fix RLS policies for answers table to ensure all authenticated users can insert answers

-- Enable RLS if not already enabled
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create answers" ON answers;

-- Create a more permissive insert policy
-- This allows any authenticated user with a profile to create answers
CREATE POLICY "Users can create answers" ON answers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id 
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );

-- Verify the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'answers' AND policyname = 'Users can create answers';


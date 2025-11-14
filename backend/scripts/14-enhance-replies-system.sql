-- Create replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on replies table
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Add image_url column to replies table if it doesn't exist
ALTER TABLE replies 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add reply_id column to moderation_reports table if it doesn't exist
ALTER TABLE moderation_reports
ADD COLUMN IF NOT EXISTS reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;

-- Drop existing policies if they exist (with different names from main migration)
DROP POLICY IF EXISTS "Users can update their own replies" ON replies;
DROP POLICY IF EXISTS "Users can delete their own replies" ON replies;
DROP POLICY IF EXISTS "allow update own replies" ON replies;
DROP POLICY IF EXISTS "allow delete own replies" ON replies;
DROP POLICY IF EXISTS "Replies are viewable by everyone" ON replies;
DROP POLICY IF EXISTS "Users can create replies" ON replies;

-- Allow users to update their own replies
CREATE POLICY "allow update own replies" ON replies
FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Allow users to delete their own replies, or admins/superadmins to delete any reply
CREATE POLICY "allow delete own replies" ON replies
FOR DELETE TO authenticated
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Ensure insert and select policies are correct
DROP POLICY IF EXISTS "allow insert replies" ON replies;
CREATE POLICY "allow insert replies" ON replies
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "allow select replies" ON replies;
CREATE POLICY "allow select replies" ON replies
FOR SELECT TO authenticated
USING (true);


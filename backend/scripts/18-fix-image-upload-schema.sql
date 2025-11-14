-- ============================================
-- Script 18: Fix Image Upload Schema
-- ============================================
-- This script ensures all image_url columns exist and storage bucket is set up

-- Step 1: Add image_url column to questions table if it doesn't exist
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Add image_url column to answers table if it doesn't exist
ALTER TABLE answers
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 3: Add image_url column to replies table if it doesn't exist
ALTER TABLE replies
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 4: Create storage bucket for QA images if it doesn't exist
-- Note: This uses Supabase's storage API, which may require manual setup in dashboard
-- If bucket already exists, this will not error
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'qa-images'
  ) THEN
    -- Create bucket (this requires proper permissions)
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('qa-images', 'qa-images', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Step 5: Set up storage policies for qa-images bucket
-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'qa-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to images
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qa-images');

-- Allow users to update their own uploaded images
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'qa-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'qa-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploaded images
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'qa-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins and superadmins to manage all images
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;
CREATE POLICY "Admins can manage all images"
ON storage.objects
TO authenticated
USING (
  bucket_id = 'qa-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  bucket_id = 'qa-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- ============================================
-- Verification queries (run these to verify)
-- ============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'questions' AND column_name = 'image_url';
--
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'answers' AND column_name = 'image_url';
--
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'replies' AND column_name = 'image_url';
--
-- SELECT id, name, public FROM storage.buckets WHERE id = 'qa-images';


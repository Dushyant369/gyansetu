-- ============================================
-- Script 25: Ensure storage buckets exist (idempotent — safe to re-run)
-- Run this in the Supabase SQL Editor to create qa-images and qa-videos buckets
-- ============================================

-- Create qa-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qa-images',
  'qa-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create qa-videos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qa-videos',
  'qa-videos',
  true,
  52428800,  -- 50MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg'];

-- Create event-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- ============================================
-- Storage policies for qa-images
-- ============================================

-- Drop legacy and script-25 qa-images policies (safe to re-run)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;
DROP POLICY IF EXISTS "qa_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "qa_images_select" ON storage.objects;
DROP POLICY IF EXISTS "qa_images_update" ON storage.objects;
DROP POLICY IF EXISTS "qa_images_delete" ON storage.objects;

-- Anyone authenticated can upload to qa-images (path must start with their userId)
CREATE POLICY "qa_images_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'qa-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read for qa-images
CREATE POLICY "qa_images_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'qa-images');

-- Update own images
CREATE POLICY "qa_images_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'qa-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'qa-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Delete own images (or admin)
CREATE POLICY "qa_images_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'qa-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
);

-- ============================================
-- Storage policies for qa-videos
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all videos" ON storage.objects;
DROP POLICY IF EXISTS "qa_videos_insert" ON storage.objects;
DROP POLICY IF EXISTS "qa_videos_select" ON storage.objects;
DROP POLICY IF EXISTS "qa_videos_update" ON storage.objects;
DROP POLICY IF EXISTS "qa_videos_delete" ON storage.objects;

CREATE POLICY "qa_videos_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'qa-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "qa_videos_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'qa-videos');

CREATE POLICY "qa_videos_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'qa-videos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'qa-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "qa_videos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'qa-videos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
);

-- ============================================
-- Storage policies for event-images
-- ============================================

DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "event_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "event_images_select" ON storage.objects;
DROP POLICY IF EXISTS "event_images_delete" ON storage.objects;

CREATE POLICY "event_images_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

CREATE POLICY "event_images_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-images');

CREATE POLICY "event_images_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

-- Answer multimedia columns (same as scripts 23 / 26)
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE answers ADD COLUMN IF NOT EXISTS video_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE answers ADD COLUMN IF NOT EXISTS video_links TEXT[] NOT NULL DEFAULT '{}';

UPDATE answers
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_urls IS NULL OR cardinality(image_urls) = 0);

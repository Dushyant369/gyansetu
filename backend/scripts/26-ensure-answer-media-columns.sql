-- ============================================
-- Script 26: Ensure answer multimedia columns exist
-- Run in Supabase SQL Editor if you see:
-- PGRST204 Could not find the 'image_urls' column of 'answers'
-- ============================================

ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE answers ADD COLUMN IF NOT EXISTS video_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE answers ADD COLUMN IF NOT EXISTS video_links TEXT[] NOT NULL DEFAULT '{}';

UPDATE answers
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_urls IS NULL OR cardinality(image_urls) = 0);

-- Reload PostgREST schema cache (Supabase applies this automatically after DDL)

-- Quick script to manually set SuperAdmin role
-- Run this in Supabase SQL Editor if auto-assignment didn't work

-- Set SuperAdmin role for the specific email
UPDATE profiles 
SET role = 'superadmin' 
WHERE email = 'icygenius08@gmail.com';

-- Verify the update
SELECT id, email, display_name, role 
FROM profiles 
WHERE email = 'icygenius08@gmail.com';


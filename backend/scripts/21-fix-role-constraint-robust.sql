-- ============================================
-- Script 21: Robust Fix for Role Constraint Violation
-- ============================================
-- Run this script FIRST if you're getting constraint violations
-- This script handles all edge cases and ensures all roles are valid

-- Step 1: Drop the constraint to allow updates
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Temporarily disable session replication to bypass triggers during bulk update
SET session_replication_role = 'replica';

-- Step 3: Comprehensive fix for all invalid role values
-- Update NULL roles
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Update empty strings and whitespace-only strings
UPDATE profiles SET role = 'student' WHERE TRIM(role) = '' OR role = '';

-- Update any role that doesn't match exactly (case-insensitive check)
-- This catches 'Student', 'ADMIN', 'SuperAdmin', etc.
UPDATE profiles 
SET role = CASE 
  WHEN LOWER(TRIM(role)) = 'student' THEN 'student'
  WHEN LOWER(TRIM(role)) = 'admin' THEN 'admin'
  WHEN LOWER(TRIM(role)) = 'superadmin' THEN 'superadmin'
  ELSE 'student'
END
WHERE role IS NOT NULL 
AND LOWER(TRIM(role)) NOT IN ('student', 'admin', 'superadmin');

-- Step 4: Normalize all roles to lowercase and trim whitespace
UPDATE profiles 
SET role = LOWER(TRIM(role))
WHERE role IS NOT NULL;

-- Step 5: Final safety check - set any remaining invalid values to 'student'
UPDATE profiles 
SET role = 'student'
WHERE role IS NULL 
OR TRIM(role) = ''
OR role NOT IN ('student', 'admin', 'superadmin');

-- Step 6: Re-enable session replication
SET session_replication_role = 'origin';

-- Step 7: Verify all roles are valid (this query should return 0 rows)
-- If it returns rows, those need to be fixed manually
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM profiles 
  WHERE role IS NULL 
  OR TRIM(role) = ''
  OR role NOT IN ('student', 'admin', 'superadmin');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'Warning: % rows still have invalid roles. Fixing them...', invalid_count;
    UPDATE profiles 
    SET role = 'student'
    WHERE role IS NULL 
    OR TRIM(role) = ''
    OR role NOT IN ('student', 'admin', 'superadmin');
  END IF;
END $$;

-- Step 8: Now safely apply the constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin', 'superadmin'));

-- Step 9: Verification query (should return 0 rows)
-- SELECT id, email, role 
-- FROM profiles 
-- WHERE role IS NULL 
-- OR TRIM(role) = ''
-- OR role NOT IN ('student', 'admin', 'superadmin');


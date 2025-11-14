-- ============================================
-- Script 20: Fix Role Constraint Violation
-- ============================================
-- This script fixes any invalid role values before applying constraints
-- Run this BEFORE running the main migration if you get constraint violations

-- Step 1: Drop the constraint temporarily to allow updates
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Fix all invalid role values
-- Update NULL roles to 'student'
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Update empty string roles to 'student'
UPDATE profiles SET role = 'student' WHERE role = '';

-- Update any role that is not in the allowed list to 'student'
-- This catches any unexpected values like 'teacher', 'moderator', etc.
UPDATE profiles 
SET role = 'student' 
WHERE role IS NOT NULL 
AND role != ''
AND role NOT IN ('student', 'admin', 'superadmin');

-- Step 3: Ensure all roles are lowercase (in case of case sensitivity issues)
UPDATE profiles 
SET role = LOWER(role)
WHERE role IS NOT NULL;

-- Step 4: Re-apply the constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin', 'superadmin'));

-- Step 5: Verify no violations remain
-- This query should return 0 rows if everything is fixed
SELECT id, email, role 
FROM profiles 
WHERE role IS NULL 
OR role = ''
OR role NOT IN ('student', 'admin', 'superadmin');


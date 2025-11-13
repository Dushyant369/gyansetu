-- ============================================
-- Script 10: Add SuperAdmin Role Support
-- ============================================
-- This script adds support for 'superadmin' role and sets up permissions

-- Step 1: Update role constraint to include 'superadmin'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin', 'superadmin'));

-- Step 2: Auto-assign SuperAdmin role to specific email
-- This function will be called on login/auth check
CREATE OR REPLACE FUNCTION public.ensure_superadmin()
RETURNS TRIGGER AS $$
BEGIN
  -- If user email is the SuperAdmin email, ensure role is 'superadmin'
  IF NEW.email = 'icygenius08@gmail.com' THEN
    NEW.role := 'superadmin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign SuperAdmin on profile creation/update
DROP TRIGGER IF EXISTS ensure_superadmin_trigger ON profiles;
CREATE TRIGGER ensure_superadmin_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_superadmin();

-- Step 3: Update existing SuperAdmin user if exists
UPDATE profiles 
SET role = 'superadmin' 
WHERE email = 'icygenius08@gmail.com';

-- Step 4: Update RLS policies for SuperAdmin
-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can update any user profile" ON profiles;
DROP POLICY IF EXISTS "SuperAdmins can update any user profile" ON profiles;

-- Create policy: SuperAdmins can update any user's profile and role
CREATE POLICY "SuperAdmins can update any user profile" ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Create policy: Admins can update students only (not admins or superadmins)
CREATE POLICY "Admins can update student profiles" ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profiles.id AND role = 'student'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profiles.id AND role = 'student'
  )
);

-- Step 5: Update prevent_role_change trigger to allow SuperAdmin changes
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Prevent changing SuperAdmin role (unless it's the SuperAdmin themselves or direct DB edit)
    IF OLD.role = 'superadmin' AND auth.uid() IS NOT NULL THEN
      -- Only allow if the SuperAdmin is changing their own role (shouldn't happen, but safety)
      -- OR if it's a direct database edit (auth.uid() IS NULL)
      IF auth.uid() = OLD.id OR auth.uid() IS NULL THEN
        RETURN NEW;
      ELSE
        -- Prevent any role change to/from superadmin by non-superadmin users
        NEW.role := OLD.role;
        RAISE WARNING 'Only SuperAdmin can modify SuperAdmin role. Role change prevented.';
        RETURN NEW;
      END IF;
    END IF;
    
    -- Allow if no authenticated user (dashboard edit) OR user is superadmin OR (user is admin AND target is student)
    IF auth.uid() IS NULL OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    ) OR (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ) AND OLD.role = 'student'
    ) THEN
      RETURN NEW;
    ELSE
      -- If not admin/superadmin and user is authenticated, prevent role change
      NEW.role := OLD.role;
      RAISE WARNING 'Only admins can change user roles. Role change prevented.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 6: Create function to check and auto-assign SuperAdmin on auth
-- This will be called from the application on login
CREATE OR REPLACE FUNCTION public.check_and_assign_superadmin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET role = 'superadmin' 
  WHERE email = user_email AND email = 'icygenius08@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


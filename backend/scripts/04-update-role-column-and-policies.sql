-- Update role column and policies for user roles
-- This script ensures the role column exists, has proper defaults, and allows admins to update roles

-- Step 1: Ensure role column exists with proper default (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student';
  END IF;
END $$;

-- Step 2: Update existing NULL roles to 'student' (if any exist)
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Step 3: Add constraint to ensure role values are valid
-- Drop constraint if it exists first
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add constraint for valid role values: student, admin
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin'));

-- Step 4: Ensure default value is set
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student';

-- Step 5: Update RLS policies to allow admins to update any user's role
-- Drop existing update policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any user role" ON profiles;
DROP POLICY IF EXISTS "Admins can update any user profile" ON profiles;

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy: Admins can update any user's profile and role
CREATE POLICY "Admins can update any user profile" ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Step 5.1: Create trigger to prevent non-admins from changing roles
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if the current user is an admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      -- If not admin, prevent role change by reverting to old role
      NEW.role := OLD.role;
      RAISE WARNING 'Only admins can change user roles. Role change prevented.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 6: Update the trigger function to ensure role is always set to 'student' for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    'student'  -- Always set default role to 'student' for new signups
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create an index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);


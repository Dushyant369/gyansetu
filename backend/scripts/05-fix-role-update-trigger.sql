-- Fix the role update trigger to allow Supabase dashboard edits
-- This allows superusers/admins editing directly in Supabase dashboard to change roles

-- Update the trigger function to allow role changes when:
-- 1. The user is an admin, OR
-- 2. There's no authenticated user (direct database edit via Supabase dashboard)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Allow if no authenticated user (dashboard edit) OR user is admin
    IF auth.uid() IS NULL OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      -- Allow the role change
      RETURN NEW;
    ELSE
      -- If not admin and user is authenticated, prevent role change
      NEW.role := OLD.role;
      RAISE WARNING 'Only admins can change user roles. Role change prevented.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger is already created, this just updates the function


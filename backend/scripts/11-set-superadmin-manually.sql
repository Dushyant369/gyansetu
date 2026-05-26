-- SuperAdmin setup (run in Supabase SQL Editor)
--
-- If login shows "Invalid login credentials", the Auth user usually does not exist
-- or email is not confirmed. Fix in Dashboard FIRST:
--   Authentication → Users → Add user
--   Email: icygenius08@gmail.com
--   Password: (your choice)
--   Enable "Auto Confirm User"
-- Then run the SQL below.

-- Set SuperAdmin role for the specific email
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'icygenius08@gmail.com';

-- If no profile row exists yet, insert one (replace USER_UUID from Authentication → Users):
-- INSERT INTO profiles (id, email, display_name, role)
-- VALUES ('USER_UUID', 'icygenius08@gmail.com', 'Super Admin', 'superadmin')
-- ON CONFLICT (id) DO UPDATE SET role = 'superadmin', email = EXCLUDED.email;

-- Verify the update
SELECT id, email, display_name, role
FROM profiles
WHERE email = 'icygenius08@gmail.com';


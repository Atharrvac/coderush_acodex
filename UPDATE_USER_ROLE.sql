-- Update user role to officer
-- Run this in Supabase SQL Editor after registering the user

-- Update the test user to be an officer
UPDATE users 
SET role = 'officer'
WHERE email = 'officer.test@gov.in';

-- Verify the update
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'officer.test@gov.in';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USER ROLE UPDATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE 'Email: officer.test@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE 'Role: officer';
  RAISE NOTICE '========================================';
END $$;
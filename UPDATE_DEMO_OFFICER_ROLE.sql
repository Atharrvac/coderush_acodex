-- Update Demo Officer Role
-- Run this in Supabase SQL Editor after registering the user

-- Update the demo officer role
UPDATE users 
SET role = 'officer'
WHERE email = 'officer.demo@gov.in';

-- Verify the update
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'officer.demo@gov.in';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DEMO OFFICER ROLE UPDATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE 'Email: officer.demo@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE 'Role: officer';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'You can now login through the mobile app!';
  RAISE NOTICE 'Go to Profile → Officer Portal';
  RAISE NOTICE '========================================';
END $$;
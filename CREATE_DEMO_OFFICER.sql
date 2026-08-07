-- Create Demo Officer Account
-- Run this in Supabase SQL Editor

-- Delete existing test user if exists
DELETE FROM users WHERE email = 'officer.demo@gov.in';

-- Create demo officer with proper password hash
INSERT INTO users (
  id,
  email,
  name,
  role,
  password,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'officer.demo@gov.in',
  'Demo Officer',
  'officer',
  '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
  true,
  NOW(),
  NOW()
);

-- Create department head
INSERT INTO users (
  id,
  email,
  name,
  role,
  password,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'head.demo@gov.in',
  'Demo Department Head',
  'department_head',
  '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
  true,
  NOW(),
  NOW()
);

-- Create admin
INSERT INTO users (
  id,
  email,
  name,
  role,
  password,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin.demo@gov.in',
  'Demo Admin',
  'admin',
  '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
  true,
  NOW(),
  NOW()
);

-- Verify the users were created
SELECT email, name, role, is_active, created_at 
FROM users 
WHERE email IN ('officer.demo@gov.in', 'head.demo@gov.in', 'admin.demo@gov.in')
ORDER BY role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DEMO OFFICER ACCOUNTS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Login Credentials (all use password123):';
  RAISE NOTICE '';
  RAISE NOTICE '👮 Officer:';
  RAISE NOTICE 'Email: officer.demo@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE '👨‍💼 Department Head:';
  RAISE NOTICE 'Email: head.demo@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE '👨‍💻 Admin:';
  RAISE NOTICE 'Email: admin.demo@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Now you can login through the mobile app!';
  RAISE NOTICE '========================================';
END $$;
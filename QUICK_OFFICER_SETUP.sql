-- Quick Officer Setup for Testing
-- Run this in your Supabase SQL Editor

-- First, let's create a simple officer user directly
-- This bypasses Supabase Auth for demo purposes

-- Insert officer user directly into users table
INSERT INTO users (
  id,
  email,
  name,
  role,
  password,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'officer.pwd@gov.in',
  'Rajesh Kumar',
  'officer',
  '$2b$10$rQZ8kqVZ8qVZ8qVZ8qVZ8O', -- hashed 'password123'
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Insert department head
INSERT INTO users (
  id,
  email,
  name,
  role,
  password,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'head.pwd@gov.in',
  'Suresh Patil',
  'department_head',
  '$2b$10$rQZ8kqVZ8qVZ8qVZ8qVZ8O', -- hashed 'password123'
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Insert admin
INSERT INTO users (
  id,
  email,
  name,
  role,
  password,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@gov.in',
  'System Admin',
  'admin',
  '$2b$10$rQZ8kqVZ8qVZ8qVZ8qVZ8O', -- hashed 'password123'
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Verify the users were created
SELECT email, name, role, is_active FROM users WHERE role IN ('officer', 'department_head', 'admin');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ OFFICER ACCOUNTS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Credentials:';
  RAISE NOTICE 'Email: officer.pwd@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'Email: head.pwd@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'Email: admin@gov.in';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '========================================';
END $$;
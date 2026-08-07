-- Bypass Officer Setup - Update existing user to officer role
-- Run this in Supabase SQL Editor

-- First, let's see what users exist
SELECT id, email, name, role, is_active FROM users LIMIT 5;

-- If you have any existing user, we can update them to be an officer
-- Replace 'your-existing-email@example.com' with an actual email from your users table
-- UPDATE users 
-- SET role = 'officer', password = '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.'
-- WHERE email = 'your-existing-email@example.com';

-- Or create a minimal user record
INSERT INTO users (email, name, role, password, is_active) 
SELECT 'officer.demo@gov.in', 'Demo Officer', 'officer', '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'officer.demo@gov.in');

-- Show the result
SELECT 'Check the users above and update one to be an officer, or use the INSERT statement' as instruction;
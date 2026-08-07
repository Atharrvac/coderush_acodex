-- Fix Users Table Schema and Create Officer Account
-- Run this in Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'citizen';

-- Create officer account with hashed password and UUID
INSERT INTO users (
    id,
    email,
    name,
    password,
    role,
    is_active
) VALUES (
    gen_random_uuid(),
    'officer.demo@gov.in',
    'Demo Officer',
    '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
    'officer',
    true
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role;

-- Verify the user was created
SELECT email, name, role, is_active FROM users WHERE email = 'officer.demo@gov.in';

-- Success message
SELECT 'Officer account ready! Login: officer.demo@gov.in / password123' as result;
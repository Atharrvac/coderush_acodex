-- Simple Officer Setup - Works with existing schema
-- Run this in Supabase SQL Editor

-- First, let's see what columns exist in users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'citizen';

-- Create a simple officer user
INSERT INTO users (
    email,
    name,
    password,
    role,
    is_active
) VALUES (
    'officer.demo@gov.in',
    'Demo Officer',
    '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
    'officer',
    true
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    name = EXCLUDED.name;

-- Verify the user was created
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'officer.demo@gov.in';

-- Success message
SELECT 'Officer account created successfully! Email: officer.demo@gov.in, Password: password123' as message;
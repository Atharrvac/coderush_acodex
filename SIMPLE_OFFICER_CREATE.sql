-- Simple Officer Account Creation
-- Run this in Supabase SQL Editor

-- First, let's see the current users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Add missing columns safely
DO $$ 
BEGIN
    -- Add password column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password TEXT;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'citizen';
    END IF;
END $$;

-- Delete existing officer if exists
DELETE FROM users WHERE email = 'officer.demo@gov.in';

-- Create new officer account
INSERT INTO users (
    id,
    email,
    name,
    password,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'officer.demo@gov.in',
    'Demo Officer',
    '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
    'officer',
    true,
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'officer.demo@gov.in';

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ OFFICER ACCOUNT CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE 'Email: officer.demo@gov.in';
    RAISE NOTICE 'Password: password123';
    RAISE NOTICE 'Role: officer';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now login at: http://localhost:8081';
    RAISE NOTICE 'Go to Profile → Officer Portal';
    RAISE NOTICE '========================================';
END $$;
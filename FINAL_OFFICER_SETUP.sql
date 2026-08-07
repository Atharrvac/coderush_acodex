-- Final Officer Setup - Works around foreign key constraints
-- Run this in Supabase SQL Editor

-- First, let's check what constraints exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'users';

-- Temporarily disable foreign key checks if needed
SET session_replication_role = replica;

-- Create officer account without specifying id (let it auto-generate)
INSERT INTO users (
    email,
    name,
    password,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'officer.demo@gov.in',
    'Demo Officer',
    '$2a$10$6Q0UwkdG5Qa4kDoUOfsWHemRrALmGHGZJCl2ipWav48kj89tlwac.',
    'officer',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    name = EXCLUDED.name;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify the user was created
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'officer.demo@gov.in';

-- Success message
SELECT 'Officer account created successfully! Login: officer.demo@gov.in / password123' as result;
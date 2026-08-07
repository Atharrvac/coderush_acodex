-- Step 2: Create officer account
-- Run this AFTER running STEP1_ADD_COLUMNS.sql

-- Delete existing officer if exists
DELETE FROM users WHERE email = 'officer.demo@gov.in';

-- Create officer account
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

-- Success message
SELECT 'Officer account created! Login: officer.demo@gov.in / password123' as result;
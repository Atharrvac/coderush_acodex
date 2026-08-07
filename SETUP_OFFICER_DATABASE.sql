-- Complete Database Setup for Officer System
-- Run this in Supabase SQL Editor

-- First, let's create the user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'department_head', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN role user_role DEFAULT 'citizen';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add other missing columns to users table
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN department_id UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN employee_id TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN problems_posted INTEGER DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN problems_solved INTEGER DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default departments
INSERT INTO departments (name, code, description) VALUES
    ('Public Works Department', 'PWD', 'Roads, bridges, and infrastructure'),
    ('Water Supply Department', 'WSD', 'Water supply and drainage'),
    ('Electricity Board', 'EB', 'Power supply and electrical issues'),
    ('Municipal Corporation', 'MC', 'General municipal services'),
    ('Health Department', 'HD', 'Public health and sanitation')
ON CONFLICT (code) DO NOTHING;

-- Create officers table if it doesn't exist
CREATE TABLE IF NOT EXISTS officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    designation TEXT,
    employee_id TEXT,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to problems table if they don't exist
DO $$ BEGIN
    ALTER TABLE problems ADD COLUMN complaint_status TEXT DEFAULT 'submitted';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE problems ADD COLUMN priority_level TEXT DEFAULT 'medium';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE problems ADD COLUMN department_id UUID REFERENCES departments(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE problems ADD COLUMN assigned_officer_id UUID REFERENCES officers(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Now create our demo officer account
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
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    password = EXCLUDED.password,
    name = EXCLUDED.name;

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
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    password = EXCLUDED.password,
    name = EXCLUDED.name;

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
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    password = EXCLUDED.password,
    name = EXCLUDED.name;

-- Create officer records for the demo accounts
INSERT INTO officers (user_id, department_id, name, email, designation, employee_id)
SELECT 
    u.id,
    d.id,
    u.name,
    u.email,
    CASE 
        WHEN u.role = 'officer' THEN 'Senior Officer'
        WHEN u.role = 'department_head' THEN 'Department Head'
        ELSE 'Administrator'
    END,
    CASE 
        WHEN u.role = 'officer' THEN 'OFF001'
        WHEN u.role = 'department_head' THEN 'HEAD001'
        ELSE 'ADMIN001'
    END
FROM users u
CROSS JOIN departments d
WHERE u.email IN ('officer.demo@gov.in', 'head.demo@gov.in', 'admin.demo@gov.in')
AND u.role IN ('officer', 'department_head', 'admin')
AND d.code = 'PWD'
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 
    u.email,
    u.name,
    u.role,
    u.is_active,
    d.name as department,
    o.designation
FROM users u
LEFT JOIN officers o ON u.id = o.user_id
LEFT JOIN departments d ON o.department_id = d.id
WHERE u.role IN ('officer', 'department_head', 'admin')
ORDER BY u.role, u.name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ OFFICER DATABASE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Demo Login Credentials:';
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
    RAISE NOTICE 'You can now login through the mobile app!';
    RAISE NOTICE 'Go to Profile → Officer Portal';
    RAISE NOTICE '========================================';
END $$;
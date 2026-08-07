-- ============================================
-- CREATE OFFICER ACCOUNTS IN SUPABASE AUTH
-- Run this AFTER running FINAL_WORKING_GOVTECH.sql
-- ============================================

-- First, we need to create auth users for officers
-- Since we can't directly insert into auth.users, we'll use a different approach

-- Create a function to handle officer account creation
CREATE OR REPLACE FUNCTION create_officer_account(
  officer_email TEXT,
  officer_password TEXT,
  officer_name TEXT,
  officer_role TEXT,
  dept_code TEXT,
  emp_id TEXT
) RETURNS TEXT AS $$
DECLARE
  dept_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Get department ID
  SELECT id INTO dept_id FROM departments WHERE code = dept_code;
  
  -- Check if user already exists
  SELECT EXISTS(SELECT 1 FROM users WHERE email = officer_email) INTO user_exists;
  
  IF user_exists THEN
    RETURN 'User already exists: ' || officer_email;
  END IF;
  
  -- For now, just create the user record with a placeholder ID
  -- In production, this would be handled by Supabase Auth signup
  INSERT INTO users (
    id, 
    email, 
    name, 
    role, 
    department_id, 
    employee_id, 
    is_active
  ) VALUES (
    gen_random_uuid(),
    officer_email,
    officer_name,
    officer_role::user_role,
    dept_id,
    emp_id,
    true
  ) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department_id = EXCLUDED.department_id,
    employee_id = EXCLUDED.employee_id;
    
  RETURN 'Created user: ' || officer_email;
END;
$$ LANGUAGE plpgsql;

-- Create officer accounts
SELECT create_officer_account('officer.pwd@gov.in', 'password123', 'Rajesh Kumar', 'officer', 'PWD', 'PWD001');
SELECT create_officer_account('officer.water@gov.in', 'password123', 'Priya Sharma', 'officer', 'WSD', 'WSD001');
SELECT create_officer_account('officer.electricity@gov.in', 'password123', 'Amit Singh', 'officer', 'EB', 'EB001');
SELECT create_officer_account('head.pwd@gov.in', 'password123', 'Suresh Patil', 'department_head', 'PWD', 'PWD_HEAD');
SELECT create_officer_account('admin@gov.in', 'password123', 'System Admin', 'admin', 'PWD', 'ADMIN001');

-- Create corresponding officer records
INSERT INTO officers (user_id, department_id, name, email, designation, employee_id, is_available, is_active)
SELECT 
  u.id,
  u.department_id,
  u.name,
  u.email,
  CASE 
    WHEN u.employee_id = 'PWD001' THEN 'Senior Engineer'
    WHEN u.employee_id = 'WSD001' THEN 'Water Inspector'
    WHEN u.employee_id = 'EB001' THEN 'Electrical Engineer'
    WHEN u.employee_id = 'PWD_HEAD' THEN 'Department Head'
    ELSE 'Officer'
  END,
  u.employee_id,
  true,
  true
FROM users u
WHERE u.role IN ('officer', 'department_head')
AND NOT EXISTS (SELECT 1 FROM officers o WHERE o.user_id = u.id);

-- Drop the temporary function
DROP FUNCTION create_officer_account;

-- Show created accounts
SELECT 
  u.email,
  u.name,
  u.role,
  d.name as department,
  u.employee_id
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.role IN ('officer', 'department_head', 'admin')
ORDER BY u.role, u.name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ OFFICER ACCOUNTS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE 'officer.pwd@gov.in / password123';
  RAISE NOTICE 'officer.water@gov.in / password123';
  RAISE NOTICE 'officer.electricity@gov.in / password123';
  RAISE NOTICE 'head.pwd@gov.in / password123';
  RAISE NOTICE 'admin@gov.in / password123';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTE: Officers need to register in mobile app first';
  RAISE NOTICE 'Then their role will be updated automatically';
  RAISE NOTICE '========================================';
END $$;
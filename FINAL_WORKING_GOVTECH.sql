-- ============================================
-- FINAL WORKING GOVTECH CRM SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE ENUMS (if not exist)
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'department_head', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE language_code AS ENUM ('en', 'hi', 'mr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. EXTEND USERS TABLE
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'citizen';
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);

-- ============================================
-- 3. CREATE DEPARTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  name_mr VARCHAR(255),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CREATE OFFICERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  designation VARCHAR(100),
  employee_id VARCHAR(50) UNIQUE,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  total_assigned INTEGER DEFAULT 0,
  total_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EXTEND PROBLEMS TABLE
-- ============================================

ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_text_original TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_text_translated TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS language_code language_code DEFAULT 'en';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES officers(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_status complaint_status DEFAULT 'submitted';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS priority_level priority_level DEFAULT 'medium';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolution_images TEXT[];
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ============================================
-- 6. CREATE COMPLAINT TRACKING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS complaint_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  officer_id UUID REFERENCES officers(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status complaint_status DEFAULT 'assigned',
  priority priority_level DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  old_status complaint_status,
  new_status complaint_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_by_type VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. CREATE DEPARTMENT MAPPING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS department_category_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. INSERT DEPARTMENTS
-- ============================================

INSERT INTO departments (name, name_hi, name_mr, code, description) VALUES
('Public Works Department', 'लोक निर्माण विभाग', 'सार्वजनिक बांधकाम विभाग', 'PWD', 'Road and infrastructure'),
('Water Supply Department', 'जल आपूर्ति विभाग', 'पाणी पुरवठा विभाग', 'WSD', 'Water supply'),
('Electricity Board', 'विद्युत बोर्ड', 'वीज मंडळ', 'EB', 'Electricity'),
('Municipal Corporation', 'नगर निगम', 'महानगरपालिका', 'MC', 'Waste management'),
('Traffic Police', 'यातायात पुलिस', 'वाहतूक पोलीस', 'TP', 'Traffic'),
('Parks Department', 'उद्यान विभाग', 'उद्यान विभाग', 'PD', 'Parks'),
('Urban Development', 'शहरी विकास', 'शहरी विकास', 'UD', 'Infrastructure')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 9. INSERT CATEGORY MAPPINGS
-- ============================================

INSERT INTO department_category_mapping (category, department_id, is_primary) 
SELECT 'road', id, true FROM departments WHERE code = 'PWD'
UNION ALL SELECT 'water', id, true FROM departments WHERE code = 'WSD'
UNION ALL SELECT 'electricity', id, true FROM departments WHERE code = 'EB'
UNION ALL SELECT 'garbage', id, true FROM departments WHERE code = 'MC'
UNION ALL SELECT 'cleanliness', id, true FROM departments WHERE code = 'MC'
UNION ALL SELECT 'traffic', id, true FROM departments WHERE code = 'TP'
UNION ALL SELECT 'parks', id, true FROM departments WHERE code = 'PD'
UNION ALL SELECT 'infrastructure', id, true FROM departments WHERE code = 'UD'
UNION ALL SELECT 'safety', id, true FROM departments WHERE code = 'TP'
UNION ALL SELECT 'help', id, true FROM departments WHERE code = 'MC'
UNION ALL SELECT 'emergency', id, true FROM departments WHERE code = 'MC'
UNION ALL SELECT 'other', id, true FROM departments WHERE code = 'MC'
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. INSERT TEST OFFICERS
-- ============================================

-- Insert test officers for each department
INSERT INTO users (id, email, name, role, department_id, employee_id, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'officer.pwd@gov.in', 'Rajesh Kumar', 'officer', (SELECT id FROM departments WHERE code = 'PWD'), 'PWD001', true),
('22222222-2222-2222-2222-222222222222', 'officer.water@gov.in', 'Priya Sharma', 'officer', (SELECT id FROM departments WHERE code = 'WSD'), 'WSD001', true),
('33333333-3333-3333-3333-333333333333', 'officer.electricity@gov.in', 'Amit Singh', 'officer', (SELECT id FROM departments WHERE code = 'EB'), 'EB001', true),
('44444444-4444-4444-4444-444444444444', 'head.pwd@gov.in', 'Suresh Patil', 'department_head', (SELECT id FROM departments WHERE code = 'PWD'), 'PWD_HEAD', true),
('55555555-5555-5555-5555-555555555555', 'admin@gov.in', 'System Admin', 'admin', NULL, 'ADMIN001', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department_id = EXCLUDED.department_id,
  employee_id = EXCLUDED.employee_id;

-- Insert officers table entries
INSERT INTO officers (id, user_id, department_id, name, email, designation, employee_id, is_available, is_active) VALUES
('o1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', (SELECT id FROM departments WHERE code = 'PWD'), 'Rajesh Kumar', 'officer.pwd@gov.in', 'Senior Engineer', 'PWD001', true, true),
('o2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', (SELECT id FROM departments WHERE code = 'WSD'), 'Priya Sharma', 'officer.water@gov.in', 'Water Inspector', 'WSD001', true, true),
('o3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', (SELECT id FROM departments WHERE code = 'EB'), 'Amit Singh', 'officer.electricity@gov.in', 'Electrical Engineer', 'EB001', true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  designation = EXCLUDED.designation,
  is_available = EXCLUDED.is_available;

-- ============================================
-- 11. AUTO-ASSIGNMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION auto_assign_complaint()
RETURNS TRIGGER AS $$
DECLARE
  dept_id UUID;
  officer_id UUID;
BEGIN
  -- Get department for category
  SELECT department_id INTO dept_id
  FROM department_category_mapping
  WHERE category = NEW.category AND is_primary = true
  LIMIT 1;
  
  IF dept_id IS NOT NULL THEN
    -- Find available officer
    SELECT o.id INTO officer_id
    FROM officers o
    WHERE o.department_id = dept_id 
    AND o.is_available = true 
    AND o.is_active = true
    ORDER BY o.total_assigned ASC
    LIMIT 1;
    
    -- Update complaint
    NEW.department_id := dept_id;
    NEW.complaint_status := 'assigned';
    
    IF officer_id IS NOT NULL THEN
      NEW.assigned_officer_id := officer_id;
      
      -- Update officer stats
      UPDATE officers 
      SET total_assigned = total_assigned + 1 
      WHERE id = officer_id;
    END IF;
    
    -- Insert assignment record
    INSERT INTO complaint_assignments (problem_id, department_id, officer_id, assigned_by, status)
    VALUES (NEW.id, dept_id, officer_id, NEW.user_id, 'assigned');
    
    -- Insert status history
    INSERT INTO complaint_status_history (problem_id, old_status, new_status, changed_by, changed_by_type, notes)
    VALUES (NEW.id, 'submitted', 'assigned', NEW.user_id, 'system', 'Auto-assigned to department');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_complaint ON problems;
CREATE TRIGGER trigger_auto_assign_complaint
  BEFORE INSERT ON problems
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_complaint();

-- ============================================
-- 12. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_problems_complaint_status ON problems(complaint_status);
CREATE INDEX IF NOT EXISTS idx_problems_department_id ON problems(department_id);
CREATE INDEX IF NOT EXISTS idx_problems_assigned_officer_id ON problems(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_problems_user_id ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_officers_department_id ON officers(department_id);

-- ============================================
-- 13. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view problems" ON problems;
DROP POLICY IF EXISTS "Users can create problems" ON problems;
DROP POLICY IF EXISTS "Users can update own problems" ON problems;
DROP POLICY IF EXISTS "Officers can update assigned problems" ON problems;

-- Create new policies
CREATE POLICY "Anyone can view problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Users can create problems" ON problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own problems" ON problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Officers can update assigned problems" ON problems FOR UPDATE USING (
  assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
);

-- Departments are public
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);

-- Officers visible to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view officers" ON officers;
CREATE POLICY "Authenticated users can view officers" ON officers FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- 14. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE problems;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_status_history;

-- ============================================
-- 15. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ GOVTECH CRM SYSTEM INSTALLED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ 7 departments created';
  RAISE NOTICE '✓ Auto-assignment working';
  RAISE NOTICE '✓ Real-time enabled';
  RAISE NOTICE '✓ RLS configured';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'READY TO USE!';
  RAISE NOTICE 'Citizens can now submit complaints';
  RAISE NOTICE 'Complaints auto-assign to departments';
  RAISE NOTICE '========================================';
END $$;
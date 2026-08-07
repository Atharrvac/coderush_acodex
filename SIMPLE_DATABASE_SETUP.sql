-- ============================================
-- SIMPLE DATABASE SETUP - RUN THIS FIRST
-- ============================================

-- 1. Create enums if they don't exist
DO $$ BEGIN 
    CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'department_head', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role user_role DEFAULT 'citizen';
    END IF;
END $$;

-- 3. Add other GovTech columns to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department_id') THEN
        ALTER TABLE users ADD COLUMN department_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'employee_id') THEN
        ALTER TABLE users ADD COLUMN employee_id VARCHAR(50);
    END IF;
END $$;

-- 4. Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert departments
INSERT INTO departments (name, code, description) VALUES
('Public Works Department', 'PWD', 'Road and infrastructure'),
('Water Supply Department', 'WSD', 'Water supply'),
('Electricity Board', 'EB', 'Electricity'),
('Municipal Corporation', 'MC', 'Waste management'),
('Traffic Police', 'TP', 'Traffic'),
('Parks Department', 'PD', 'Parks'),
('Urban Development', 'UD', 'Infrastructure')
ON CONFLICT (code) DO NOTHING;

-- 6. Add GovTech columns to problems table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'complaint_status') THEN
        ALTER TABLE problems ADD COLUMN complaint_status VARCHAR(20) DEFAULT 'submitted';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'department_id') THEN
        ALTER TABLE problems ADD COLUMN department_id UUID REFERENCES departments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'language_code') THEN
        ALTER TABLE problems ADD COLUMN language_code VARCHAR(5) DEFAULT 'en';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'priority_level') THEN
        ALTER TABLE problems ADD COLUMN priority_level VARCHAR(10) DEFAULT 'medium';
    END IF;
    
    -- Cost Analysis columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'estimated_cost_min') THEN
        ALTER TABLE problems ADD COLUMN estimated_cost_min INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'estimated_cost_max') THEN
        ALTER TABLE problems ADD COLUMN estimated_cost_max INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'cost_analysis') THEN
        ALTER TABLE problems ADD COLUMN cost_analysis JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'severity_level') THEN
        ALTER TABLE problems ADD COLUMN severity_level VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'estimated_completion_time') THEN
        ALTER TABLE problems ADD COLUMN estimated_completion_time VARCHAR(20);
    END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ BASIC GOVTECH SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Role column added to users';
  RAISE NOTICE '✓ Departments created';
  RAISE NOTICE '✓ GovTech columns added';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Now you can:';
  RAISE NOTICE '1. Register officers in mobile app';
  RAISE NOTICE '2. Use government dashboard mock login';
  RAISE NOTICE '3. Submit complaints from mobile app';
  RAISE NOTICE '========================================';
END $$;
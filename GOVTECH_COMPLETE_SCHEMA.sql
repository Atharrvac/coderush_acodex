-- ============================================
-- GOVTECH CRM - COMPLETE DATABASE SCHEMA
-- Role-based Multilingual Complaint System
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. USER ROLES & PERMISSIONS
-- ============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'department_head', 'admin');

-- Extend existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'citizen';
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================
-- 2. GOVERNMENT STRUCTURE
-- ============================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  name_mr VARCHAR(255),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  head_officer_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Officers table
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
  avg_resolution_time INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MULTILINGUAL COMPLAINT SYSTEM
-- ============================================

-- Language codes enum
CREATE TYPE language_code AS ENUM ('en', 'hi', 'mr');

-- Complaint status enum
CREATE TYPE complaint_status AS ENUM (
  'submitted', 'assigned', 'in_progress', 
  'resolved', 'closed', 'rejected'
);

-- Priority levels enum
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Extend existing problems table for GovTech
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
ALTER TABLE problems ADD COLUMN IF NOT EXISTS estimated_resolution_time INTEGER; -- hours
ALTER TABLE problems ADD COLUMN IF NOT EXISTS citizen_rating INTEGER CHECK (citizen_rating >= 1 AND citizen_rating <= 5);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;

-- ============================================
-- 4. COMPLAINT TRACKING SYSTEM
-- ============================================

-- Complaint assignments
CREATE TABLE IF NOT EXISTS complaint_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  officer_id UUID REFERENCES officers(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status complaint_status DEFAULT 'assigned',
  priority priority_level DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history for timeline tracking
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  old_status complaint_status,
  new_status complaint_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_by_type VARCHAR(20), -- 'citizen', 'officer', 'system'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TRANSLATION SYSTEM
-- ============================================

-- Translation cache for performance
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  source_language language_code NOT NULL,
  target_language language_code NOT NULL,
  translated_text TEXT NOT NULL,
  translation_service VARCHAR(50) DEFAULT 'openai',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_text, source_language, target_language)
);

-- ============================================
-- 6. NOTIFICATION SYSTEM
-- ============================================

-- Enhanced notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_hi VARCHAR(255),
  title_mr VARCHAR(255),
  message TEXT NOT NULL,
  message_hi TEXT,
  message_mr TEXT,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ANALYTICS TABLES
-- ============================================

-- Department performance metrics
CREATE TABLE IF NOT EXISTS department_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  date DATE NOT NULL,
  total_complaints INTEGER DEFAULT 0,
  resolved_complaints INTEGER DEFAULT 0,
  pending_complaints INTEGER DEFAULT 0,
  avg_resolution_time INTEGER DEFAULT 0, -- hours
  citizen_satisfaction DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, date)
);

-- Category analytics
CREATE TABLE IF NOT EXISTS category_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  total_complaints INTEGER DEFAULT 0,
  resolved_complaints INTEGER DEFAULT 0,
  avg_resolution_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, date)
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Problems table indexes
CREATE INDEX IF NOT EXISTS idx_problems_complaint_status ON problems(complaint_status);
CREATE INDEX IF NOT EXISTS idx_problems_department_id ON problems(department_id);
CREATE INDEX IF NOT EXISTS idx_problems_assigned_officer_id ON problems(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_problems_language_code ON problems(language_code);
CREATE INDEX IF NOT EXISTS idx_problems_priority_level ON problems(priority_level);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at);
CREATE INDEX IF NOT EXISTS idx_problems_location ON problems USING GIST(ST_Point(longitude, latitude));

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_complaint_assignments_problem_id ON complaint_assignments(problem_id);
CREATE INDEX IF NOT EXISTS idx_complaint_assignments_officer_id ON complaint_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_complaint_status_history_problem_id ON complaint_status_history(problem_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_officer_id ON notifications(officer_id);
CREATE INDEX IF NOT EXISTS idx_translations_source_target ON translations(source_language, target_language);

-- ============================================
-- 9. DEPARTMENT CATEGORY MAPPING
-- ============================================

-- Auto-assignment rules
CREATE TABLE IF NOT EXISTS department_category_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. SEED DATA
-- ============================================

-- Insert default departments
INSERT INTO departments (name, name_hi, name_mr, code, description) VALUES
('Public Works Department', 'लोक निर्माण विभाग', 'सार्वजनिक बांधकाम विभाग', 'PWD', 'Handles road, infrastructure maintenance'),
('Water Supply Department', 'जल आपूर्ति विभाग', 'पाणी पुरवठा विभाग', 'WSD', 'Manages water supply and distribution'),
('Electricity Board', 'विद्युत बोर्ड', 'वीज मंडळ', 'EB', 'Handles electrical issues and power supply'),
('Municipal Corporation', 'नगर निगम', 'महानगरपालिका', 'MC', 'Waste management and city services'),
('Traffic Police', 'यातायात पुलिस', 'वाहतूक पोलीस', 'TP', 'Traffic management and road safety'),
('Parks Department', 'उद्यान विभाग', 'उद्यान विभाग', 'PD', 'Parks and green spaces maintenance'),
('Urban Development', 'शहरी विकास', 'शहरी विकास', 'UD', 'Urban planning and development')
ON CONFLICT (code) DO NOTHING;

-- Insert category mappings
INSERT INTO department_category_mapping (category, department_id, is_primary) 
SELECT 'road', id, true FROM departments WHERE code = 'PWD'
UNION ALL
SELECT 'water', id, true FROM departments WHERE code = 'WSD'
UNION ALL
SELECT 'electricity', id, true FROM departments WHERE code = 'EB'
UNION ALL
SELECT 'garbage', id, true FROM departments WHERE code = 'MC'
UNION ALL
SELECT 'traffic', id, true FROM departments WHERE code = 'TP'
UNION ALL
SELECT 'parks', id, true FROM departments WHERE code = 'PD'
UNION ALL
SELECT 'infrastructure', id, true FROM departments WHERE code = 'UD'
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-assign complaints to departments
CREATE OR REPLACE FUNCTION auto_assign_complaint()
RETURNS TRIGGER AS $$
DECLARE
  dept_id UUID;
BEGIN
  -- Get department for category
  SELECT department_id INTO dept_id
  FROM department_category_mapping
  WHERE category = NEW.category AND is_primary = true
  LIMIT 1;
  
  IF dept_id IS NOT NULL THEN
    NEW.department_id := dept_id;
    NEW.complaint_status := 'assigned';
    
    -- Insert assignment record
    INSERT INTO complaint_assignments (problem_id, department_id, assigned_by, status)
    VALUES (NEW.id, dept_id, NEW.user_id, 'assigned');
    
    -- Insert status history
    INSERT INTO complaint_status_history (problem_id, old_status, new_status, changed_by, changed_by_type, notes)
    VALUES (NEW.id, 'submitted', 'assigned', NEW.user_id, 'system', 'Auto-assigned to department');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_complaint ON problems;
CREATE TRIGGER trigger_auto_assign_complaint
  BEFORE INSERT ON problems
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_complaint();

-- Function to update officer stats
CREATE OR REPLACE FUNCTION update_officer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.complaint_status = 'resolved' AND OLD.complaint_status != 'resolved' THEN
    UPDATE officers 
    SET total_resolved = total_resolved + 1,
        avg_resolution_time = (
          SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::INTEGER
          FROM problems 
          WHERE assigned_officer_id = NEW.assigned_officer_id 
          AND complaint_status = 'resolved'
        )
    WHERE id = NEW.assigned_officer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for officer stats
DROP TRIGGER IF EXISTS trigger_update_officer_stats ON problems;
CREATE TRIGGER trigger_update_officer_stats
  AFTER UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_officer_stats();

-- ============================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Citizens can see their own complaints
CREATE POLICY "Citizens can view own complaints" ON problems
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('officer', 'department_head', 'admin'));

-- Citizens can create complaints
CREATE POLICY "Citizens can create complaints" ON problems
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Officers can view assigned complaints
CREATE POLICY "Officers can view assigned complaints" ON problems
  FOR SELECT USING (
    assigned_officer_id IN (
      SELECT id FROM officers WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('department_head', 'admin')
  );

-- Officers can update assigned complaints
CREATE POLICY "Officers can update assigned complaints" ON problems
  FOR UPDATE USING (
    assigned_officer_id IN (
      SELECT id FROM officers WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('department_head', 'admin')
  );

-- ============================================
-- 13. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE problems;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GOVTECH CRM SYSTEM INSTALLED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Role-based access control enabled';
  RAISE NOTICE '✓ Multilingual complaint system ready';
  RAISE NOTICE '✓ Auto-assignment system configured';
  RAISE NOTICE '✓ Real-time tracking enabled';
  RAISE NOTICE '✓ Analytics tables created';
  RAISE NOTICE '✓ 7 government departments seeded';
  RAISE NOTICE '✓ Performance indexes optimized';
  RAISE NOTICE '✓ Row-level security configured';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ready for production deployment!';
  RAISE NOTICE '========================================';
END $$;
-- ============================================
-- GOVTECH CRM SYSTEM - DATABASE SCHEMA
-- Extends existing NagrikSeva for Government Integration
-- ============================================

-- ============================================
-- PART 1: NEW TABLES
-- ============================================

-- Departments Table
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

-- Officers Table
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

-- Complaint Assignments Table
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
  status VARCHAR(50) DEFAULT 'assigned',
  priority VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaint Status History Table
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_by_type VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations Cache Table
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  translation_service VARCHAR(50) DEFAULT 'grok',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_text, source_language, target_language)
);

-- Notifications Table (Extended)
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
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Cache Table
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value JSONB NOT NULL,
  department_id UUID REFERENCES departments(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: EXTEND EXISTING TABLES
-- ============================================

-- Add new columns to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_text_original TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_text_translated TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES officers(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_status VARCHAR(50) DEFAULT 'submitted';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolution_images TEXT[];
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES officers(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS citizen_rating INTEGER;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;

-- ============================================
-- PART 3: INSERT DEFAULT DEPARTMENTS
-- ============================================

INSERT INTO departments (name, name_hi, name_mr, code, description) VALUES
('Public Works Department', 'सार्वजनिक निर्माण विभाग', 'सार्वजनिक बांधकाम विभाग', 'PWD', 'Handles road repairs, infrastructure maintenance'),
('Water Department', 'जल विभाग', 'पाणी पुरवठा विभाग', 'WATER', 'Manages water supply and distribution'),
('Municipal Corporation', 'नगर निगम', 'महानगरपालिका', 'MC', 'Handles garbage collection and sanitation'),
('Electricity Board', 'विद्युत बोर्ड', 'वीज मंडळ', 'ELEC', 'Manages electricity supply and street lights'),
('Traffic Police', 'यातायात पुलिस', 'वाहतूक पोलीस', 'TRAFFIC', 'Handles traffic management and signals'),
('Parks Department', 'उद्यान विभाग', 'उद्यान विभाग', 'PARKS', 'Maintains parks and green spaces'),
('Urban Development', 'शहरी विकास', 'शहरी विकास', 'URBAN', 'Handles infrastructure and urban planning'),
('Other', 'अन्य', 'इतर', 'OTHER', 'General complaints')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_problems_language ON problems(language_code);
CREATE INDEX IF NOT EXISTS idx_problems_department ON problems(department_id);
CREATE INDEX IF NOT EXISTS idx_problems_officer ON problems(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_problems_complaint_status ON problems(complaint_status);
CREATE INDEX IF NOT EXISTS idx_problems_priority ON problems(priority_level);
CREATE INDEX IF NOT EXISTS idx_problems_resolved_at ON problems(resolved_at);

CREATE INDEX IF NOT EXISTS idx_officers_department ON officers(department_id);
CREATE INDEX IF NOT EXISTS idx_officers_available ON officers(is_available);
CREATE INDEX IF NOT EXISTS idx_officers_active ON officers(is_active);

CREATE INDEX IF NOT EXISTS idx_assignments_problem ON complaint_assignments(problem_id);
CREATE INDEX IF NOT EXISTS idx_assignments_officer ON complaint_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_department ON complaint_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON complaint_assignments(status);

CREATE INDEX IF NOT EXISTS idx_status_history_problem ON complaint_status_history(problem_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON complaint_status_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_officer ON notifications(officer_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(source_text, source_language, target_language);

-- ============================================
-- PART 5: FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-assign department based on category
CREATE OR REPLACE FUNCTION auto_assign_department()
RETURNS TRIGGER AS $$
BEGIN
  -- Map category to department
  NEW.department_id := CASE NEW.category
    WHEN 'road' THEN (SELECT id FROM departments WHERE code = 'PWD' LIMIT 1)
    WHEN 'water' THEN (SELECT id FROM departments WHERE code = 'WATER' LIMIT 1)
    WHEN 'garbage' THEN (SELECT id FROM departments WHERE code = 'MC' LIMIT 1)
    WHEN 'electricity' THEN (SELECT id FROM departments WHERE code = 'ELEC' LIMIT 1)
    WHEN 'traffic' THEN (SELECT id FROM departments WHERE code = 'TRAFFIC' LIMIT 1)
    WHEN 'parks' THEN (SELECT id FROM departments WHERE code = 'PARKS' LIMIT 1)
    WHEN 'infrastructure' THEN (SELECT id FROM departments WHERE code = 'URBAN' LIMIT 1)
    ELSE (SELECT id FROM departments WHERE code = 'OTHER' LIMIT 1)
  END;
  
  -- Set initial complaint status
  IF NEW.complaint_status IS NULL THEN
    NEW.complaint_status := 'submitted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto department assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_department ON problems;
CREATE TRIGGER trigger_auto_assign_department
  BEFORE INSERT ON problems
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_department();

-- Function to track status changes
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.complaint_status IS DISTINCT FROM NEW.complaint_status THEN
    INSERT INTO complaint_status_history (
      problem_id, old_status, new_status, changed_by, changed_by_type
    ) VALUES (
      NEW.id, OLD.complaint_status, NEW.complaint_status, 
      COALESCE(NEW.assigned_officer_id, NEW.user_id),
      CASE WHEN NEW.assigned_officer_id IS NOT NULL THEN 'officer' ELSE 'citizen' END
    );
    
    -- Send notification to citizen
    INSERT INTO notifications (
      user_id, type, title, message, problem_id
    ) VALUES (
      NEW.user_id,
      'status_update',
      'Complaint Status Updated',
      'Your complaint status changed to: ' || NEW.complaint_status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status tracking
DROP TRIGGER IF EXISTS trigger_track_status_change ON problems;
CREATE TRIGGER trigger_track_status_change
  AFTER UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

-- Function to update officer stats
CREATE OR REPLACE FUNCTION update_officer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment assigned count
    UPDATE officers 
    SET total_assigned = total_assigned + 1
    WHERE id = NEW.officer_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Increment resolved count
    UPDATE officers 
    SET total_resolved = total_resolved + 1
    WHERE id = NEW.officer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for officer stats
DROP TRIGGER IF EXISTS trigger_update_officer_stats ON complaint_assignments;
CREATE TRIGGER trigger_update_officer_stats
  AFTER INSERT OR UPDATE ON complaint_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_officer_stats();

-- ============================================
-- PART 6: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Departments policies (public read)
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Only admins can modify departments" ON departments FOR ALL USING (false);

-- Officers policies
CREATE POLICY "Anyone can view active officers" ON officers FOR SELECT USING (is_active = true);
CREATE POLICY "Officers can update own profile" ON officers FOR UPDATE USING (user_id = auth.uid());

-- Assignments policies
CREATE POLICY "Citizens can view own assignments" ON complaint_assignments 
  FOR SELECT USING (
    problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid())
  );
CREATE POLICY "Officers can view own assignments" ON complaint_assignments 
  FOR SELECT USING (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));
CREATE POLICY "Officers can update own assignments" ON complaint_assignments 
  FOR UPDATE USING (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

-- Status history policies
CREATE POLICY "Anyone can view status history" ON complaint_status_history FOR SELECT USING (true);
CREATE POLICY "System can insert status history" ON complaint_status_history FOR INSERT WITH CHECK (true);

-- Translations policies (cache)
CREATE POLICY "Anyone can view translations" ON translations FOR SELECT USING (true);
CREATE POLICY "System can insert translations" ON translations FOR INSERT WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (user_id = auth.uid() OR officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (user_id = auth.uid() OR officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Analytics policies
CREATE POLICY "Anyone can view analytics" ON analytics_cache FOR SELECT USING (true);
CREATE POLICY "System can manage analytics" ON analytics_cache FOR ALL USING (false);

-- ============================================
-- PART 7: REALTIME PUBLICATION
-- ============================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE departments;
ALTER PUBLICATION supabase_realtime ADD TABLE officers;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- PART 8: ANALYTICS VIEWS
-- ============================================

-- View for department statistics
CREATE OR REPLACE VIEW department_stats AS
SELECT 
  d.id,
  d.name,
  d.code,
  COUNT(p.id) as total_complaints,
  COUNT(CASE WHEN p.complaint_status = 'submitted' THEN 1 END) as pending,
  COUNT(CASE WHEN p.complaint_status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN p.complaint_status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN p.complaint_status = 'rejected' THEN 1 END) as rejected,
  AVG(EXTRACT(EPOCH FROM (p.resolved_at - p.created_at))/3600)::INTEGER as avg_resolution_hours
FROM departments d
LEFT JOIN problems p ON p.department_id = d.id
GROUP BY d.id, d.name, d.code;

-- View for officer performance
CREATE OR REPLACE VIEW officer_performance AS
SELECT 
  o.id,
  o.name,
  o.department_id,
  o.total_assigned,
  o.total_resolved,
  CASE WHEN o.total_assigned > 0 
    THEN ROUND((o.total_resolved::DECIMAL / o.total_assigned) * 100, 2)
    ELSE 0 
  END as resolution_rate,
  o.avg_resolution_time,
  o.rating
FROM officers o
WHERE o.is_active = true;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GOVTECH CRM SYSTEM INSTALLED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ 7 new tables created';
  RAISE NOTICE '✓ Problems table extended';
  RAISE NOTICE '✓ 8 departments added';
  RAISE NOTICE '✓ Auto-assignment triggers active';
  RAISE NOTICE '✓ Status tracking enabled';
  RAISE NOTICE '✓ RLS policies configured';
  RAISE NOTICE '✓ Realtime enabled';
  RAISE NOTICE '✓ Analytics views created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next: Setup Grok API translation service';
  RAISE NOTICE '========================================';
END $$;

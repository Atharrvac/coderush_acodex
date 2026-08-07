-- ============================================
-- GOVTECH CRM - PART 5: ROW LEVEL SECURITY
-- Run this after Part 4
-- ============================================

-- Enable RLS on new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Departments policies
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);

-- Officers policies
DROP POLICY IF EXISTS "Anyone can view active officers" ON officers;
CREATE POLICY "Anyone can view active officers" ON officers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Officers can update own profile" ON officers;
CREATE POLICY "Officers can update own profile" ON officers FOR UPDATE USING (user_id = auth.uid());

-- Assignments policies
DROP POLICY IF EXISTS "Citizens can view own assignments" ON complaint_assignments;
CREATE POLICY "Citizens can view own assignments" ON complaint_assignments 
  FOR SELECT USING (
    problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Officers can view own assignments" ON complaint_assignments;
CREATE POLICY "Officers can view own assignments" ON complaint_assignments 
  FOR SELECT USING (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Officers can update own assignments" ON complaint_assignments;
CREATE POLICY "Officers can update own assignments" ON complaint_assignments 
  FOR UPDATE USING (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

-- Status history policies
DROP POLICY IF EXISTS "Anyone can view status history" ON complaint_status_history;
CREATE POLICY "Anyone can view status history" ON complaint_status_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert status history" ON complaint_status_history;
CREATE POLICY "System can insert status history" ON complaint_status_history FOR INSERT WITH CHECK (true);

-- Translations policies
DROP POLICY IF EXISTS "Anyone can view translations" ON translations;
CREATE POLICY "Anyone can view translations" ON translations FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert translations" ON translations;
CREATE POLICY "System can insert translations" ON translations FOR INSERT WITH CHECK (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (user_id = auth.uid() OR officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (user_id = auth.uid() OR officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Analytics policies
DROP POLICY IF EXISTS "Anyone can view analytics" ON analytics_cache;
CREATE POLICY "Anyone can view analytics" ON analytics_cache FOR SELECT USING (true);

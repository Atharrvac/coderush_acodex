-- ============================================
-- GOVTECH CRM - PART 3: CREATE INDEXES
-- Run this after Part 2
-- ============================================

-- Problems table indexes
CREATE INDEX IF NOT EXISTS idx_problems_language ON problems(language_code);
CREATE INDEX IF NOT EXISTS idx_problems_department ON problems(department_id);
CREATE INDEX IF NOT EXISTS idx_problems_officer ON problems(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_problems_complaint_status ON problems(complaint_status);
CREATE INDEX IF NOT EXISTS idx_problems_priority ON problems(priority_level);
CREATE INDEX IF NOT EXISTS idx_problems_resolved_at ON problems(resolved_at);

-- Officers table indexes
CREATE INDEX IF NOT EXISTS idx_officers_department ON officers(department_id);
CREATE INDEX IF NOT EXISTS idx_officers_available ON officers(is_available);
CREATE INDEX IF NOT EXISTS idx_officers_active ON officers(is_active);

-- Assignments table indexes
CREATE INDEX IF NOT EXISTS idx_assignments_problem ON complaint_assignments(problem_id);
CREATE INDEX IF NOT EXISTS idx_assignments_officer ON complaint_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_department ON complaint_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON complaint_assignments(status);

-- Status history indexes
CREATE INDEX IF NOT EXISTS idx_status_history_problem ON complaint_status_history(problem_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON complaint_status_history(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_officer ON notifications(officer_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Translations index
CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(source_text, source_language, target_language);

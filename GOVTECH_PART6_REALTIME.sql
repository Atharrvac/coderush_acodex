-- ============================================
-- GOVTECH CRM - PART 6: ENABLE REALTIME & VIEWS
-- Run this after Part 5 (FINAL STEP)
-- ============================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE departments;
ALTER PUBLICATION supabase_realtime ADD TABLE officers;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create analytics views
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GOVTECH CRM SYSTEM INSTALLED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ All tables created';
  RAISE NOTICE '✓ Problems table extended';
  RAISE NOTICE '✓ 8 departments added';
  RAISE NOTICE '✓ Triggers active';
  RAISE NOTICE '✓ RLS policies configured';
  RAISE NOTICE '✓ Realtime enabled';
  RAISE NOTICE '✓ Views created';
  RAISE NOTICE '========================================';
END $$;

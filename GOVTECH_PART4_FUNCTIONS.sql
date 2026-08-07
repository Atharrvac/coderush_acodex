-- ============================================
-- GOVTECH CRM - PART 4: FUNCTIONS & TRIGGERS
-- Run this after Part 3
-- ============================================

-- Function: Auto-assign department based on category
CREATE OR REPLACE FUNCTION auto_assign_department()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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
  
  IF NEW.complaint_status IS NULL THEN
    NEW.complaint_status := 'submitted';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto department assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_department ON problems;
CREATE TRIGGER trigger_auto_assign_department
  BEFORE INSERT ON problems
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_department();

-- Function: Track status changes
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.complaint_status IS DISTINCT FROM NEW.complaint_status THEN
    INSERT INTO complaint_status_history (
      problem_id, old_status, new_status, changed_by, changed_by_type
    ) VALUES (
      NEW.id, OLD.complaint_status, NEW.complaint_status, 
      COALESCE(NEW.assigned_officer_id, NEW.user_id),
      CASE WHEN NEW.assigned_officer_id IS NOT NULL THEN 'officer' ELSE 'citizen' END
    );
    
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
$$;

-- Trigger for status tracking
DROP TRIGGER IF EXISTS trigger_track_status_change ON problems;
CREATE TRIGGER trigger_track_status_change
  AFTER UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

-- Function: Update officer stats
CREATE OR REPLACE FUNCTION update_officer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE officers 
    SET total_assigned = total_assigned + 1
    WHERE id = NEW.officer_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE officers 
    SET total_resolved = total_resolved + 1
    WHERE id = NEW.officer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for officer stats
DROP TRIGGER IF EXISTS trigger_update_officer_stats ON complaint_assignments;
CREATE TRIGGER trigger_update_officer_stats
  AFTER INSERT OR UPDATE ON complaint_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_officer_stats();

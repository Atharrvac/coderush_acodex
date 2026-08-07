-- JanMitra Update: Hybrid Routing & 12-Hour SLA Logic

-- 1. Add new columns to problems table
ALTER TABLE problems
ADD COLUMN IF NOT EXISTS forwarded_to_gov BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_time TIMESTAMPTZ;

-- 2. Create a function to check and escalate expired problems
CREATE OR REPLACE FUNCTION check_and_escalate_problems()
RETURNS void AS $$
BEGIN
  -- Find problems that are being helped (by a citizen)
  -- but the 12-hour escalation time has passed
  UPDATE problems
  SET 
    forwarded_to_gov = true,
    status = 'escalated'
  WHERE 
    status = 'being_helped' 
    AND escalation_time IS NOT NULL 
    AND escalation_time < NOW()
    AND forwarded_to_gov = false;
END;
$$ LANGUAGE plpgsql;

-- Note: You should set up a pg_cron job in Supabase to run this function every hour, or call it manually:
-- SELECT cron.schedule('escalate-hourly', '0 * * * *', 'SELECT check_and_escalate_problems()');

-- 3. Modify update_user_stats trigger to set escalation_time when a citizen starts helping
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET problems_posted = problems_posted + 1 WHERE id = NEW.user_id;
  END IF;
  
  -- When a problem transitions to being_helped (a citizen accepts it), start the 12-hour timer
  IF TG_OP = 'UPDATE' AND OLD.status = 'posted' AND NEW.status = 'being_helped' THEN
    NEW.escalation_time = NOW() + INTERVAL '12 hours';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status != 'solved' AND NEW.status = 'solved' AND NEW.helper_id IS NOT NULL THEN
    UPDATE users SET problems_solved = problems_solved + 1 WHERE id = NEW.helper_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger as a BEFORE trigger so NEW modifications are saved
DROP TRIGGER IF EXISTS update_stats_on_problem ON problems;

CREATE TRIGGER update_stats_on_problem
  BEFORE INSERT OR UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Viral Features Migration V2 (Fixed)
-- Upvotes, Achievements, Activity Feed, Points System

-- ============================================
-- STEP 1: Add columns to existing tables
-- ============================================

-- Add vote counts to problems table
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS affected_people INTEGER DEFAULT 1;

-- Add constraint for urgency
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'problems_urgency_check'
  ) THEN
    ALTER TABLE problems 
    ADD CONSTRAINT problems_urgency_check 
    CHECK (urgency IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

-- Add points and level to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_name VARCHAR(50) DEFAULT 'Citizen',
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- STEP 2: Create new tables
-- ============================================

-- Problem Votes Table
CREATE TABLE IF NOT EXISTS problem_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  points INTEGER DEFAULT 0,
  criteria JSONB,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_problem_votes_problem ON problem_votes(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_votes_user ON problem_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_trending ON problems(trending_score DESC) WHERE status != 'solved';
CREATE INDEX IF NOT EXISTS idx_problems_impact ON problems(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_problems_urgency ON problems(urgency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);

-- ============================================
-- STEP 4: Insert default achievements
-- ============================================

INSERT INTO achievements (code, name, description, icon, points, tier, criteria) VALUES
('first_responder', 'First Responder', 'Helped within 1 hour of problem posting', '🥇', 50, 'gold', '{"response_time": 3600}'),
('problem_solver', 'Problem Solver', 'Solved 10 problems', '🌟', 100, 'gold', '{"problems_solved": 10}'),
('speed_demon', 'Speed Demon', 'Solved problem in under 30 minutes', '⚡', 75, 'gold', '{"solve_time": 1800}'),
('local_legend', 'Local Legend', 'Top helper in your area', '🏆', 200, 'platinum', '{"rank": 1}'),
('community_hero', 'Community Hero', 'Helped 50 people', '🦸', 150, 'gold', '{"people_helped": 50}'),
('early_bird', 'Early Bird', 'First to report a problem', '🐦', 25, 'bronze', '{"first_reporter": true}'),
('photographer', 'Photographer', 'Added photos to 20 problems', '📸', 50, 'silver', '{"photos_added": 20}'),
('consistent', 'Consistent Helper', 'Helped for 7 days straight', '📅', 100, 'gold', '{"consecutive_days": 7}'),
('night_owl', 'Night Owl', 'Helped between 10 PM - 6 AM', '🦉', 50, 'silver', '{"night_help": true}'),
('team_player', 'Team Player', 'Collaborated with 10 different helpers', '🤝', 75, 'silver', '{"collaborations": 10}')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- STEP 5: Create functions
-- ============================================

-- Function to update problem vote counts
CREATE OR REPLACE FUNCTION update_problem_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = upvotes + 1 WHERE id = NEW.problem_id;
    ELSE
      UPDATE problems SET downvotes = downvotes + 1 WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.problem_id;
    ELSE
      UPDATE problems SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.problem_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.problem_id;
    ELSE
      UPDATE problems SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.problem_id;
    END IF;
    IF NEW.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = upvotes + 1 WHERE id = NEW.problem_id;
    ELSE
      UPDATE problems SET downvotes = downvotes + 1 WHERE id = NEW.problem_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason VARCHAR,
  p_problem_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert points transaction
  INSERT INTO user_points (user_id, points, reason, problem_id)
  VALUES (p_user_id, p_points, p_reason, p_problem_id);
  
  -- Update user total points
  UPDATE users 
  SET total_points = total_points + p_points
  WHERE id = p_user_id;
  
  -- Update level based on points
  UPDATE users
  SET 
    level = CASE
      WHEN total_points >= 10000 THEN 7
      WHEN total_points >= 5000 THEN 6
      WHEN total_points >= 2500 THEN 5
      WHEN total_points >= 1000 THEN 4
      WHEN total_points >= 500 THEN 3
      WHEN total_points >= 100 THEN 2
      ELSE 1
    END,
    level_name = CASE
      WHEN total_points >= 10000 THEN 'State Leader'
      WHEN total_points >= 5000 THEN 'City Guardian'
      WHEN total_points >= 2500 THEN 'Civic Champion'
      WHEN total_points >= 1000 THEN 'Local Hero'
      WHEN total_points >= 500 THEN 'Community Helper'
      WHEN total_points >= 100 THEN 'Active Citizen'
      ELSE 'Citizen'
    END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add activity to feed
CREATE OR REPLACE FUNCTION add_activity_feed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'problems' THEN
      INSERT INTO activity_feed (user_id, problem_id, activity_type, description)
      VALUES (NEW.user_id, NEW.id, 'problem_posted', 'Posted a new problem: ' || NEW.title);
    ELSIF TG_TABLE_NAME = 'problem_votes' THEN
      INSERT INTO activity_feed (user_id, problem_id, activity_type, description)
      VALUES (NEW.user_id, NEW.problem_id, 'problem_voted', 'Voted on a problem');
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'problems' AND OLD.status != NEW.status THEN
      IF NEW.status = 'being_helped' AND NEW.helper_id IS NOT NULL THEN
        INSERT INTO activity_feed (user_id, problem_id, activity_type, description)
        VALUES (NEW.helper_id, NEW.id, 'problem_helped', 'Started helping with: ' || NEW.title);
      ELSIF NEW.status = 'solved' AND NEW.helper_id IS NOT NULL THEN
        INSERT INTO activity_feed (user_id, problem_id, activity_type, description)
        VALUES (NEW.helper_id, NEW.id, 'problem_solved', 'Solved problem: ' || NEW.title);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto award points
CREATE OR REPLACE FUNCTION auto_award_points()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'problems' THEN
      PERFORM award_points(NEW.user_id, 10, 'Problem reported', NEW.id);
    ELSIF TG_TABLE_NAME = 'problem_votes' THEN
      PERFORM award_points(NEW.user_id, 5, 'Voted on problem', NEW.problem_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'problems' AND OLD.status != NEW.status THEN
      IF NEW.status = 'being_helped' AND NEW.helper_id IS NOT NULL THEN
        PERFORM award_points(NEW.helper_id, 50, 'Started helping', NEW.id);
      ELSIF NEW.status = 'solved' AND NEW.helper_id IS NOT NULL THEN
        PERFORM award_points(NEW.helper_id, 100, 'Problem solved', NEW.id);
        PERFORM award_points(NEW.user_id, 25, 'Problem resolved', NEW.id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Create triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_problem_votes ON problem_votes;
CREATE TRIGGER trigger_update_problem_votes
AFTER INSERT OR UPDATE OR DELETE ON problem_votes
FOR EACH ROW EXECUTE FUNCTION update_problem_votes();

DROP TRIGGER IF EXISTS trigger_activity_feed_problems ON problems;
CREATE TRIGGER trigger_activity_feed_problems
AFTER INSERT OR UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION add_activity_feed();

DROP TRIGGER IF EXISTS trigger_activity_feed_votes ON problem_votes;
CREATE TRIGGER trigger_activity_feed_votes
AFTER INSERT ON problem_votes
FOR EACH ROW EXECUTE FUNCTION add_activity_feed();

DROP TRIGGER IF EXISTS trigger_auto_award_points_problems ON problems;
CREATE TRIGGER trigger_auto_award_points_problems
AFTER INSERT OR UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION auto_award_points();

DROP TRIGGER IF EXISTS trigger_auto_award_points_votes ON problem_votes;
CREATE TRIGGER trigger_auto_award_points_votes
AFTER INSERT ON problem_votes
FOR EACH ROW EXECUTE FUNCTION auto_award_points();

-- ============================================
-- STEP 7: Enable Row Level Security
-- ============================================

ALTER TABLE problem_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view votes" ON problem_votes;
DROP POLICY IF EXISTS "Users can vote" ON problem_votes;
DROP POLICY IF EXISTS "Users can change their vote" ON problem_votes;
DROP POLICY IF EXISTS "Users can remove their vote" ON problem_votes;
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
DROP POLICY IF EXISTS "Anyone can view user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can view activity feed" ON activity_feed;
DROP POLICY IF EXISTS "Users can view their points" ON user_points;

-- Create RLS policies
CREATE POLICY "Anyone can view votes" ON problem_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON problem_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change their vote" ON problem_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote" ON problem_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view user achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view activity feed" ON activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can view their points" ON user_points FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- STEP 8: Create views (simplified)
-- ============================================

-- Leaderboard View
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  u.id,
  u.name,
  u.avatar_url,
  u.total_points,
  u.level,
  u.level_name,
  u.problems_posted,
  u.problems_solved,
  COUNT(DISTINCT ua.achievement_id) as achievements_count,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id, u.name, u.avatar_url, u.total_points, u.level, u.level_name, u.problems_posted, u.problems_solved
ORDER BY u.total_points DESC
LIMIT 100;

-- ============================================
-- DONE!
-- ============================================

SELECT 'Viral features migration V2 completed successfully! 🎉' as status;

-- Viral Features Migration
-- Upvotes, Achievements, Activity Feed, Points System

-- 1. Add vote counts to problems table
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS affected_people INTEGER DEFAULT 1;

-- 2. Problem Votes Table
CREATE TABLE IF NOT EXISTS problem_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

CREATE INDEX idx_problem_votes_problem ON problem_votes(problem_id);
CREATE INDEX idx_problem_votes_user ON problem_votes(user_id);

-- 3. Achievements Table
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

-- 4. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- 5. Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);

-- 6. User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_points_user ON user_points(user_id, created_at DESC);

-- 7. Add points and level to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_name VARCHAR(50) DEFAULT 'Citizen',
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- 8. Insert Default Achievements
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

-- 9. Function to update problem vote counts
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
      UPDATE problems SET upvotes = upvotes - 1 WHERE id = OLD.problem_id;
    ELSE
      UPDATE problems SET downvotes = downvotes - 1 WHERE id = OLD.problem_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = upvotes - 1 WHERE id = OLD.problem_id;
    ELSE
      UPDATE problems SET downvotes = downvotes - 1 WHERE id = OLD.problem_id;
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

CREATE TRIGGER trigger_update_problem_votes
AFTER INSERT OR UPDATE OR DELETE ON problem_votes
FOR EACH ROW EXECUTE FUNCTION update_problem_votes();

-- 10. Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_upvotes INTEGER,
  p_downvotes INTEGER,
  p_views INTEGER,
  p_created_at TIMESTAMP,
  p_urgency VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  hours_since_post DECIMAL;
  time_decay DECIMAL;
  vote_score INTEGER;
  urgency_multiplier DECIMAL;
BEGIN
  hours_since_post := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;
  time_decay := EXP(-hours_since_post / 24); -- Decay over 24 hours
  
  vote_score := p_upvotes - p_downvotes;
  
  urgency_multiplier := CASE p_urgency
    WHEN 'critical' THEN 3.0
    WHEN 'high' THEN 2.0
    WHEN 'medium' THEN 1.0
    ELSE 0.5
  END;
  
  RETURN (vote_score * 10 + p_views * 0.1) * time_decay * urgency_multiplier;
END;
$$ LANGUAGE plpgsql;

-- 11. Function to calculate impact score
CREATE OR REPLACE FUNCTION calculate_impact_score(
  p_upvotes INTEGER,
  p_affected_people INTEGER,
  p_urgency VARCHAR,
  p_status VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER;
  urgency_bonus INTEGER;
  status_bonus INTEGER;
BEGIN
  base_score := (p_upvotes * 10) + (p_affected_people * 5);
  
  urgency_bonus := CASE p_urgency
    WHEN 'critical' THEN 100
    WHEN 'high' THEN 50
    WHEN 'medium' THEN 20
    ELSE 10
  END;
  
  status_bonus := CASE p_status
    WHEN 'solved' THEN 50
    WHEN 'being_helped' THEN 25
    ELSE 0
  END;
  
  RETURN base_score + urgency_bonus + status_bonus;
END;
$$ LANGUAGE plpgsql;

-- 12. Function to add activity to feed
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
      IF NEW.status = 'being_helped' THEN
        INSERT INTO activity_feed (user_id, problem_id, activity_type, description)
        VALUES (NEW.helper_id, NEW.id, 'problem_helped', 'Started helping with: ' || NEW.title);
      ELSIF NEW.status = 'solved' THEN
        INSERT INTO activity_feed (user_id, problem_id, activity_type, description)
        VALUES (NEW.helper_id, NEW.id, 'problem_solved', 'Solved problem: ' || NEW.title);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_feed_problems
AFTER INSERT OR UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION add_activity_feed();

CREATE TRIGGER trigger_activity_feed_votes
AFTER INSERT ON problem_votes
FOR EACH ROW EXECUTE FUNCTION add_activity_feed();

-- 13. Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason VARCHAR,
  p_problem_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (user_id, points, reason, problem_id)
  VALUES (p_user_id, p_points, p_reason, p_problem_id);
  
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

-- 14. Trigger to award points automatically
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
      IF NEW.status = 'being_helped' THEN
        PERFORM award_points(NEW.helper_id, 50, 'Started helping', NEW.id);
      ELSIF NEW.status = 'solved' THEN
        PERFORM award_points(NEW.helper_id, 100, 'Problem solved', NEW.id);
        PERFORM award_points(NEW.user_id, 25, 'Problem resolved', NEW.id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_award_points_problems
AFTER INSERT OR UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION auto_award_points();

CREATE TRIGGER trigger_auto_award_points_votes
AFTER INSERT ON problem_votes
FOR EACH ROW EXECUTE FUNCTION auto_award_points();

-- 15. View for trending problems (using explicit casts)
CREATE OR REPLACE VIEW trending_problems_view AS
SELECT 
  p.*,
  u.name as user_name,
  u.avatar_url as user_avatar,
  calculate_trending_score(
    p.upvotes::INTEGER, 
    p.downvotes::INTEGER, 
    p.views::INTEGER, 
    p.created_at::TIMESTAMP, 
    p.urgency::VARCHAR
  ) as trending_score,
  calculate_impact_score(
    p.upvotes::INTEGER, 
    p.affected_people::INTEGER, 
    p.urgency::VARCHAR, 
    p.status::VARCHAR
  ) as impact_score
FROM problems p
JOIN users u ON p.user_id = u.id
WHERE p.status != 'solved'
ORDER BY trending_score DESC
LIMIT 50;

-- 16. View for leaderboard
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
GROUP BY u.id
ORDER BY u.total_points DESC
LIMIT 100;

-- 17. Enable Row Level Security
ALTER TABLE problem_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view votes" ON problem_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON problem_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change their vote" ON problem_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote" ON problem_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view user achievements" ON user_achievements FOR SELECT USING (true);

CREATE POLICY "Anyone can view activity feed" ON activity_feed FOR SELECT USING (true);

CREATE POLICY "Users can view their points" ON user_points FOR SELECT USING (auth.uid() = user_id);

-- 18. Indexes for performance
CREATE INDEX idx_problems_trending ON problems(trending_score DESC) WHERE status != 'solved';
CREATE INDEX idx_problems_impact ON problems(impact_score DESC);
CREATE INDEX idx_problems_urgency ON problems(urgency, created_at DESC);
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_users_level ON users(level DESC);

-- 19. Comments
COMMENT ON TABLE problem_votes IS 'Upvotes and downvotes for problems';
COMMENT ON TABLE achievements IS 'Available achievements/badges';
COMMENT ON TABLE user_achievements IS 'Achievements earned by users';
COMMENT ON TABLE activity_feed IS 'Global activity feed for community engagement';
COMMENT ON TABLE user_points IS 'Points transaction history';
COMMENT ON FUNCTION calculate_trending_score IS 'Calculate trending score with time decay';
COMMENT ON FUNCTION calculate_impact_score IS 'Calculate problem impact score';
COMMENT ON FUNCTION award_points IS 'Award points to user and update level';

-- Done!
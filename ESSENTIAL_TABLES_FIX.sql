-- ESSENTIAL TABLES FIX - Run this first in Supabase SQL Editor
-- Creates missing tables that are causing errors

-- 1. Add viral features columns to problems table
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

-- 2. Add points and level to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_name VARCHAR(50) DEFAULT 'Citizen',
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- 3. Create problem_votes table (CRITICAL - fixes VoteButton error)
CREATE TABLE IF NOT EXISTS problem_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- 4. Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  points_required INTEGER NOT NULL,
  badge_color VARCHAR(20) DEFAULT 'blue',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 6. Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_problem_votes_problem ON problem_votes(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_votes_user ON problem_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);

-- 9. Insert default achievements
INSERT INTO achievements (name, description, icon, points_required, badge_color) VALUES
('First Responder', 'Help with your first problem', 'hand-left', 0, 'green'),
('Problem Solver', 'Solve 5 problems', 'checkmark-circle', 250, 'blue'),
('Community Helper', 'Help 10 people', 'people', 500, 'purple'),
('Speed Demon', 'Respond to help request in under 5 minutes', 'flash', 100, 'yellow'),
('Local Hero', 'Solve 25 problems in your area', 'star', 1250, 'gold'),
('Civic Champion', 'Post 10 problems that get solved', 'trophy', 500, 'orange'),
('Good Samaritan', 'Maintain 4.5+ rating with 20+ helps', 'heart', 1000, 'red'),
('Night Owl', 'Help someone between 10 PM - 6 AM', 'moon', 50, 'indigo'),
('Early Bird', 'Help someone between 5 AM - 8 AM', 'sunny', 50, 'yellow'),
('Weekend Warrior', 'Help 5 people on weekends', 'calendar', 200, 'green')
ON CONFLICT (name) DO NOTHING;

-- 10. Enable RLS on new tables
ALTER TABLE problem_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for new tables
CREATE POLICY "Users can view all votes" ON problem_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON problem_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their votes" ON problem_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their votes" ON problem_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);

CREATE POLICY "Users can view their achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their activity" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert activity" ON activity_feed FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points" ON user_points FOR INSERT WITH CHECK (true);

-- SUCCESS: Essential tables created and configured!
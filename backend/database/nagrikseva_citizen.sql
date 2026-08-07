-- NagrikSeva - Citizen-to-Citizen Help Platform
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables
DROP TABLE IF EXISTS problem_helpers CASCADE;
DROP TABLE IF EXISTS problem_comments CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (everyone is equal - no roles)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  problems_posted INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table (public posts)
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  images TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'posted',  -- posted, being_helped, solved
  helper_id UUID REFERENCES users(id),
  helper_name VARCHAR(255),
  solved_image TEXT,
  solved_note TEXT,
  solved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem helpers (who offered to help)
CREATE TABLE problem_helpers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'offered', -- offered, accepted, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- Comments on problems
CREATE TABLE problem_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts/Notifications
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'help_offer',
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES users(id),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET problems_posted = problems_posted + 1 WHERE id = NEW.user_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status != 'solved' AND NEW.status = 'solved' THEN
    UPDATE users SET problems_solved = problems_solved + 1 WHERE id = NEW.helper_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_problem
  AFTER INSERT OR UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to notify on help offer
CREATE OR REPLACE FUNCTION notify_help_offer()
RETURNS TRIGGER AS $$
DECLARE
  problem_record RECORD;
  helper_name TEXT;
BEGIN
  SELECT * INTO problem_record FROM problems WHERE id = NEW.problem_id;
  SELECT name INTO helper_name FROM users WHERE id = NEW.user_id;
  
  INSERT INTO alerts (user_id, title, message, type, problem_id, from_user_id)
  VALUES (
    problem_record.user_id,
    'Someone wants to help! 🙌',
    helper_name || ' offered to help with your problem: ' || problem_record.title,
    'help_offer',
    NEW.problem_id,
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_help_offer
  AFTER INSERT ON problem_helpers
  FOR EACH ROW
  EXECUTE FUNCTION notify_help_offer();

-- Function to notify when problem is being helped
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'posted' AND NEW.status = 'being_helped' THEN
    INSERT INTO alerts (user_id, title, message, type, problem_id, from_user_id)
    VALUES (
      NEW.user_id,
      'Help is on the way! 🚀',
      NEW.helper_name || ' is helping with your problem!',
      'being_helped',
      NEW.id,
      NEW.helper_id
    );
  ELSIF OLD.status = 'being_helped' AND NEW.status = 'solved' THEN
    INSERT INTO alerts (user_id, title, message, type, problem_id, from_user_id)
    VALUES (
      NEW.user_id,
      'Problem Solved! 🎉',
      'Your problem has been solved by ' || NEW.helper_name,
      'solved',
      NEW.id,
      NEW.helper_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_problem_status
  AFTER UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_change();

-- Indexes
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_location ON problems(latitude, longitude);
CREATE INDEX idx_problems_created ON problems(created_at DESC);
CREATE INDEX idx_problems_user ON problems(user_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Open platform, everyone can see everything
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Users can post problems" ON problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own problems" ON problems FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = helper_id);

CREATE POLICY "Anyone can view helpers" ON problem_helpers FOR SELECT USING (true);
CREATE POLICY "Users can offer help" ON problem_helpers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own help offers" ON problem_helpers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON problem_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON problem_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for problem images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('problem-images', 'problem-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view problem images"
ON storage.objects FOR SELECT
USING (bucket_id = 'problem-images');

CREATE POLICY "Authenticated users can upload problem images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'problem-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own problem images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'problem-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own problem images"
ON storage.objects FOR DELETE
USING (bucket_id = 'problem-images' AND auth.uid()::text = (storage.foldername(name))[1]);

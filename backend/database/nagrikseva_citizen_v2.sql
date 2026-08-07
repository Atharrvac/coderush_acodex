-- NagrikSeva - Citizen-to-Citizen Help Platform
-- Run this in Supabase SQL Editor
-- Version 2: Fixed RLS policies for proper user creation

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TRIGGER IF EXISTS update_stats_on_problem ON problems;
DROP TRIGGER IF EXISTS notify_on_help_offer ON problem_helpers;
DROP TRIGGER IF EXISTS notify_problem_status ON problems;
DROP FUNCTION IF EXISTS update_user_stats();
DROP FUNCTION IF EXISTS notify_help_offer();
DROP FUNCTION IF EXISTS notify_status_change();

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

-- ============================================
-- AUTOMATIC USER PROFILE CREATION ON SIGNUP
-- ============================================
-- This function creates a user profile automatically when someone signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STATS AND NOTIFICATION FUNCTIONS
-- ============================================

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET problems_posted = problems_posted + 1 WHERE id = NEW.user_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status != 'solved' AND NEW.status = 'solved' AND NEW.helper_id IS NOT NULL THEN
    UPDATE users SET problems_solved = problems_solved + 1 WHERE id = NEW.helper_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_problem
  AFTER INSERT OR UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to notify when problem status changes
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'posted' AND NEW.status = 'being_helped' THEN
    INSERT INTO alerts (user_id, title, message, type, problem_id, from_user_id)
    VALUES (
      NEW.user_id,
      'Help is on the way! 🚀',
      COALESCE(NEW.helper_name, 'Someone') || ' is helping with your problem!',
      'being_helped',
      NEW.id,
      NEW.helper_id
    );
  ELSIF OLD.status = 'being_helped' AND NEW.status = 'solved' THEN
    INSERT INTO alerts (user_id, title, message, type, problem_id, from_user_id)
    VALUES (
      NEW.user_id,
      'Problem Solved! 🎉',
      'Your problem has been solved by ' || COALESCE(NEW.helper_name, 'someone'),
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

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_location ON problems(latitude, longitude);
CREATE INDEX idx_problems_created ON problems(created_at DESC);
CREATE INDEX idx_problems_user ON problems(user_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_read ON alerts(user_id, read);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Anyone can view users (public profiles)
CREATE POLICY "Anyone can view users" ON users 
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert for authenticated users (for profile creation)
CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PROBLEMS POLICIES
-- Anyone can view problems (public feed)
CREATE POLICY "Anyone can view problems" ON problems 
  FOR SELECT USING (true);

-- Authenticated users can post problems
CREATE POLICY "Authenticated users can post problems" ON problems 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own problems OR problems they're helping with
CREATE POLICY "Users can update problems" ON problems 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = helper_id);

-- Users can delete their own problems
CREATE POLICY "Users can delete own problems" ON problems 
  FOR DELETE USING (auth.uid() = user_id);

-- PROBLEM HELPERS POLICIES
CREATE POLICY "Anyone can view helpers" ON problem_helpers 
  FOR SELECT USING (true);

CREATE POLICY "Users can offer help" ON problem_helpers 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own help offers" ON problem_helpers 
  FOR UPDATE USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Anyone can view comments" ON problem_comments 
  FOR SELECT USING (true);

CREATE POLICY "Users can add comments" ON problem_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ALERTS POLICIES
CREATE POLICY "Users can view own alerts" ON alerts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON alerts 
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert alerts (for triggers)
CREATE POLICY "System can insert alerts" ON alerts 
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET FOR IMAGES
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('problem-images', 'problem-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view problem images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload problem images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own problem images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own problem images" ON storage.objects;

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

-- ============================================
-- DONE! 
-- ============================================
-- Now when a user signs up via Supabase Auth:
-- 1. The trigger automatically creates their profile in the users table
-- 2. They can immediately post problems
-- 3. Everyone can see all problems
-- 4. Anyone can help with any problem

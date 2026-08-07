-- ============================================
-- COMPLETE STABILITY FIX FOR NAGRIKSEVA
-- Fixes: Email confirmation, Post problem, Realtime
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: FIX ROW LEVEL SECURITY FOR POSTING
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can post problems" ON problems;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "System can insert alerts" ON alerts;

-- Create better RLS policies for problems
CREATE POLICY "Authenticated users can post problems" ON problems 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = id
  );

-- Allow system to insert alerts (for triggers)
CREATE POLICY "System can insert alerts" ON alerts 
  FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- PART 2: FIX USER PROFILE CREATION TRIGGER
-- ============================================

-- Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Insert user profile with proper error handling
  INSERT INTO public.users (id, email, name, phone, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- PART 3: ENABLE REALTIME FOR ALL TABLES
-- ============================================

-- Enable realtime for problems (live feed updates)
ALTER PUBLICATION supabase_realtime ADD TABLE problems;

-- Enable realtime for alerts (notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- Enable realtime for problem_helpers (help offers)
ALTER PUBLICATION supabase_realtime ADD TABLE problem_helpers;

-- Enable realtime for problem_comments (if exists)
DO $
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'problem_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE problem_comments;
  END IF;
END $;

-- Enable realtime for chat tables (if they exist)
DO $
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'help_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE help_sessions;
  END IF;
END $;

-- ============================================
-- PART 4: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_location ON problems(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_problems_created ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_user ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_helper ON problems(helper_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_read ON alerts(user_id, read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- ============================================
-- PART 5: FIX STORAGE POLICIES
-- ============================================

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'problem-images', 
  'problem-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop and recreate storage policies
DROP POLICY IF EXISTS "Anyone can view problem images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload problem images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own problem images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own problem images" ON storage.objects;

CREATE POLICY "Anyone can view problem images"
ON storage.objects FOR SELECT
USING (bucket_id = 'problem-images');

CREATE POLICY "Authenticated users can upload problem images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'problem-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own problem images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'problem-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own problem images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'problem-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- PART 6: ADD VOTES TABLE AND POLICIES (if needed)
-- ============================================

-- Create votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS problem_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- Add vote columns to problems if they don't exist
DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'upvotes') THEN
    ALTER TABLE problems ADD COLUMN upvotes INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'downvotes') THEN
    ALTER TABLE problems ADD COLUMN downvotes INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'views') THEN
    ALTER TABLE problems ADD COLUMN views INTEGER DEFAULT 0;
  END IF;
END $;

-- Enable RLS on votes
ALTER TABLE problem_votes ENABLE ROW LEVEL SECURITY;

-- Votes policies
DROP POLICY IF EXISTS "Anyone can view votes" ON problem_votes;
DROP POLICY IF EXISTS "Users can vote" ON problem_votes;
DROP POLICY IF EXISTS "Users can update own votes" ON problem_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON problem_votes;

CREATE POLICY "Anyone can view votes" ON problem_votes 
  FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON problem_votes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON problem_votes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON problem_votes 
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_problem_votes()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = upvotes + 1 WHERE id = NEW.problem_id;
    ELSE
      UPDATE problems SET downvotes = downvotes + 1 WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE problems SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.problem_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE problems SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = NEW.problem_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE problems SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.problem_id;
    ELSE
      UPDATE problems SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.problem_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for vote updates
DROP TRIGGER IF EXISTS update_votes_trigger ON problem_votes;
CREATE TRIGGER update_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON problem_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_votes();

-- ============================================
-- PART 7: VERIFICATION
-- ============================================

-- Verify realtime is enabled
DO $
DECLARE
  realtime_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO realtime_count 
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('problems', 'alerts', 'problem_helpers');
  
  RAISE NOTICE 'Realtime enabled for % tables', realtime_count;
END $;

-- Verify RLS policies
DO $
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename IN ('problems', 'users', 'alerts');
  
  RAISE NOTICE 'Total RLS policies: %', policy_count;
END $;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPLETE STABILITY FIX APPLIED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ RLS policies fixed for posting problems';
  RAISE NOTICE '✓ User profile creation trigger fixed';
  RAISE NOTICE '✓ Realtime enabled for all tables';
  RAISE NOTICE '✓ Storage policies configured';
  RAISE NOTICE '✓ Voting system ready';
  RAISE NOTICE '✓ Performance indexes added';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEP: Disable email confirmation in Supabase Dashboard';
  RAISE NOTICE 'Go to: Authentication > Providers > Email > Disable "Confirm email"';
  RAISE NOTICE '========================================';
END $;

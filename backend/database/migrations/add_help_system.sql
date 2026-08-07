-- Help System Migration
-- Industry-grade matching system like Uber/Swiggy

-- 1. Helper Availability Table
CREATE TABLE IF NOT EXISTS helper_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  last_active TIMESTAMP DEFAULT NOW(),
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  max_distance_km INTEGER DEFAULT 5,
  preferred_categories TEXT[] DEFAULT '{}',
  busy_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_helper_availability_user ON helper_availability(user_id);
CREATE INDEX idx_helper_availability_active ON helper_availability(is_available, last_active DESC);
CREATE INDEX idx_helper_availability_location ON helper_availability(current_latitude, current_longitude);

-- 2. Help Requests Table
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'timeout', 'cancelled')),
  match_score DECIMAL(5,2),
  distance_km DECIMAL(10,2),
  notified_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_time_seconds INTEGER,
  decline_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_help_requests_problem ON help_requests(problem_id, status);
CREATE INDEX idx_help_requests_helper ON help_requests(helper_id, status, created_at DESC);
CREATE INDEX idx_help_requests_status ON help_requests(status, notified_at DESC);

-- 3. Helper Stats Table
CREATE TABLE IF NOT EXISTS helper_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_requests_received INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_declined INTEGER DEFAULT 0,
  total_timeout INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  avg_completion_time_hours DECIMAL(10,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  last_helped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_helper_stats_user ON helper_stats(user_id);
CREATE INDEX idx_helper_stats_rating ON helper_stats(avg_rating DESC);
CREATE INDEX idx_helper_stats_success ON helper_stats(success_rate DESC);

-- 4. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  helpful_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(problem_id, from_user_id, to_user_id)
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id, created_at DESC);
CREATE INDEX idx_ratings_problem ON ratings(problem_id);
CREATE INDEX idx_ratings_rating ON ratings(rating DESC);

-- 5. Helper Skills Table
CREATE TABLE IF NOT EXISTS helper_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_helper_skills_user ON helper_skills(user_id);
CREATE INDEX idx_helper_skills_category ON helper_skills(category);

-- 6. Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth's radius in km
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Function to find nearby available helpers
CREATE OR REPLACE FUNCTION find_nearby_helpers(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 5,
  p_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  name VARCHAR,
  distance_km DECIMAL,
  is_available BOOLEAN,
  avg_rating DECIMAL,
  problems_solved INTEGER,
  last_active TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    calculate_distance_km(
      ha.current_latitude,
      ha.current_longitude,
      p_latitude,
      p_longitude
    ) as distance_km,
    ha.is_available,
    COALESCE(hs.avg_rating, 0.00) as avg_rating,
    u.problems_solved,
    ha.last_active
  FROM users u
  JOIN helper_availability ha ON u.id = ha.user_id
  LEFT JOIN helper_stats hs ON u.id = hs.user_id
  WHERE 
    ha.is_available = true
    AND ha.last_active > NOW() - INTERVAL '1 hour'
    AND calculate_distance_km(
      ha.current_latitude,
      ha.current_longitude,
      p_latitude,
      p_longitude
    ) <= p_radius_km
    AND (p_category IS NULL OR p_category = ANY(ha.preferred_categories) OR array_length(ha.preferred_categories, 1) IS NULL)
  ORDER BY distance_km ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to calculate match score
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_helper_id UUID,
  p_problem_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_distance_score DECIMAL;
  v_skill_score DECIMAL := 50;
  v_reputation_score DECIMAL;
  v_availability_score DECIMAL;
  v_response_time_score DECIMAL;
  v_match_score DECIMAL;
  v_distance DECIMAL;
  v_helper_stats RECORD;
  v_problem RECORD;
  v_helper_avail RECORD;
BEGIN
  -- Get problem details
  SELECT * INTO v_problem FROM problems WHERE id = p_problem_id;
  
  -- Get helper availability
  SELECT * INTO v_helper_avail FROM helper_availability WHERE user_id = p_helper_id;
  
  -- Get helper stats
  SELECT * INTO v_helper_stats FROM helper_stats WHERE user_id = p_helper_id;
  
  -- Calculate distance score (30% weight)
  v_distance := calculate_distance_km(
    v_helper_avail.current_latitude,
    v_helper_avail.current_longitude,
    v_problem.latitude,
    v_problem.longitude
  );
  v_distance_score := GREATEST(0, 100 - (v_distance * 20));
  
  -- Calculate skill score (25% weight)
  IF v_problem.category = ANY(v_helper_avail.preferred_categories) THEN
    v_skill_score := 100;
  END IF;
  
  -- Calculate reputation score (20% weight)
  IF v_helper_stats IS NOT NULL THEN
    v_reputation_score := (
      (COALESCE(v_helper_stats.total_completed, 0) * 2) +
      (COALESCE(v_helper_stats.success_rate, 0) * 0.5) +
      (COALESCE(v_helper_stats.avg_rating, 0) * 10)
    ) / 3;
    v_reputation_score := LEAST(100, v_reputation_score);
  ELSE
    v_reputation_score := 50; -- Default for new helpers
  END IF;
  
  -- Calculate availability score (15% weight)
  IF v_helper_avail.last_active > NOW() - INTERVAL '5 minutes' THEN
    v_availability_score := 100;
  ELSIF v_helper_avail.last_active > NOW() - INTERVAL '30 minutes' THEN
    v_availability_score := 80;
  ELSIF v_helper_avail.last_active > NOW() - INTERVAL '1 hour' THEN
    v_availability_score := 60;
  ELSE
    v_availability_score := 40;
  END IF;
  
  -- Calculate response time score (10% weight)
  IF v_helper_stats IS NOT NULL AND v_helper_stats.avg_response_time_seconds > 0 THEN
    v_response_time_score := GREATEST(0, 100 - (v_helper_stats.avg_response_time_seconds / 60 * 5));
  ELSE
    v_response_time_score := 70; -- Default for new helpers
  END IF;
  
  -- Calculate final match score
  v_match_score := 
    (v_distance_score * 0.3) +
    (v_skill_score * 0.25) +
    (v_reputation_score * 0.2) +
    (v_availability_score * 0.15) +
    (v_response_time_score * 0.1);
  
  RETURN ROUND(v_match_score, 2);
END;
$$ LANGUAGE plpgsql;

-- 9. Function to update helper stats
CREATE OR REPLACE FUNCTION update_helper_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_requests INTEGER;
  v_total_accepted INTEGER;
  v_total_declined INTEGER;
  v_total_timeout INTEGER;
  v_avg_response_time INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Count requests
    SELECT 
      COUNT(*) FILTER (WHERE status IN ('pending', 'accepted', 'declined', 'timeout')),
      COUNT(*) FILTER (WHERE status = 'accepted'),
      COUNT(*) FILTER (WHERE status = 'declined'),
      COUNT(*) FILTER (WHERE status = 'timeout'),
      AVG(response_time_seconds) FILTER (WHERE response_time_seconds IS NOT NULL)
    INTO 
      v_total_requests,
      v_total_accepted,
      v_total_declined,
      v_total_timeout,
      v_avg_response_time
    FROM help_requests
    WHERE helper_id = NEW.helper_id;
    
    -- Update or insert stats
    INSERT INTO helper_stats (
      user_id,
      total_requests_received,
      total_accepted,
      total_declined,
      total_timeout,
      avg_response_time_seconds,
      updated_at
    ) VALUES (
      NEW.helper_id,
      v_total_requests,
      v_total_accepted,
      v_total_declined,
      v_total_timeout,
      COALESCE(v_avg_response_time, 0),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_requests_received = v_total_requests,
      total_accepted = v_total_accepted,
      total_declined = v_total_declined,
      total_timeout = v_total_timeout,
      avg_response_time_seconds = COALESCE(v_avg_response_time, 0),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helper_stats
AFTER UPDATE ON help_requests
FOR EACH ROW EXECUTE FUNCTION update_helper_stats();

-- 10. Function to update ratings
CREATE OR REPLACE FUNCTION update_helper_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating DECIMAL;
  v_total_ratings INTEGER;
BEGIN
  -- Calculate new average rating
  SELECT 
    AVG(rating),
    COUNT(*)
  INTO v_avg_rating, v_total_ratings
  FROM ratings
  WHERE to_user_id = NEW.to_user_id;
  
  -- Update helper stats
  UPDATE helper_stats
  SET 
    avg_rating = v_avg_rating,
    total_ratings = v_total_ratings,
    updated_at = NOW()
  WHERE user_id = NEW.to_user_id;
  
  -- Create if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO helper_stats (user_id, avg_rating, total_ratings)
    VALUES (NEW.to_user_id, v_avg_rating, v_total_ratings);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helper_rating
AFTER INSERT ON ratings
FOR EACH ROW EXECUTE FUNCTION update_helper_rating();

-- 11. Enable Row Level Security
ALTER TABLE helper_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all helper availability" ON helper_availability FOR SELECT USING (true);
CREATE POLICY "Users can update their own availability" ON helper_availability FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their help requests" ON help_requests FOR SELECT USING (auth.uid() = helper_id OR auth.uid() IN (SELECT user_id FROM problems WHERE id = problem_id));
CREATE POLICY "Users can update their help requests" ON help_requests FOR UPDATE USING (auth.uid() = helper_id);

CREATE POLICY "Anyone can view helper stats" ON helper_stats FOR SELECT USING (true);

CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view all skills" ON helper_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their skills" ON helper_skills FOR ALL USING (auth.uid() = user_id);

-- 12. Comments
COMMENT ON TABLE helper_availability IS 'Tracks helper availability and location for real-time matching';
COMMENT ON TABLE help_requests IS 'Tracks all help requests sent to helpers';
COMMENT ON TABLE helper_stats IS 'Aggregated statistics for each helper';
COMMENT ON TABLE ratings IS 'User ratings and reviews';
COMMENT ON TABLE helper_skills IS 'Helper skills and expertise';
COMMENT ON FUNCTION calculate_match_score IS 'Calculates match score between helper and problem (0-100)';
COMMENT ON FUNCTION find_nearby_helpers IS 'Finds available helpers within radius';

-- Done!
SELECT 'Help system migration completed successfully! 🤝' as status;

-- Performance Indexes for Production Scale
-- Run this to optimize queries for millions of users

-- Index for filtering problems by user_id (exclude user's own problems)
CREATE INDEX IF NOT EXISTS idx_problems_user_id ON problems(user_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_problems_status_created ON problems(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_category_created ON problems(category, created_at DESC);

-- Index for location-based queries (nearest problems)
CREATE INDEX IF NOT EXISTS idx_problems_location ON problems(latitude, longitude);

-- Index for helper queries
CREATE INDEX IF NOT EXISTS idx_problems_helper_id ON problems(helper_id);

-- Index for real-time updates
CREATE INDEX IF NOT EXISTS idx_problems_updated_at ON problems(updated_at DESC);

-- Index for user stats queries
CREATE INDEX IF NOT EXISTS idx_users_stats ON users(problems_posted, problems_solved);

-- Index for alerts/notifications
CREATE INDEX IF NOT EXISTS idx_alerts_user_id_read ON alerts(user_id, read, created_at DESC);

-- Analyze tables for query optimization
ANALYZE problems;
ANALYZE users;
ANALYZE alerts;

-- Add comments for documentation
COMMENT ON INDEX idx_problems_user_id IS 'Optimize filtering out user own problems';
COMMENT ON INDEX idx_problems_status IS 'Optimize status filtering in feed';
COMMENT ON INDEX idx_problems_category IS 'Optimize category filtering';
COMMENT ON INDEX idx_problems_status_created IS 'Optimize feed queries with status filter';
COMMENT ON INDEX idx_problems_location IS 'Optimize nearest problems queries';

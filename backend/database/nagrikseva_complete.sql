-- NagrikSeva Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (careful in production!)
DROP TABLE IF EXISTS complaint_comments CASCADE;
DROP TABLE IF EXISTS complaint_upvotes CASCADE;
DROP TABLE IF EXISTS complaint_timeline CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create sequence for request IDs
DROP SEQUENCE IF EXISTS complaint_seq;
CREATE SEQUENCE complaint_seq START 1000;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'citizen',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints table
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id VARCHAR(20) UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  issue_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT[] DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  upvotes INTEGER DEFAULT 0,
  assigned_to VARCHAR(255),
  department VARCHAR(100),
  remarks TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaint timeline/status history
CREATE TABLE complaint_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  remarks TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaint upvotes
CREATE TABLE complaint_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(complaint_id, user_id)
);

-- Complaint comments
CREATE TABLE complaint_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government offices
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  services TEXT[] DEFAULT '{}',
  open_time TIME DEFAULT '09:00',
  close_time TIME DEFAULT '17:00',
  working_days VARCHAR(50) DEFAULT 'Mon-Fri',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User alerts/notifications
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'status_update',
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate request ID
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_id := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('complaint_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for request ID
CREATE TRIGGER set_request_id
  BEFORE INSERT ON complaints
  FOR EACH ROW
  WHEN (NEW.request_id IS NULL)
  EXECUTE FUNCTION generate_request_id();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_complaints_timestamp
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create initial timeline entry
CREATE OR REPLACE FUNCTION create_initial_timeline()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO complaint_timeline (complaint_id, status, title)
  VALUES (NEW.id, 'pending', 'Request Received');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_complaint_timeline
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_timeline();

-- Function to create alert on status change
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO alerts (user_id, title, message, type, complaint_id)
    VALUES (
      NEW.user_id,
      'Status Updated',
      'Your complaint #' || NEW.request_id || ' status changed to ' || NEW.status,
      'status_update',
      NEW.id
    );
    
    INSERT INTO complaint_timeline (complaint_id, status, title)
    VALUES (NEW.id, NEW.status, 
      CASE NEW.status
        WHEN 'in_progress' THEN 'Under Review'
        WHEN 'assigned' THEN 'Team Assigned'
        WHEN 'resolved' THEN 'Issue Resolved'
        WHEN 'rejected' THEN 'Request Rejected'
        ELSE 'Status Updated'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaint_status_change
  AFTER UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_change();

-- Indexes for performance
CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_location ON complaints(latitude, longitude);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_unread ON alerts(user_id, read) WHERE read = false;
CREATE INDEX idx_timeline_complaint ON complaint_timeline(complaint_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users: can read all, update own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Complaints: can read all, create/update own
CREATE POLICY "Anyone can view complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Users can create complaints" ON complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own complaints" ON complaints FOR UPDATE USING (auth.uid() = user_id);

-- Timeline: read all
CREATE POLICY "Anyone can view timeline" ON complaint_timeline FOR SELECT USING (true);

-- Upvotes: read all, manage own
CREATE POLICY "Anyone can view upvotes" ON complaint_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can manage own upvotes" ON complaint_upvotes FOR ALL USING (auth.uid() = user_id);

-- Comments: read all, create own
CREATE POLICY "Anyone can view comments" ON complaint_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON complaint_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alerts: own only
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id);

-- Offices: read all
CREATE POLICY "Anyone can view offices" ON offices FOR SELECT USING (true);

-- Insert sample offices
INSERT INTO offices (name, address, phone, latitude, longitude, services) VALUES
('Municipal Corporation Office', 'City Center, Main Road', '+91-1234567890', 19.0760, 72.8777, ARRAY['Complaints', 'Permits', 'Certificates']),
('Water Supply Department', 'Sector 5, Industrial Area', '+91-1234567891', 19.0820, 72.8850, ARRAY['Water Issues', 'New Connection', 'Bills']),
('Electricity Board Office', 'Power House Road', '+91-1234567892', 19.0700, 72.8700, ARRAY['Power Issues', 'New Connection', 'Bills']),
('Public Works Department', 'PWD Complex, Ring Road', '+91-1234567893', 19.0850, 72.8900, ARRAY['Roads', 'Bridges', 'Infrastructure']);

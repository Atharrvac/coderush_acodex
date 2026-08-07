-- =====================================================
-- PRE-REGISTERED ADMINS TABLE
-- =====================================================

-- Pre-registered admins (super admin or system adds these)
CREATE TABLE IF NOT EXISTS pre_registered_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    is_claimed BOOLEAN DEFAULT false,
    claimed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pre_admins_email ON pre_registered_admins(email);

-- RLS
ALTER TABLE pre_registered_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_pre_admins" ON pre_registered_admins FOR SELECT USING (true);
CREATE POLICY "insert_pre_admins" ON pre_registered_admins FOR INSERT WITH CHECK (true);
CREATE POLICY "update_pre_admins" ON pre_registered_admins FOR UPDATE USING (true);
CREATE POLICY "delete_pre_admins" ON pre_registered_admins FOR DELETE USING (true);

-- =====================================================
-- INSERT FIRST ADMIN (run this once to bootstrap)
-- =====================================================
INSERT INTO pre_registered_admins (email, full_name, employee_id)
VALUES ('admin@college.edu', 'College Administrator', 'ADMIN001')
ON CONFLICT (email) DO NOTHING;

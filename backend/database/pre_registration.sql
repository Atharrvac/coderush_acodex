-- =====================================================
-- PRE-REGISTRATION SYSTEM
-- Admin adds students/faculty first, then they can register
-- =====================================================

-- Pre-registered students (admin adds these first)
CREATE TABLE IF NOT EXISTS pre_registered_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    course_id UUID REFERENCES courses(id),
    semester INTEGER DEFAULT 1,
    admission_year INTEGER,
    is_claimed BOOLEAN DEFAULT false,  -- becomes true when student registers
    claimed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Pre-registered faculty (admin adds these first)
CREATE TABLE IF NOT EXISTS pre_registered_faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    is_claimed BOOLEAN DEFAULT false,
    claimed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_students_roll_no ON pre_registered_students(roll_no);
CREATE INDEX IF NOT EXISTS idx_pre_students_email ON pre_registered_students(email);
CREATE INDEX IF NOT EXISTS idx_pre_faculty_email ON pre_registered_faculty(email);

-- RLS Policies
ALTER TABLE pre_registered_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_registered_faculty ENABLE ROW LEVEL SECURITY;

-- Anyone can check if their roll_no/email exists (for registration)
CREATE POLICY "Anyone can verify pre-registration" ON pre_registered_students
    FOR SELECT USING (true);

CREATE POLICY "Anyone can verify faculty pre-registration" ON pre_registered_faculty
    FOR SELECT USING (true);

-- Only admins can insert/update pre-registrations
CREATE POLICY "Admins can manage pre-registered students" ON pre_registered_students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage pre-registered faculty" ON pre_registered_faculty
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow update for claiming (during registration)
CREATE POLICY "Allow claiming pre-registration" ON pre_registered_students
    FOR UPDATE USING (true);

CREATE POLICY "Allow claiming faculty pre-registration" ON pre_registered_faculty
    FOR UPDATE USING (true);

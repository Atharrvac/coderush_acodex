-- Migration: Simplified schema for faculty subjects and assignments
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Add subjects array to faculty table
-- =====================================================
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';

-- =====================================================
-- 2. Add course to students table
-- =====================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS course VARCHAR(100);

-- =====================================================
-- 3. Create faculty_assignments table (simplified)
-- =====================================================
CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks INTEGER DEFAULT 100,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Create assignment_submissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES faculty_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT,
    comments TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'graded', 'late')),
    marks DECIMAL(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES users(id),
    UNIQUE(assignment_id, student_id)
);

-- =====================================================
-- 5. Create faculty_attendance table (simplified)
-- =====================================================
CREATE TABLE IF NOT EXISTS faculty_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_name, date)
);

-- =====================================================
-- 6. Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_faculty_subjects ON faculty USING GIN(subjects);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_faculty ON faculty_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_subject ON faculty_assignments(subject_name);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_faculty_attendance_student ON faculty_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_faculty_attendance_date ON faculty_attendance(date);

-- =====================================================
-- 7. RLS Policies
-- =====================================================
ALTER TABLE faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_attendance ENABLE ROW LEVEL SECURITY;

-- Faculty can manage their own assignments
CREATE POLICY "Faculty can manage own assignments" ON faculty_assignments
    FOR ALL USING (
        faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
    );

-- Students can view assignments in their department
CREATE POLICY "Students can view assignments" ON faculty_assignments
    FOR SELECT USING (
        department IN (SELECT department FROM students WHERE user_id = auth.uid())
    );

-- Students can submit to assignments
CREATE POLICY "Students can submit assignments" ON assignment_submissions
    FOR INSERT WITH CHECK (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

-- Students can view own submissions
CREATE POLICY "Students can view own submissions" ON assignment_submissions
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

-- Faculty can view and grade submissions
CREATE POLICY "Faculty can manage submissions" ON assignment_submissions
    FOR ALL USING (
        assignment_id IN (
            SELECT id FROM faculty_assignments 
            WHERE faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
        )
    );

-- Faculty can mark attendance
CREATE POLICY "Faculty can manage attendance" ON faculty_attendance
    FOR ALL USING (
        faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
    );

-- Students can view own attendance
CREATE POLICY "Students can view own attendance" ON faculty_attendance
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

/**
 * Faculty Controller - Simplified
 * 
 * Faculty selects subjects during signup, stored in faculty.subjects array
 * Assignments are created with subject_name instead of subject_id
 */

const { supabase } = require('../config/supabase');

/**
 * Get faculty dashboard
 * GET /api/v1/faculty/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get faculty profile with subjects
    const { data: faculty, error } = await supabase
      .from('faculty')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Get assignments created by this faculty
    const { data: assignments } = await supabase
      .from('faculty_assignments')
      .select('*')
      .eq('faculty_id', faculty.id)
      .order('created_at', { ascending: false });

    // Get pending submissions count
    const { count: pendingGrading } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .in('assignment_id', (assignments || []).map(a => a.id));

    res.json({
      faculty,
      subjects: faculty?.subjects || [],
      stats: {
        totalSubjects: faculty?.subjects?.length || 0,
        totalAssignments: assignments?.length || 0,
        pendingGrading: pendingGrading || 0
      },
      recentAssignments: (assignments || []).slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};

const getAssignedSubjects = async (req, res, next) => {
  try {
    const { data: faculty, error } = await supabase
      .from('faculty')
      .select('subjects')
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    // Return subjects as array of objects for consistency
    const subjects = (faculty?.subjects || []).map((name, index) => ({
      id: `subject-${index}`,
      name: name,
      code: name.substring(0, 3).toUpperCase()
    }));

    res.json({ subjects });
  } catch (error) {
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const { subject_name, title, description, due_date, max_marks } = req.body;

    // Get faculty profile
    const { data: faculty } = await supabase
      .from('faculty')
      .select('id, subjects')
      .eq('user_id', req.user.id)
      .single();

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found' });
    }

    // Verify faculty teaches this subject
    if (!faculty.subjects || !faculty.subjects.includes(subject_name)) {
      return res.status(403).json({ 
        error: 'You are not assigned to teach this subject',
        code: 'UNAUTHORIZED_SUBJECT'
      });
    }
    const { data, error } = await supabase
      .from('faculty_assignments')
      .insert({
        faculty_id: faculty.id,
        subject_name,
        title,
        description,
        due_date,
        max_marks: max_marks || 100,
        department: faculty.department
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all assignments by faculty
 * GET /api/v1/faculty/assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: assignments, error } = await supabase
      .from('faculty_assignments')
      .select('*')
      .eq('faculty_id', faculty.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ assignments: assignments || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Get submissions for an assignment
 * GET /api/v1/faculty/assignments/:assignmentId/submissions
 */
const getSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:students(
          roll_no, department, course,
          user:users(full_name, email)
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    res.json({ submissions: submissions || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Grade a submission
 * PUT /api/v1/faculty/submissions/:submissionId/grade
 */
const gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        marks,
        feedback,
        status: 'graded',
        graded_at: new Date(),
        graded_by: req.user.id
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Submission graded successfully',
      submission: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students in faculty's department
 * GET /api/v1/faculty/students
 */
const getStudents = async (req, res, next) => {
  try {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('department')
      .eq('user_id', req.user.id)
      .single();

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        user:users(full_name, email)
      `)
      .eq('department', faculty.department);

    if (error) throw error;

    res.json({ students: students || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark attendance
 * POST /api/v1/faculty/attendance
 */
const markAttendance = async (req, res, next) => {
  try {
    const { subject_name, date, records } = req.body;

    const { data: faculty } = await supabase
      .from('faculty')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const attendanceRecords = records.map(record => ({
      faculty_id: faculty.id,
      student_id: record.student_id,
      subject_name,
      date,
      status: record.status,
      marked_by: req.user.id
    }));

    const { data, error } = await supabase
      .from('faculty_attendance')
      .upsert(attendanceRecords, {
        onConflict: 'student_id,subject_name,date'
      })
      .select();

    if (error) throw error;

    res.json({
      message: 'Attendance marked successfully',
      count: data.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAssignedSubjects,
  createAssignment,
  getAssignments,
  getSubmissions,
  gradeSubmission,
  getStudents,
  markAttendance
};

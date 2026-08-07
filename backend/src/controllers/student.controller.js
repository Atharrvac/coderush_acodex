/**
 * Student Controller
 * 
 * Handles student-specific operations:
 * - View timetable
 * - Attendance history
 * - Assignment submissions
 * - Download notes
 * - View grades
 */

const { supabase } = require('../config/supabase');
const { PAGINATION } = require('../config/constants');

/**
 * Get student dashboard
 * GET /api/v1/student/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get student profile
    const { data: student } = await supabase
      .from('students')
      .select('*, user:users(full_name, email)')
      .eq('user_id', userId)
      .single();

    // Get attendance percentage
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', student.id);

    const totalClasses = attendance?.length || 0;
    const presentClasses = attendance?.filter(a => 
      a.status === 'present' || a.status === 'late'
    ).length || 0;
    const attendancePercentage = totalClasses > 0 
      ? ((presentClasses / totalClasses) * 100).toFixed(1) 
      : 0;

    // Get pending assignments
    const { count: pendingAssignments } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .gt('due_date', new Date().toISOString())
      .not('id', 'in', 
        `(SELECT assignment_id FROM submissions WHERE student_id = '${student.id}')`
      );

    // Get recent grades
    const { data: recentGrades } = await supabase
      .from('submissions')
      .select(`
        marks,
        assignment:assignments(title, max_marks, subject:subjects(name))
      `)
      .eq('student_id', student.id)
      .eq('status', 'graded')
      .order('graded_at', { ascending: false })
      .limit(5);

    res.json({
      student,
      stats: {
        attendancePercentage,
        totalClasses,
        presentClasses,
        pendingAssignments: pendingAssignments || 0
      },
      recentGrades
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's timetable
 * GET /api/v1/student/timetable
 */
const getTimetable = async (req, res, next) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    // Get enrolled course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', student.id)
      .single();

    if (!enrollment) {
      return res.json({ timetable: [] });
    }

    // Get timetable for the course
    const { data: timetable, error } = await supabase
      .from('timetable')
      .select(`
        *,
        subject:subjects(name, code),
        faculty:faculty(user:users(full_name))
      `)
      .eq('course_id', enrollment.course_id)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    res.json({ timetable });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance history
 * GET /api/v1/student/attendance
 */
const getAttendance = async (req, res, next) => {
  try {
    const { subject_id, from_date, to_date } = req.query;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let query = supabase
      .from('attendance')
      .select(`
        *,
        subject:subjects(name, code)
      `)
      .eq('student_id', student.id)
      .order('date', { ascending: false });

    if (subject_id) query = query.eq('subject_id', subject_id);
    if (from_date) query = query.gte('date', from_date);
    if (to_date) query = query.lte('date', to_date);

    const { data: attendance, error } = await query;

    if (error) throw error;

    // Calculate summary
    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    res.json({ attendance, summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignments
 * GET /api/v1/student/assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const { status, subject_id } = req.query;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    // Get enrolled course subjects
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', student.id)
      .single();

    let query = supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects(name, code, course_id),
        submission:submissions(id, status, marks, submitted_at)
      `)
      .eq('subject.course_id', enrollment?.course_id)
      .order('due_date', { ascending: true });

    if (subject_id) query = query.eq('subject_id', subject_id);

    const { data: assignments, error } = await query;

    if (error) throw error;

    // Filter by submission status if requested
    let filteredAssignments = assignments;
    if (status === 'pending') {
      filteredAssignments = assignments.filter(a => 
        !a.submission?.length && new Date(a.due_date) > new Date()
      );
    } else if (status === 'submitted') {
      filteredAssignments = assignments.filter(a => a.submission?.length > 0);
    }

    res.json({ assignments: filteredAssignments });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit assignment
 * POST /api/v1/student/assignments/:assignmentId/submit
 */
const submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { file_url, comments } = req.body;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    // Check if assignment exists and is not past due
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND'
      });
    }

    const isLate = new Date() > new Date(assignment.due_date);

    // Check for existing submission
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', student.id)
      .single();

    if (existing) {
      // Update existing submission
      const { data, error } = await supabase
        .from('submissions')
        .update({
          file_url,
          comments,
          status: isLate ? 'late' : 'submitted',
          submitted_at: new Date()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ message: 'Submission updated', submission: data });
    }

    // Create new submission
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: student.id,
        file_url,
        comments,
        status: isLate ? 'late' : 'submitted'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notes
 * GET /api/v1/student/notes
 */
const getNotes = async (req, res, next) => {
  try {
    const { subject_id } = req.query;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    // Get enrolled course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', student.id)
      .single();

    let query = supabase
      .from('notes')
      .select(`
        *,
        subject:subjects(name, code, course_id),
        uploader:users(full_name)
      `)
      .eq('subject.course_id', enrollment?.course_id)
      .order('created_at', { ascending: false });

    if (subject_id) query = query.eq('subject_id', subject_id);

    const { data: notes, error } = await query;

    if (error) throw error;

    res.json({ notes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get grades/results
 * GET /api/v1/student/grades
 */
const getGrades = async (req, res, next) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: grades, error } = await supabase
      .from('submissions')
      .select(`
        marks,
        feedback,
        graded_at,
        assignment:assignments(
          title,
          max_marks,
          subject:subjects(name, code)
        )
      `)
      .eq('student_id', student.id)
      .eq('status', 'graded')
      .order('graded_at', { ascending: false });

    if (error) throw error;

    // Calculate overall performance
    const totalMarks = grades.reduce((sum, g) => sum + (g.marks || 0), 0);
    const maxMarks = grades.reduce((sum, g) => sum + (g.assignment?.max_marks || 0), 0);
    const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : 0;

    res.json({
      grades,
      summary: {
        totalAssignments: grades.length,
        totalMarks,
        maxMarks,
        percentage
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getTimetable,
  getAttendance,
  getAssignments,
  submitAssignment,
  getNotes,
  getGrades
};

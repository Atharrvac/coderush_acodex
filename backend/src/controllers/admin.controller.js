/**
 * Admin Controller
 * 
 * Handles admin operations: pre-registration, user management, etc.
 */

const { supabase } = require('../config/supabase');

/**
 * Add pre-registered students (bulk or single)
 * POST /api/v1/admin/pre-register/students
 */
const preRegisterStudents = async (req, res, next) => {
  try {
    const { students } = req.body; // Array of students
    
    const studentsToInsert = students.map(s => ({
      roll_no: s.roll_no,
      email: s.email,
      full_name: s.full_name,
      department: s.department,
      course_id: s.course_id || null,
      semester: s.semester || 1,
      admission_year: s.admission_year || new Date().getFullYear(),
      created_by: req.user.id
    }));

    const { data, error } = await supabase
      .from('pre_registered_students')
      .insert(studentsToInsert)
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          error: 'Some roll numbers or emails already exist',
          code: 'DUPLICATE_ENTRY'
        });
      }
      throw error;
    }

    res.status(201).json({
      message: `${data.length} student(s) pre-registered successfully`,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add pre-registered faculty (bulk or single)
 * POST /api/v1/admin/pre-register/faculty
 */
const preRegisterFaculty = async (req, res, next) => {
  try {
    const { faculty } = req.body; // Array of faculty
    
    const facultyToInsert = faculty.map(f => ({
      email: f.email,
      full_name: f.full_name,
      department: f.department,
      designation: f.designation || 'Assistant Professor',
      employee_id: f.employee_id || null,
      created_by: req.user.id
    }));

    const { data, error } = await supabase
      .from('pre_registered_faculty')
      .insert(facultyToInsert)
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          error: 'Some emails already exist',
          code: 'DUPLICATE_ENTRY'
        });
      }
      throw error;
    }

    res.status(201).json({
      message: `${data.length} faculty member(s) pre-registered successfully`,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pre-registered students
 * GET /api/v1/admin/pre-register/students
 */
const getPreRegisteredStudents = async (req, res, next) => {
  try {
    const { claimed, department } = req.query;
    
    let query = supabase
      .from('pre_registered_students')
      .select('*')
      .order('created_at', { ascending: false });

    if (claimed !== undefined) {
      query = query.eq('is_claimed', claimed === 'true');
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pre-registered faculty
 * GET /api/v1/admin/pre-register/faculty
 */
const getPreRegisteredFaculty = async (req, res, next) => {
  try {
    const { claimed, department } = req.query;
    
    let query = supabase
      .from('pre_registered_faculty')
      .select('*')
      .order('created_at', { ascending: false });

    if (claimed !== undefined) {
      query = query.eq('is_claimed', claimed === 'true');
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete pre-registered student
 * DELETE /api/v1/admin/pre-register/students/:id
 */
const deletePreRegisteredStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('pre_registered_students')
      .delete()
      .eq('id', id)
      .eq('is_claimed', false); // Can only delete unclaimed

    if (error) throw error;

    res.json({ message: 'Pre-registration deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete pre-registered faculty
 * DELETE /api/v1/admin/pre-register/faculty/:id
 */
const deletePreRegisteredFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('pre_registered_faculty')
      .delete()
      .eq('id', id)
      .eq('is_claimed', false);

    if (error) throw error;

    res.json({ message: 'Pre-registration deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard stats
 * GET /api/v1/admin/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      { count: totalStudents },
      { count: totalFaculty },
      { count: pendingStudents },
      { count: pendingFaculty },
      { count: totalCourses },
      { count: totalSubjects }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('faculty').select('*', { count: 'exact', head: true }),
      supabase.from('pre_registered_students').select('*', { count: 'exact', head: true }).eq('is_claimed', false),
      supabase.from('pre_registered_faculty').select('*', { count: 'exact', head: true }).eq('is_claimed', false),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('subjects').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      stats: {
        totalStudents: totalStudents || 0,
        totalFaculty: totalFaculty || 0,
        pendingStudentRegistrations: pendingStudents || 0,
        pendingFacultyRegistrations: pendingFaculty || 0,
        totalCourses: totalCourses || 0,
        totalSubjects: totalSubjects || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  preRegisterStudents,
  preRegisterFaculty,
  getPreRegisteredStudents,
  getPreRegisteredFaculty,
  deletePreRegisteredStudent,
  deletePreRegisteredFaculty,
  getDashboardStats
};

/**
 * Course Controller
 * 
 * Handles course and subject management
 */

const { supabaseAdmin } = require('../config/supabase');
const { PAGINATION } = require('../config/constants');

/**
 * Get all courses
 */
const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, department } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact' });

    if (department) query = query.eq('department', department);

    const { data: courses, error, count } = await query
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      courses,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID with subjects
 */
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select(`*, subjects(*)`)
      .eq('id', id)
      .single();

    if (error || !course) {
      return res.status(404).json({ error: 'Course not found', code: 'NOT_FOUND' });
    }

    res.json({ course });
  } catch (error) {
    next(error);
  }
};

/**
 * Create course
 */
const createCourse = async (req, res, next) => {
  try {
    const { name, code, department, duration_years, description } = req.body;

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({ name, code, department, duration_years, description })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Course created', course: data });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, department, duration_years, description, is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({ name, code, department, duration_years, description, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Course updated', course: data });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete course (soft delete)
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('courses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Course deactivated' });
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const { data: subjects, error } = await supabaseAdmin
      .from('subjects')
      .select(`
        *,
        faculty_subjects(faculty(user:users(full_name)))
      `)
      .eq('course_id', courseId)
      .order('semester')
      .order('name');

    if (error) throw error;

    res.json({ subjects });
  } catch (error) {
    next(error);
  }
};

 * Create subject
 */
const createSubject = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { name, code, credits, semester, description } = req.body;

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({ course_id: courseId, name, code, credits, semester, description })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Subject created', subject: data });
  } catch (error) {
    next(error);
  }
};


const getTimetable = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const { data: timetable, error } = await supabaseAdmin
      .from('timetable')
      .select(`
        *,
        subject:subjects(name, code),
        faculty:faculty(user:users(full_name))
      `)
      .eq('course_id', courseId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    res.json({ timetable });
  } catch (error) {
    next(error);
  }
};

/**
 * Create timetable entry
 */
const createTimetableEntry = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { subject_id, faculty_id, day_of_week, start_time, end_time, room } = req.body;

    const { data, error } = await supabaseAdmin
      .from('timetable')
      .insert({ 
        course_id: courseId, 
        subject_id, 
        faculty_id, 
        day_of_week, 
        start_time, 
        end_time, 
        room 
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Timetable entry created', entry: data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getSubjects,
  createSubject,
  getTimetable,
  createTimetableEntry
};

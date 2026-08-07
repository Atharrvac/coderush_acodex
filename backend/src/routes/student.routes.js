/**
 * Student Routes
 * 
 * All routes require student authentication
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate, isStudent } = require('../middleware/auth.middleware');
const { validate, validations, body, param, query } = require('../middleware/validation.middleware');

// Apply authentication and student authorization to all routes
router.use(authenticate, isStudent);

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Timetable
router.get('/timetable', studentController.getTimetable);

// Attendance
router.get('/attendance', [
  query('subject_id').optional().isUUID(),
  query('from_date').optional().isISO8601(),
  query('to_date').optional().isISO8601(),
  validate
], studentController.getAttendance);

// Assignments
router.get('/assignments', [
  query('status').optional().isIn(['pending', 'submitted', 'graded']),
  query('subject_id').optional().isUUID(),
  validate
], studentController.getAssignments);

router.post('/assignments/:assignmentId/submit', [
  param('assignmentId').isUUID(),
  body('file_url').optional().isURL(),
  validations.optionalString('comments'),
  validate
], studentController.submitAssignment);

// Notes
router.get('/notes', [
  query('subject_id').optional().isUUID(),
  validate
], studentController.getNotes);

// Grades
router.get('/grades', studentController.getGrades);

module.exports = router;

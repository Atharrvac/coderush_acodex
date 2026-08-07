/**
 * Faculty Routes - Simplified
 */

const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const { authenticate, isFaculty } = require('../middleware/auth.middleware');
const { validate, validations, body, param } = require('../middleware/validation.middleware');

// Apply authentication to all routes
router.use(authenticate);
router.use(isFaculty);

// Dashboard
router.get('/dashboard', facultyController.getDashboard);

// Subjects (from faculty profile)
router.get('/subjects', facultyController.getAssignedSubjects);

// Students in department
router.get('/students', facultyController.getStudents);

// Assignments
router.get('/assignments', facultyController.getAssignments);

router.post('/assignments', [
  validations.requiredString('subject_name'),
  validations.requiredString('title'),
  body('due_date').isISO8601().withMessage('Valid due date required'),
  body('max_marks').optional().isInt({ min: 0 }),
  validate
], facultyController.createAssignment);

router.get('/assignments/:assignmentId/submissions', [
  param('assignmentId').isUUID(),
  validate
], facultyController.getSubmissions);

// Grading
router.put('/submissions/:submissionId/grade', [
  param('submissionId').isUUID(),
  body('marks').isFloat({ min: 0 }),
  validations.optionalString('feedback'),
  validate
], facultyController.gradeSubmission);

// Attendance
router.post('/attendance', [
  validations.requiredString('subject_name'),
  body('date').isISO8601(),
  body('records').isArray({ min: 1 }),
  body('records.*.student_id').isUUID(),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused']),
  validate
], facultyController.markAttendance);

module.exports = router;

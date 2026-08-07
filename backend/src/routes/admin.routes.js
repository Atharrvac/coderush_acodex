/**
 * Admin Routes
 * 
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, body } = require('../middleware/validation.middleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Pre-register students
router.post('/pre-register/students', [
  body('students').isArray({ min: 1 }).withMessage('Students array is required'),
  body('students.*.roll_no').notEmpty().withMessage('Roll number is required'),
  body('students.*.email').isEmail().withMessage('Valid email is required'),
  body('students.*.full_name').notEmpty().withMessage('Full name is required'),
  body('students.*.department').notEmpty().withMessage('Department is required'),
  validate
], adminController.preRegisterStudents);

router.get('/pre-register/students', adminController.getPreRegisteredStudents);
router.delete('/pre-register/students/:id', adminController.deletePreRegisteredStudent);

// Pre-register faculty
router.post('/pre-register/faculty', [
  body('faculty').isArray({ min: 1 }).withMessage('Faculty array is required'),
  body('faculty.*.email').isEmail().withMessage('Valid email is required'),
  body('faculty.*.full_name').notEmpty().withMessage('Full name is required'),
  body('faculty.*.department').notEmpty().withMessage('Department is required'),
  validate
], adminController.preRegisterFaculty);

router.get('/pre-register/faculty', adminController.getPreRegisteredFaculty);
router.delete('/pre-register/faculty/:id', adminController.deletePreRegisteredFaculty);

module.exports = router;

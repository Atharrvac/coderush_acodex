/**
 * Course & Subject Routes
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticate, isAdmin, isAdminOrFaculty } = require('../middleware/auth.middleware');
const { validate, validations, body, param } = require('../middleware/validation.middleware');

router.use(authenticate);

// Courses
router.get('/', courseController.getCourses);
router.get('/:id', [validations.uuid('id'), validate], courseController.getCourseById);

router.post('/', [
  isAdmin,
  validations.requiredString('name'),
  validations.requiredString('code'),
  validations.requiredString('department'),
  body('duration_years').isInt({ min: 1, max: 6 }),
  validate
], courseController.createCourse);

router.put('/:id', [
  isAdmin,
  validations.uuid('id'),
  validate
], courseController.updateCourse);

router.delete('/:id', [
  isAdmin,
  validations.uuid('id'),
  validate
], courseController.deleteCourse);

// Subjects
router.get('/:courseId/subjects', [
  param('courseId').isUUID(),
  validate
], courseController.getSubjects);

router.post('/:courseId/subjects', [
  isAdmin,
  param('courseId').isUUID(),
  validations.requiredString('name'),
  validations.requiredString('code'),
  body('credits').isInt({ min: 1, max: 10 }),
  body('semester').isInt({ min: 1, max: 12 }),
  validate
], courseController.createSubject);

// Timetable
router.get('/:courseId/timetable', [
  param('courseId').isUUID(),
  validate
], courseController.getTimetable);

router.post('/:courseId/timetable', [
  isAdmin,
  param('courseId').isUUID(),
  body('subject_id').isUUID(),
  body('faculty_id').isUUID(),
  body('day_of_week').isInt({ min: 0, max: 6 }),
  body('start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  validate
], courseController.createTimetableEntry);

module.exports = router;

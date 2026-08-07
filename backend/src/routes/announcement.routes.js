/**
 * Announcement Routes
 */

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { authenticate, isAdminOrFaculty } = require('../middleware/auth.middleware');
const { validate, validations, body, param, query } = require('../middleware/validation.middleware');

router.use(authenticate);

// Get announcements (all authenticated users)
router.get('/', [
  query('target_role').optional().isIn(['all', 'admin', 'faculty', 'student']),
  validations.page,
  validations.limit,
  validate
], announcementController.getAnnouncements);

// Create announcement (admin/faculty only)
router.post('/', [
  isAdminOrFaculty,
  validations.requiredString('title'),
  validations.requiredString('content'),
  body('target_role').isIn(['all', 'admin', 'faculty', 'student']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  validate
], announcementController.createAnnouncement);

// Update announcement
router.put('/:id', [
  isAdminOrFaculty,
  validations.uuid('id'),
  validate
], announcementController.updateAnnouncement);

// Delete announcement
router.delete('/:id', [
  isAdminOrFaculty,
  validations.uuid('id'),
  validate
], announcementController.deleteAnnouncement);

module.exports = router;

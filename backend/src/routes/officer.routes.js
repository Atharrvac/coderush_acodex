/**
 * Officer Dashboard Routes - GovTech CRM System
 */

const express = require('express');
const router = express.Router();
const officerDashboardController = require('../controllers/officer.dashboard.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Dashboard overview - All officer roles
router.get('/dashboard', 
  requireRole(['officer', 'department_head', 'admin']), 
  officerDashboardController.getDashboardOverview
);

// Get all users - Admin and Department Head only
router.get('/users', 
  requireRole(['department_head', 'admin']), 
  officerDashboardController.getAllUsers
);

// Get all complaints - All officer roles
router.get('/complaints', 
  requireRole(['officer', 'department_head', 'admin']), 
  officerDashboardController.getAllComplaints
);

// Analytics - All officer roles
router.get('/analytics', 
  requireRole(['officer', 'department_head', 'admin']), 
  officerDashboardController.getAnalytics
);

module.exports = router;
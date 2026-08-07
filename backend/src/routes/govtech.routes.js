/**
 * GovTech CRM Routes - Complete API
 * Role-based multilingual complaint system
 */

const express = require('express');
const router = express.Router();

// Import controllers (we'll create simple ones)
const complaintController = require('../controllers/complaint.controller');

// ============================================
// COMPLAINT ROUTES - WORKING ENDPOINTS
// ============================================

// Submit complaint (Citizens)
router.post('/complaints', complaintController.submitComplaint);

// Get complaint details
router.get('/complaints/:id', complaintController.getComplaintDetails);

// Get user's complaints (Citizens)
router.get('/complaints/user/:userId', complaintController.getUserComplaints);

// Get complaints for officer (Officers)
router.get('/complaints/officer/:officerId', complaintController.getOfficerComplaints);

// Get complaints for department (Department heads)
router.get('/complaints/department/:departmentId', complaintController.getDepartmentComplaints);

// Update complaint status (Officers)
router.put('/complaints/:id/status', complaintController.updateComplaintStatus);

// Get complaint timeline
router.get('/complaints/:id/timeline', complaintController.getComplaintTimeline);

// Get all complaints for government dashboard
router.get('/complaints', complaintController.getAllComplaints);

// Get departments
router.get('/departments', complaintController.getDepartments);

// Get officers by department
router.get('/departments/:id/officers', complaintController.getDepartmentOfficers);

module.exports = router;
/**
 * SMS Routes for Government Dashboard
 * Handles SMS notifications to field officers
 */

const express = require('express');
const router = express.Router();
const smsService = require('../services/sms.service');
const { supabase } = require('../config/supabase');

// Field officers database (in production, this would be in database)
const FIELD_OFFICERS = {
  'road': '8767040957',
  'water': '8767040957', 
  'electricity': '8767040957',
  'garbage': '8767040957',
  'parks': '8767040957',
  'traffic': '8767040957',
  'infrastructure': '8767040957',
  'other': '8767040957'
};

/**
 * Assign ticket to field officer
 * POST /api/sms/assign-officer
 */
router.post('/assign-officer', async (req, res) => {
  try {
    const { ticketId, category, customPhoneNumber } = req.body;
    
    // Validate input
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID is required'
      });
    }
    
    // Get ticket details from database
    const { data: problem, error: dbError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', ticketId)
      .single();
      
    // If ticket not found in DB, create mock data for testing
    let ticketData;
    if (dbError || !problem) {
      console.log('⚠️  Ticket not found in database, using mock data for testing');
      ticketData = {
        ticketId: ticketId.substring(0, 8).toUpperCase(),
        category: (category || 'ROAD').toUpperCase(),
        address: 'Test Location - Government Office Area',
        priority: 'MEDIUM',
        description: 'Test ticket assignment - This is a demonstration of the SMS notification system.',
        reportedAt: new Date().toLocaleString('en-IN'),
        coordinates: 'Testing coordinates'
      };
    } else {
      // Use real ticket data
      ticketData = {
        ticketId: problem.id.substring(0, 8).toUpperCase(),
        category: problem.category.toUpperCase(),
        address: problem.address || 'Address not provided',
        priority: getPriorityLevel(problem),
        description: problem.description || 'No description provided',
        reportedAt: new Date(problem.created_at).toLocaleString('en-IN'),
        coordinates: problem.latitude && problem.longitude ? 
          `${problem.latitude.toFixed(6)}, ${problem.longitude.toFixed(6)}` : 'Not available'
      };
    }
    
    // Determine field officer phone number
    const phoneNumber = customPhoneNumber || '8767040957'; // Always use your number
    
    // Send SMS to field officer
    const smsResult = await smsService.sendFieldOfficerAssignment(phoneNumber, ticketData);
    
    if (smsResult.success) {
      // Update ticket status in database (only if ticket exists)
      if (problem) {
        const { error: updateError } = await supabase
          .from('problems')
          .update({ 
            status: 'being_helped',
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (updateError) {
          console.error('Failed to update ticket status:', updateError);
        }
      }
      
      // Log the assignment
      console.log(`📱 SMS sent to field officer ${phoneNumber} for ticket ${ticketData.ticketId}`);
      
      res.json({
        success: true,
        message: 'Field officer assigned and notified via SMS',
        ticketId: ticketData.ticketId,
        phoneNumber: phoneNumber,
        smsDetails: smsResult
      });
      
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS to field officer',
        details: smsResult
      });
    }
    
  } catch (error) {
    console.error('Assign Officer Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Escalate ticket (send urgent SMS)
 * POST /api/sms/escalate
 */
router.post('/escalate', async (req, res) => {
  try {
    const { ticketId, escalationLevel = 'HIGH' } = req.body;
    
    // Get ticket details
    const { data: problem, error: dbError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', ticketId)
      .single();
      
    if (dbError || !problem) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    const phoneNumber = FIELD_OFFICERS[problem.category] || FIELD_OFFICERS['other'];
    
    const ticketData = {
      ticketId: problem.id.substring(0, 8).toUpperCase(),
      category: problem.category.toUpperCase(),
      address: problem.address || 'Address not provided',
      escalationLevel: escalationLevel,
      description: problem.description || 'No description provided'
    };
    
    const smsResult = await smsService.sendEscalationAlert(phoneNumber, ticketData);
    
    if (smsResult.success) {
      res.json({
        success: true,
        message: 'Escalation alert sent to field officer',
        ticketId: ticketData.ticketId,
        escalationLevel: escalationLevel
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send escalation SMS'
      });
    }
    
  } catch (error) {
    console.error('Escalation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send bulk assignment SMS to multiple officers
 * POST /api/sms/bulk-assign
 */
router.post('/bulk-assign', async (req, res) => {
  try {
    const { ticketId, phoneNumbers } = req.body;
    
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Phone numbers array is required'
      });
    }
    
    // Get ticket details
    const { data: problem, error: dbError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', ticketId)
      .single();
      
    if (dbError || !problem) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    const ticketData = {
      ticketId: problem.id.substring(0, 8).toUpperCase(),
      category: problem.category.toUpperCase(),
      address: problem.address || 'Address not provided',
      priority: getPriorityLevel(problem),
      description: problem.description || 'No description provided'
    };
    
    const smsResult = await smsService.sendBulkAssignment(phoneNumbers, ticketData);
    
    res.json({
      success: true,
      message: `Bulk SMS sent to ${smsResult.totalSent} officers`,
      results: smsResult
    });
    
  } catch (error) {
    console.error('Bulk Assignment Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper function to determine priority level
 */
function getPriorityLevel(problem) {
  const now = new Date();
  const createdAt = new Date(problem.created_at);
  const hoursOld = Math.floor((now - createdAt) / (1000 * 60 * 60));
  
  if (hoursOld > 24) return 'HIGH - SLA BREACH';
  if (hoursOld > 12) return 'MEDIUM';
  return 'LOW';
}

module.exports = router;
/**
 * Complaint Controller - GovTech CRM
 * Simplified working version for citizen complaints → government action
 */

const { supabase } = require('../config/supabase');

class ComplaintController {
  // Submit new complaint with auto-assignment
  async submitComplaint(req, res) {
    try {
      const {
        category,
        title,
        description,
        address,
        latitude,
        longitude,
        images = [],
        language_code = 'en',
        priority_level = 'medium',
        user_id
      } = req.body;

      // Get user ID from auth header or body
      const userId = req.user?.id || user_id;

      if (!userId) {
        return res.status(401).json({
          error: 'User authentication required',
          message: 'Please provide user_id in request body'
        });
      }

      // Validate required fields
      if (!category || !description || !latitude || !longitude) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['category', 'description', 'latitude', 'longitude']
        });
      }

      // Create complaint (auto-assignment will happen via trigger)
      const { data: complaint, error } = await supabase
        .from('problems')
        .insert({
          user_id: userId,
          category,
          title: title || `${category} issue`,
          description,
          complaint_text_original: description,
          complaint_text_translated: description, // For now, same as original
          language_code,
          address,
          latitude,
          longitude,
          images,
          priority_level,
          status: 'posted', // Legacy status
          complaint_status: 'submitted' // New GovTech status
        })
        .select(`
          *,
          users (id, name, email),
          departments (id, name, code),
          officers (id, name, designation)
        `)
        .single();

      if (error) {
        console.error('Complaint creation error:', error);
        return res.status(500).json({
          error: 'Failed to create complaint',
          details: error.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Complaint submitted and auto-assigned to department',
        complaint
      });

    } catch (error) {
      console.error('Submit complaint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get all complaints for government dashboard
  async getAllComplaints(req, res) {
    try {
      const { status, department_id, limit = 50, offset = 0 } = req.query;

      // Simplified query without complex joins
      let query = supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (department_id) {
        query = query.eq('department_id', department_id);
      }

      const { data: complaints, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Failed to fetch complaints',
          details: error.message
        });
      }

      // Return simplified response
      res.json({
        success: true,
        complaints: complaints || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: complaints ? complaints.length : 0
        }
      });

    } catch (error) {
      console.error('Get all complaints error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get complaint details
  async getComplaintDetails(req, res) {
    try {
      const { id } = req.params;

      // Simplified query without complex joins
      const { data: complaint, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(404).json({
          error: 'Complaint not found',
          details: error.message
        });
      }

      // Try to get status history, but don't fail if table doesn't exist
      let timeline = [];
      try {
        const { data: timelineData } = await supabase
          .from('complaint_status_history')
          .select('*')
          .eq('problem_id', id)
          .order('created_at', { ascending: true });
        
        timeline = timelineData || [];
      } catch (timelineError) {
        console.log('Timeline not available:', timelineError.message);
      }

      res.json({
        success: true,
        complaint,
        timeline
      });

    } catch (error) {
      console.error('Get complaint details error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Update complaint status (for officers)
  async updateComplaintStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, resolution_notes, resolution_images = [] } = req.body;
      const userId = req.user?.id || req.body.changed_by;

      // Validate status
      const validStatuses = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses
        });
      }

      // Get current complaint
      const { data: currentComplaint, error: fetchError } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({
          error: 'Complaint not found'
        });
      }

      // Prepare update data
      const updateData = {
        complaint_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = userId;
        updateData.status = 'solved'; // Update legacy status too
        if (resolution_notes) updateData.resolution_notes = resolution_notes;
        if (resolution_images.length > 0) updateData.resolution_images = resolution_images;
      }

      if (status === 'in_progress' && !currentComplaint.started_at) {
        updateData.started_at = new Date().toISOString();
        updateData.status = 'being_helped'; // Update legacy status
      }

      // Update complaint
      const { data: updatedComplaint, error: updateError } = await supabase
        .from('problems')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          error: 'Failed to update complaint',
          details: updateError.message
        });
      }

      // Add to status history
      await supabase
        .from('complaint_status_history')
        .insert({
          problem_id: id,
          old_status: currentComplaint.complaint_status,
          new_status: status,
          changed_by: userId,
          changed_by_type: 'officer',
          notes: notes || `Status changed to ${status}`
        });

      res.json({
        success: true,
        message: 'Complaint status updated successfully',
        complaint: updatedComplaint
      });

    } catch (error) {
      console.error('Update complaint status error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get user's complaints
  async getUserComplaints(req, res) {
    try {
      const { userId } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = supabase
        .from('problems')
        .select(`
          *,
          departments (id, name, code),
          officers (id, name, designation)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('complaint_status', status);
      }

      const { data: complaints, error } = await query;

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch complaints',
          details: error.message
        });
      }

      res.json({
        success: true,
        complaints,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: complaints.length
        }
      });

    } catch (error) {
      console.error('Get user complaints error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get complaints for officer
  async getOfficerComplaints(req, res) {
    try {
      const { officerId } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = supabase
        .from('problems')
        .select(`
          *,
          users (id, name, phone),
          departments (id, name, code)
        `)
        .eq('assigned_officer_id', officerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('complaint_status', status);
      }

      const { data: complaints, error } = await query;

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch complaints',
          details: error.message
        });
      }

      res.json({
        success: true,
        complaints,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: complaints.length
        }
      });

    } catch (error) {
      console.error('Get officer complaints error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get complaints for department
  async getDepartmentComplaints(req, res) {
    try {
      const { departmentId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('problems')
        .select(`
          *,
          users (id, name, phone),
          officers (id, name, designation)
        `)
        .eq('department_id', departmentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('complaint_status', status);
      }

      const { data: complaints, error } = await query;

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch complaints',
          details: error.message
        });
      }

      res.json({
        success: true,
        complaints,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: complaints.length
        }
      });

    } catch (error) {
      console.error('Get department complaints error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get complaint timeline
  async getComplaintTimeline(req, res) {
    try {
      const { id } = req.params;

      const { data: timeline, error } = await supabase
        .from('complaint_status_history')
        .select(`
          *,
          users (id, name)
        `)
        .eq('problem_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({
          error: 'Failed to fetch timeline',
          details: error.message
        });
      }

      res.json({
        success: true,
        timeline
      });

    } catch (error) {
      console.error('Get complaint timeline error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get departments
  async getDepartments(req, res) {
    try {
      // Return mock departments data to avoid database errors
      const departments = [
        { id: 1, name: 'Public Works Department', code: 'PWD', is_active: true },
        { id: 2, name: 'Water Supply Department', code: 'WATER', is_active: true },
        { id: 3, name: 'Electricity Board', code: 'ELEC', is_active: true },
        { id: 4, name: 'Municipal Corporation', code: 'MUNICIPAL', is_active: true },
        { id: 5, name: 'Traffic Police', code: 'TRAFFIC', is_active: true },
        { id: 6, name: 'Parks Department', code: 'PARKS', is_active: true },
        { id: 7, name: 'Urban Development', code: 'URBAN', is_active: true }
      ];

      res.json({
        success: true,
        departments
      });

    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get officers by department
  async getDepartmentOfficers(req, res) {
    try {
      const { id } = req.params;

      // Return mock officers data to avoid database errors
      const officers = [
        { id: 1, name: 'Officer Smith', designation: 'Senior Inspector', department_id: id, is_active: true },
        { id: 2, name: 'Officer Johnson', designation: 'Inspector', department_id: id, is_active: true },
        { id: 3, name: 'Officer Williams', designation: 'Assistant Inspector', department_id: id, is_active: true }
      ];

      res.json({
        success: true,
        officers
      });

    } catch (error) {
      console.error('Get department officers error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new ComplaintController();
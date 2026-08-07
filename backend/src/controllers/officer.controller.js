/**
 * Officer Controller - GovTech CRM
 * Manages government officers and their dashboard
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.getOfficerDashboard = async (req, res) => {
  try {
    const { officerId } = req.params;

    // Get officer details
    const { data: officer, error: officerError } = await supabase
      .from('officers')
      .select('*, department:departments(*)')
      .eq('id', officerId)
      .single();

    if (officerError) throw officerError;

    // Get assigned complaints
    const { data: complaints, error: complaintsError } = await supabase
      .from('problems')
      .select('*, user:users(*), department:departments(*)')
      .eq('assigned_officer_id', officerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (complaintsError) throw complaintsError;

    // Get performance stats
    const { data: stats, error: statsError } = await supabase
      .from('officer_performance')
      .select('*')
      .eq('id', officerId)
      .single();

    if (statsError) throw statsError;

    res.json({
      success: true,
      officer,
      complaints,
      stats
    });
  } catch (error) {
    console.error('Get officer dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, resolution_images } = req.body;
    const { officerId } = req.body;

    const updateData = {
      complaint_status: status,
      updated_at: new Date().toISOString()
    };

    if (notes) updateData.resolution_notes = notes;
    if (resolution_images) updateData.resolution_images = resolution_images;
    
    if (status === 'resolved') {
      updateData.resolved_by = officerId;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('problems')
      .update(updateData)
      .eq('id', id)
      .select('*, user:users(*), department:departments(*)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      complaint: data,
      message: 'Complaint status updated successfully'
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { officerId, priority = 'medium', notes } = req.body;

    // Update problem
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .update({
        assigned_officer_id: officerId,
        complaint_status: 'assigned',
        priority_level: priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (problemError) throw problemError;

    // Create assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('complaint_assignments')
      .insert({
        problem_id: id,
        officer_id: officerId,
        department_id: problem.department_id,
        priority,
        notes,
        status: 'assigned'
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    res.json({
      success: true,
      problem,
      assignment,
      message: 'Complaint assigned successfully'
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOfficersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('total_assigned', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      officers: data
    });
  } catch (error) {
    console.error('Get officers error:', error);
    res.status(500).json({ error: error.message });
  }
};

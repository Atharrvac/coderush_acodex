/**
 * Department Controller - GovTech CRM
 * Manages government departments
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.getAllDepartments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      departments: data
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      department: data
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('department_stats')
      .select('*')
      .order('total_complaints', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      stats: data
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentComplaints = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('problems')
      .select('*, user:users(*)')
      .eq('department_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('complaint_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      complaints: data
    });
  } catch (error) {
    console.error('Get department complaints error:', error);
    res.status(500).json({ error: error.message });
  }
};

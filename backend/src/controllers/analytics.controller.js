/**
 * Analytics Controller - GovTech CRM
 * Provides analytics and statistics
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.getOverallAnalytics = async (req, res) => {
  try {
    // Get complaints by category
    const { data: problems } = await supabase
      .from('problems')
      .select('category, complaint_status, language_code, created_at');

    // Process data
    const byCategory = {};
    const byStatus = {};
    const byLanguage = {};
    const byMonth = {};

    problems.forEach(p => {
      // By category
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
      
      // By status
      byStatus[p.complaint_status] = (byStatus[p.complaint_status] || 0) + 1;
      
      // By language
      byLanguage[p.language_code] = (byLanguage[p.language_code] || 0) + 1;
      
      // By month
      const month = new Date(p.created_at).toISOString().substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    // Get department stats
    const { data: deptStats } = await supabase
      .from('department_stats')
      .select('*');

    res.json({
      success: true,
      analytics: {
        total: problems.length,
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byLanguage: Object.entries(byLanguage).map(([name, value]) => ({ name, value })),
        byMonth: Object.entries(byMonth).map(([name, value]) => ({ name, value })),
        departments: deptStats
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const { data: stats } = await supabase
      .from('department_stats')
      .select('*')
      .eq('id', departmentId)
      .single();

    const { data: complaints } = await supabase
      .from('problems')
      .select('complaint_status, created_at, resolved_at')
      .eq('department_id', departmentId);

    // Calculate resolution times
    const resolutionTimes = complaints
      .filter(c => c.resolved_at)
      .map(c => {
        const created = new Date(c.created_at);
        const resolved = new Date(c.resolved_at);
        return (resolved - created) / (1000 * 60 * 60); // hours
      });

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    res.json({
      success: true,
      stats,
      avgResolutionTime: Math.round(avgResolutionTime),
      totalComplaints: complaints.length
    });
  } catch (error) {
    console.error('Get department analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOfficerAnalytics = async (req, res) => {
  try {
    const { officerId } = req.params;

    const { data: performance } = await supabase
      .from('officer_performance')
      .select('*')
      .eq('id', officerId)
      .single();

    const { data: complaints } = await supabase
      .from('problems')
      .select('complaint_status, created_at, resolved_at')
      .eq('assigned_officer_id', officerId);

    // Group by status
    const statusCounts = {};
    complaints.forEach(c => {
      statusCounts[c.complaint_status] = (statusCounts[c.complaint_status] || 0) + 1;
    });

    res.json({
      success: true,
      performance,
      statusBreakdown: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      totalAssigned: complaints.length
    });
  } catch (error) {
    console.error('Get officer analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

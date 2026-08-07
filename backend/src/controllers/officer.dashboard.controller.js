/**
 * Officer Dashboard Controller - GovTech CRM System
 * Handles officer dashboard data and analytics
 */

const { supabase } = require('../config/supabase');

class OfficerDashboardController {
  /**
   * Get Officer Dashboard Overview
   * GET /api/v1/officer/dashboard
   */
  async getDashboardOverview(req, res) {
    try {
      const { user } = req;
      
      // Get officer details with department
      const { data: officer, error: officerError } = await supabase
        .from('officers')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (officerError || !officer) {
        return res.status(404).json({
          error: 'Officer profile not found',
          code: 'OFFICER_NOT_FOUND'
        });
      }

      // Get complaint statistics
      const stats = await this.getComplaintStats(officer.department_id, user.role);
      
      // Get recent complaints
      const recentComplaints = await this.getRecentComplaints(officer.department_id, user.role);
      
      // Get performance metrics
      const performance = await this.getPerformanceMetrics(officer.id, user.role);

      res.json({
        officer: {
          ...officer,
          department: officer.department
        },
        statistics: stats,
        recentComplaints,
        performance
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({
        error: 'Failed to load dashboard',
        code: 'DASHBOARD_ERROR'
      });
    }
  }

  /**
   * Get All Users (Admin/Department Head only)
   * GET /api/v1/officer/users
   */
  async getAllUsers(req, res) {
    try {
      const { user } = req;
      const { page = 1, limit = 20, search = '', role = 'all' } = req.query;
      
      // Check permissions
      if (!['admin', 'department_head'].includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'ACCESS_DENIED'
        });
      }

      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('users')
        .select(`
          *,
          department:departments(name, code),
          _count_complaints:problems!problems_user_id_fkey(count)
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      if (role !== 'all') {
        query = query.eq('role', role);
      }

      // Department head can only see their department's data
      if (user.role === 'department_head') {
        query = query.eq('department_id', user.department_id);
      }

      const { data: users, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        users: users || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        code: 'FETCH_USERS_ERROR'
      });
    }
  }

  /**
   * Get All Complaints for Officer Dashboard
   * GET /api/v1/officer/complaints
   */
  async getAllComplaints(req, res) {
    try {
      const { user } = req;
      const { 
        page = 1, 
        limit = 20, 
        status = 'all', 
        priority = 'all',
        category = 'all',
        search = '',
        dateFrom,
        dateTo
      } = req.query;

      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('problems')
        .select(`
          *,
          user:users!problems_user_id_fkey(id, name, email, phone),
          assigned_officer:officers!problems_assigned_officer_id_fkey(id, name, email),
          department:departments!problems_department_id_fkey(name, code)
        `, { count: 'exact' });

      // Apply role-based filtering
      if (user.role === 'officer') {
        // Officers see only their assigned complaints
        query = query.eq('assigned_officer_id', user.officer_id);
      } else if (user.role === 'department_head') {
        // Department heads see all complaints in their department
        query = query.eq('department_id', user.department_id);
      }
      // Admins see all complaints (no additional filter)

      // Apply filters
      if (status !== 'all') {
        query = query.eq('complaint_status', status);
      }
      
      if (priority !== 'all') {
        query = query.eq('priority_level', priority);
      }
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
      }
      
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: complaints, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        complaints: complaints || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Get complaints error:', error);
      res.status(500).json({
        error: 'Failed to fetch complaints',
        code: 'FETCH_COMPLAINTS_ERROR'
      });
    }
  }

  /**
   * Get Analytics Data
   * GET /api/v1/officer/analytics
   */
  async getAnalytics(req, res) {
    try {
      const { user } = req;
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get complaint trends
      const trendData = await this.getComplaintTrends(startDate, endDate, user);
      
      // Get category distribution
      const categoryData = await this.getCategoryDistribution(startDate, endDate, user);
      
      // Get resolution metrics
      const resolutionData = await this.getResolutionMetrics(startDate, endDate, user);
      
      // Get department performance (for admin/department head)
      let departmentData = null;
      if (['admin', 'department_head'].includes(user.role)) {
        departmentData = await this.getDepartmentPerformance(startDate, endDate, user);
      }

      res.json({
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        trends: trendData,
        categories: categoryData,
        resolution: resolutionData,
        departments: departmentData
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        code: 'ANALYTICS_ERROR'
      });
    }
  }

  // Helper methods
  async getComplaintStats(departmentId, userRole) {
    try {
      let query = supabase.from('problems').select('complaint_status', { count: 'exact' });
      
      if (userRole === 'department_head') {
        query = query.eq('department_id', departmentId);
      }

      const { count: total } = await query;
      const { count: pending } = await query.eq('complaint_status', 'submitted');
      const { count: inProgress } = await query.eq('complaint_status', 'in_progress');
      const { count: resolved } = await query.eq('complaint_status', 'resolved');

      return {
        total: total || 0,
        pending: pending || 0,
        inProgress: inProgress || 0,
        resolved: resolved || 0
      };
    } catch (error) {
      console.error('Stats error:', error);
      return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    }
  }

  async getRecentComplaints(departmentId, userRole, limit = 5) {
    try {
      let query = supabase
        .from('problems')
        .select(`
          *,
          user:users!problems_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userRole === 'department_head') {
        query = query.eq('department_id', departmentId);
      }

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Recent complaints error:', error);
      return [];
    }
  }

  async getPerformanceMetrics(officerId, userRole) {
    try {
      if (userRole !== 'officer') {
        return null;
      }

      const { count: assigned } = await supabase
        .from('problems')
        .select('*', { count: 'exact' })
        .eq('assigned_officer_id', officerId);

      const { count: resolved } = await supabase
        .from('problems')
        .select('*', { count: 'exact' })
        .eq('assigned_officer_id', officerId)
        .eq('complaint_status', 'resolved');

      return {
        assigned: assigned || 0,
        resolved: resolved || 0,
        resolutionRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0
      };
    } catch (error) {
      console.error('Performance metrics error:', error);
      return null;
    }
  }

  async getComplaintTrends(startDate, endDate, user) {
    // Implementation for trend analysis
    return [];
  }

  async getCategoryDistribution(startDate, endDate, user) {
    // Implementation for category distribution
    return [];
  }

  async getResolutionMetrics(startDate, endDate, user) {
    // Implementation for resolution metrics
    return {};
  }

  async getDepartmentPerformance(startDate, endDate, user) {
    // Implementation for department performance
    return [];
  }
}

module.exports = new OfficerDashboardController();
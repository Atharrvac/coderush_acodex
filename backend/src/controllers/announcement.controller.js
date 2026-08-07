/**
 * Announcement Controller
 */

const { supabase } = require('../config/supabase');
const { PAGINATION } = require('../config/constants');

/**
 * Get announcements based on user role
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, target_role } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;

    let query = supabase
      .from('announcements')
      .select(`
        *,
        author:users(full_name, role)
      `, { count: 'exact' })
      .or(`target_role.eq.all,target_role.eq.${userRole}`)
      .eq('is_active', true);

    if (target_role) query = query.eq('target_role', target_role);

    const { data: announcements, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      announcements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create announcement
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, target_role, priority = 'normal', expires_at } = req.body;

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        target_role,
        priority,
        expires_at,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Announcement created', announcement: data });
  } catch (error) {
    next(error);
  }
};

/**
 * Update announcement
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, target_role, priority, is_active, expires_at } = req.body;

    const { data, error } = await supabase
      .from('announcements')
      .update({ title, content, target_role, priority, is_active, expires_at })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Announcement updated', announcement: data });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete announcement (soft delete)
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('announcements')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};

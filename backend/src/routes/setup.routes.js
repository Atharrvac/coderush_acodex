/**
 * Setup Routes
 * One-time setup endpoints for initial configuration
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * Create first admin account
 * POST /api/v1/setup/admin
 * This should only work if no admin exists
 */
router.post('/admin', async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Email, password, and full_name are required' 
      });
    }

    // Check if any admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin already exists. Use login instead.',
        code: 'ADMIN_EXISTS'
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role: 'admin' }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create admin profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: 'admin',
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Admin profile creation error:', userError);
      return res.status(400).json({ error: userError.message });
    }

    res.status(201).json({
      message: 'Admin created successfully! You can now login.',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Check if setup is needed
 * GET /api/v1/setup/status
 */
router.get('/status', async (req, res, next) => {
  try {
    const { data: admin } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    res.json({
      adminExists: !!admin,
      setupRequired: !admin
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

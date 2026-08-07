/**
 * Authentication Controller - NagrikSeva
 * Using Supabase Auth for email registration
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    console.log('Registration attempt:', { email, name });

    // Use Supabase Auth only for demo
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone }
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        error: authError.message || 'Registration failed',
        code: 'AUTH_ERROR'
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        error: 'Failed to create user',
        code: 'AUTH_ERROR'
      });
    }

    // Generate JWT token
    const token = generateToken(authData.user);

    // Add role based on email for demo
    const userWithRole = {
      id: authData.user.id,
      email: authData.user.email,
      name,
      phone,
      role: email.includes('officer') || email.includes('admin') || email.includes('head') ? 'officer' : 'citizen'
    };

    res.status(201).json({
      message: 'Registration successful',
      user: userWithRole,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'INTERNAL_ERROR'
    });
  }
};

const registerWithCustomAuth = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return res.status(400).json({
        error: userError.message || 'Failed to create user',
        code: 'CREATE_ERROR'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    console.error('Custom auth registration error:', error);
    next(error);
  }
};

/**
 * User login
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Try Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!authError && authData.user) {
      // Supabase Auth successful - get user profile
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      const token = generateToken(authData.user);

      // For demo purposes, treat specific emails as officers
      const userWithRole = user ? sanitizeUser(user) : { 
        id: authData.user.id, 
        email, 
        name: authData.user.user_metadata?.name,
        role: email.includes('officer') || email.includes('admin') || email.includes('head') ? 'officer' : 'citizen'
      };

      return res.json({
        message: 'Login successful',
        user: userWithRole,
        token
      });
    }

    // Fallback to custom auth
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add role based on email for demo
    const userWithRole = {
      ...sanitizeUser(user),
      role: user.role || (email.includes('officer') || email.includes('admin') || email.includes('head') ? 'officer' : 'citizen')
    };

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: userWithRole,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar_url } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ name, phone, avatar_url, updated_at: new Date() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    if (user?.password) {
      const isValid = await bcrypt.compare(current_password, user.password);
      if (!isValid) {
        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id);

    // Also update in Supabase Auth if possible
    await supabase.auth.updateUser({ password: new_password });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = generateToken(req.user);
    res.json({ token });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sanitizeUser = (user) => {
  const { password, ...sanitized } = user;
  return sanitized;
};

/**
 * Demo login for testing
 * POST /api/v1/auth/demo-login
 */
const demoLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Create a demo user for testing
    const demoUser = {
      id: 'demo-' + Date.now(),
      email: email || 'officer.demo@gov.in',
      name: 'Demo Officer',
      role: email && (email.includes('officer') || email.includes('admin') || email.includes('head')) ? 'officer' : 'citizen'
    };

    // Generate JWT token
    const token = generateToken(demoUser);

    res.json({
      message: 'Demo login successful',
      user: demoUser,
      token
    });
  } catch (error) {
    console.error('Demo login error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};

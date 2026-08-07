/**
 * Authentication Middleware - Role-based Access Control
 * GovTech CRM System
 */

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user details with role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        officers (
          id,
          department_id,
          designation,
          is_available
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(500).json({ 
        error: 'Failed to fetch user data',
        code: 'USER_FETCH_ERROR'
      });
    }

    // Attach user data to request
    req.user = {
      ...userData,
      token
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Require specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role || 'citizen';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

// Check if user owns resource
const requireOwnership = (resourceField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership based on resource field
    const resourceUserId = req.body[resourceField] || req.params.userId;
    
    if (resourceUserId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own resources.',
        code: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

// Check department access
const requireDepartmentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    const departmentId = req.params.departmentId || req.body.department_id;
    
    if (!departmentId) {
      return res.status(400).json({ 
        error: 'Department ID required',
        code: 'MISSING_DEPARTMENT_ID'
      });
    }

    // Check if user belongs to the department
    if (req.user.role === 'department_head' || req.user.role === 'officer') {
      if (req.user.department_id !== departmentId) {
        return res.status(403).json({ 
          error: 'Access denied. You can only access your department.',
          code: 'DEPARTMENT_ACCESS_DENIED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Department access middleware error:', error);
    return res.status(500).json({ 
      error: 'Department access check failed',
      code: 'DEPARTMENT_ACCESS_ERROR'
    });
  }
};

// Rate limiting middleware
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};

// Validate request data
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

// Log API requests
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - User: ${req.user?.id || 'Anonymous'} - Role: ${req.user?.role || 'None'}`);
  });
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  requireDepartmentAccess,
  rateLimit,
  validateRequest,
  logRequest
};
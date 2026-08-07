/**
 * NagrikSeva - Main Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const govtechRoutes = require('./routes/govtech.routes');
const aiRoutes = require('./routes/ai.routes');
const costAnalysisRoutes = require('./routes/cost-analysis.routes');
const officerRoutes = require('./routes/officer.routes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    app: 'NagrikSeva API'
  });
});

// API Routes
const apiBase = `/api/${API_VERSION}`;
app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/govtech`, govtechRoutes);
app.use(`${apiBase}/ai`, aiRoutes);
app.use(`${apiBase}/cost-analysis`, costAnalysisRoutes);
app.use(`${apiBase}/officer`, officerRoutes);

// Add simple endpoints for real data
app.get(`${apiBase}/users`, async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at, problems_posted, problems_solved')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json({ users: users || [] });
  } catch (error) {
    console.error('Get users error:', error);
    res.json({ users: [] });
  }
});

app.get(`${apiBase}/problems`, async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    const { data: problems, error } = await supabase
      .from('problems')
      .select(`
        *,
        user:users!problems_user_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json({ problems: problems || [] });
  } catch (error) {
    console.error('Get problems error:', error);
    res.json({ problems: [] });
  }
});

// TODO: Add these routes when ready
// app.use(`${apiBase}/complaints`, complaintRoutes);
// app.use(`${apiBase}/offices`, officeRoutes);
// app.use(`${apiBase}/alerts`, alertRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🏛️  NagrikSeva API running on port ${PORT}`);
  console.log(`📚 API Version: ${API_VERSION}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notifcationRoutes');
const authMiddleware = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================================
// CORS CONFIGURATION - FIXED VERSION
// ====================================

// Define allowed origins - Add ALL your frontend URLs here
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://blooddonationwebapp.vercel.app',  // Your frontend URL (correct spelling)
  'https://bloodonationwebapp.vercel.app',   // Typo version (if exists)
];

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Log incoming requests for debugging
    console.log('📡 Incoming request from origin:', origin || 'no-origin');
    
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) {
      console.log('✅ No origin header - allowing request');
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin is in allowed list:', origin);
      return callback(null, true);
    }
    
    // Allow all Vercel preview deployments (for testing)
    if (origin.endsWith('.vercel.app')) {
      console.log('✅ Vercel deployment detected - allowing:', origin);
      return callback(null, true);
    }
    
    // Block all other origins
    console.log('❌ CORS blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers middleware (backup layer)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// ====================================
// ROUTES
// ====================================

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ 
    message: 'This is protected data',
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
});

// Check authentication status
app.get('/api/auth/check', authMiddleware, (req, res) => {
  res.json({ 
    isAuthenticated: true,
    user: { 
      id: req.user._id,
      email: req.user.email,
      isVerified: req.user.isVerified
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Blood Donation API is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    activeStatus: true,
    error: false,
    message: 'Blood Donation API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      requests: '/api/requests',
      notifications: '/api/notifications'
    }
  });
});

// ====================================
// ERROR HANDLING
// ====================================

// CORS Error Handler
app.use((err, req, res, next) => {
  if (err.message.includes('CORS policy')) {
    console.error('🚫 CORS Error:', err.message);
    return res.status(403).json({ 
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed',
      origin: req.headers.origin || 'unknown'
    });
  }
  next(err);
});

// Validation Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    console.error('⚠️ Validation Error:', err.message);
    return res.status(400).json({ 
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  next(err);
});

// Cast Error Handler (Invalid MongoDB ID)
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    console.error('⚠️ Cast Error:', err.message);
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format',
      field: err.path
    });
  }
  next(err);
});

// Duplicate Key Error Handler
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    console.error('⚠️ Duplicate Key Error:', err.message);
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      success: false,
      message: `${field} already exists`,
      field: field
    });
  }
  next(err);
});

// JWT Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    console.error('⚠️ JWT Error:', err.message);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    console.error('⚠️ Token Expired:', err.message);
    return res.status(401).json({ 
      success: false,
      message: 'Token expired'
    });
  }
  next(err);
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.stack);
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// 404 Handler for undefined routes
app.use((req, res) => {
  console.log('⚠️ 404 Not Found:', req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      requests: '/api/requests',
      notifications: '/api/notifications'
    }
  });
});

// ====================================
// SERVER INITIALIZATION
// ====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🎉 ====================================');
  console.log(`🚀 Blood Donation Server is running`);
  console.log('🎉 ====================================\n');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
  console.log('📊 Available Endpoints:');
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Profile: http://localhost:${PORT}/api/profile`);
  console.log(`   - Requests: http://localhost:${PORT}/api/requests`);
  console.log(`   - Notifications: http://localhost:${PORT}/api/notifications\n`);
  console.log('🌐 Allowed Origins:');
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log('   - All *.vercel.app domains (for preview deployments)\n');
  console.log('🎉 ====================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;

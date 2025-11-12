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

const app = express();

// ====================================
// DATABASE CONNECTION
// ====================================
// Only connect if not already connected
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
    console.log('✅ New database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Don't throw error, let the app continue to show better error messages
  }
};

// Connect to database
connectToDatabase();

// ====================================
// MIDDLEWARE
// ====================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================================
// CORS CONFIGURATION
// ====================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://blooddonationwebapp.vercel.app',
  'https://bloodonationwebapp.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow all Vercel deployments (preview branches)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Block other origins
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// ====================================
// HEALTH CHECK (MUST BE FIRST)
// ====================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Blood Donation API is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Blood Donation API is healthy',
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'connected' : 'disconnected'
  });
});

// ====================================
// API ROUTES
// ====================================
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ 
    success: true,
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
    success: true,
    isAuthenticated: true,
    user: { 
      id: req.user._id,
      email: req.user.email,
      isVerified: req.user.isVerified
    }
  });
});

// ====================================
// ERROR HANDLING
// ====================================

// CORS Error Handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed'
    });
  }
  next(err);
});

// Validation Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  next(err);
});

// Cast Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format'
    });
  }
  next(err);
});

// Duplicate Key Error
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({ 
      success: false,
      message: `${field} already exists`
    });
  }
  next(err);
});

// JWT Errors
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false,
      message: 'Token expired'
    });
  }
  next(err);
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ====================================
// SERVER EXPORT FOR VERCEL
// ====================================

// For Vercel serverless functions
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
}

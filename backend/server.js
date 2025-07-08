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
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

// Example protected route
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
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate entry found'
    });
  }
  
  // Default error response
  res.status(500).json({ 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler for undefined routes - FIXED: Remove the '*' wildcard
app.use((req, res) => {
  res.status(404).json({ 
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Blood Donation Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Profile endpoints: http://localhost:${PORT}/api/profile`);
  console.log(`📋 Request endpoints: http://localhost:${PORT}/api/requests`);
  console.log(`🔔 Notification endpoints: http://localhost:${PORT}/api/notifications`);
});
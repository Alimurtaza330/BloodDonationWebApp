const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notifcationRoutes');
const authMiddleware = require('./middleware/authMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allowed origins
const allowedOrigins = [
  'https://blooddonationwebapp.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('CORS Blocked: ' + origin));
  },
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

// Protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    time: new Date().toISOString()
  });
});

// Root (avoid 404 on root)
app.get('/', (req, res) => {
  res.send({ message: 'Backend active', success: true });
});

// Export server for Vercel — important!
module.exports = app;

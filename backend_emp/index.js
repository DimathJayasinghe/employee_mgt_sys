const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { initDatabase } = require('./initDb');
const { initBirthdayCron } = require('./services/birthdayReminder');
const { initBackupCron } = require('./services/backupScheduler');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const zohoRoutes = require('./routes/zohoRoutes');
const profileRoutes = require('./routes/profileRoutes');
const projectRoutes = require('./routes/projectRoutes');

const securityHeaders = require('./middleware/securityHeaders');

const Logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Structured Request Logging (Outputs cleanly to Vercel Runtime Logs & Dev Console)
app.use(Logger.requestLogger);

// Basic health check routes
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'API is healthy and operational',
    environment: process.env.NODE_ENV || 'development',
    isVercel: Boolean(process.env.VERCEL),
    timestamp: new Date().toISOString()
  });
});

// Initialize Database connection & Background Crons
initDatabase();
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  initBirthdayCron();
  initBackupCron();
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', zohoRoutes);
app.use('/api', profileRoutes);
app.use('/api/projects', projectRoutes);

// API 404 Catch-all
app.use('/api', notFoundHandler);

// Centralized error handler for all API requests
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Basic health check routes
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Initialize Database connection & Background Crons
initDatabase();
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  initBirthdayCron();
  initBackupCron();
}

// API Routes
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', zohoRoutes);
app.use('/api', profileRoutes);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
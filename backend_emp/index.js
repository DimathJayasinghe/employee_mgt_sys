const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { initDatabase } = require('./initDb');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDist = path.resolve(__dirname, '../frontend_emp/dist');
const frontendIndex = path.join(frontendDist, 'index.html');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Initialize Database connection & tables
initDatabase();

// API Routes
app.use('/api', apiRoutes);

// Serve the built SPA from the same origin as the API in local and traditional Node deployments.
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (fs.existsSync(frontendIndex)) return res.sendFile(frontendIndex);
  return next();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
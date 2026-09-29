const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/backendService');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token, allow for backward compatibility or proceed
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('JWT verification failed:', err.message);
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // non-blocking for existing dev workflows, or can be strict
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken,
  requireAdmin
};

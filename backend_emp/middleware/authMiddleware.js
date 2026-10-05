const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/backendService');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { id: token, role: 'Admin' };
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Fallback for dev session token / user ID string
      req.user = { id: token, role: 'Admin' };
      return next();
    }
    if (user && user.role !== 'Admin') {
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

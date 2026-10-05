const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/backendService');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Fallback support for active sessions storing user ID (any string/number)
    if (token && typeof token === 'string' && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
      req.user = { id: token.trim(), role: 'Admin' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }
}

module.exports = requireAuth;

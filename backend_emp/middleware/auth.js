const jwt = require('jsonwebtoken');
const db = require('../db');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
}

function signUser(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    getJwtSecret(),
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.auth = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const { data: user, error } = await db.from('users').select('email, role').eq('id', req.auth?.sub).maybeSingle();
    if (error) throw error;
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    next();
  } catch {
    return res.status(403).json({ error: 'Administrator access required' });
  }
}

module.exports = { signUser, requireAuth, requireAdmin };
const jwt = require('jsonwebtoken');

const ADMIN_EMAILS = new Set([
  'hashan@pwholdings.lk',
  'nishani@pwholdings.lk',
  'channa@pwholdings.lk',
  'pasindu.buddhima@pwholdings.lk'
]);

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

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'Admin' || !ADMIN_EMAILS.has(String(req.auth.email).toLowerCase())) {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

module.exports = { ADMIN_EMAILS, signUser, requireAuth, requireAdmin };
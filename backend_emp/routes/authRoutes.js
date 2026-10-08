const express = require('express');
const router = express.Router();
const { authService } = require('../services/backendService');
const requireAuth = require('../middleware/requireAuth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues signed JWT session token.
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    console.error('Auth login error:', err.message);
    res.status(401).json({ error: err.message || 'Invalid email address or password' });
  }
});

/**
 * POST /api/auth/send-otp
 * Generates and emails a 6-digit OTP for registration or password reset.
 */
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, type } = req.body;
    const result = await authService.sendOtp(email, type);
    res.json(result);
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to send OTP' });
  }
});

/**
 * POST /api/auth/verify-otp-register
 * Verifies registration OTP, creates user account, hashes password, and issues session token.
 */
router.post('/verify-otp-register', authLimiter, async (req, res) => {
  try {
    const result = await authService.verifyOtpRegister(req.body);
    res.json(result);
  } catch (err) {
    console.error('Verify OTP Register error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to register account' });
  }
});

/**
 * POST /api/auth/verify-otp-reset-password
 * Verifies reset OTP and updates user's password with secure bcrypt hash.
 */
router.post('/verify-otp-reset-password', authLimiter, async (req, res) => {
  try {
    const result = await authService.verifyOtpResetPassword(req.body);
    res.json(result);
  } catch (err) {
    console.error('Verify OTP Reset error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
});

/**
 * GET /api/auth/validate-session
 * Validates JWT session token and returns current user profile.
 */
router.get('/validate-session', requireAuth, async (req, res) => {
  try {
    const result = await authService.validateSession(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: 'Session is invalid or expired' });
  }
});

/**
 * POST /api/auth/logout
 * Server-acknowledged logout handler for session cleanup.
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Session logged out successfully' });
});

module.exports = router;

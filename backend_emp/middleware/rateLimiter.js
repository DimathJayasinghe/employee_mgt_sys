/**
 * ============================================================================
 * Rate Limiter Middleware (Sliding Window Algorithm)
 * ============================================================================
 * Provides in-memory, zero-dependency sliding window rate limiting for
 * sensitive endpoints (e.g. login, OTP generation, password reset).
 */

const clientHits = new Map();

// Periodic cleanup of expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of clientHits.entries()) {
    if (now > record.resetTime) {
      clientHits.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiter middleware instance.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} options.max - Maximum allowed requests within the window (default: 30)
 * @param {string} options.message - Custom error message when limit exceeded
 */
function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'Too many requests from this IP. Please try again later.'
} = {}) {
  return function rateLimiter(req, res, next) {
    // Determine client identifier (Forwarded-For for proxy/Vercel or remote IP)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = clientHits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      clientHits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: message,
        retryAfter: retryAfterSec
      });
    }

    next();
  };
}

// Pre-configured rate limiters for specific auth operations
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // 20 login/register attempts per 15 mins
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const otpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 8, // 8 OTP requests per 10 mins
  message: 'Too many OTP requests generated. Please wait 10 minutes before requesting again.'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  otpLimiter
};

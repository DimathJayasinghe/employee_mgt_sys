/**
 * ============================================================================
 * Security Headers Middleware (Chain of Responsibility Pattern)
 * ============================================================================
 * Sets industry-standard HTTP security headers to protect against common web
 * vulnerabilities (MIME sniffing, clickjacking, XSS, and unencrypted transport).
 */

function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking by restricting framing to same origin
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable browser legacy XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy: Send full URL only for same-origin requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS in production via HTTP Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Restrict access to sensitive browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');

  next();
}

module.exports = securityHeaders;

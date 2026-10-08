/**
 * ============================================================================
 * Structured Vercel & Production Logger (Singleton Pattern)
 * ============================================================================
 * Generates formatted, high-visibility logs for Vercel Runtime Logs
 * and local developer environments. Automatically redacts sensitive fields
 * (passwords, tokens, OTPs, authorization headers).
 */

const crypto = require('crypto');

const SENSITIVE_FIELDS = new Set([
  'password',
  'newpassword',
  'confirmpassword',
  'token',
  'secret',
  'otp',
  'authorization',
  'code_hash',
  'refreshtoken',
  'apikey'
]);

/**
 * Recursively redacts sensitive keys from objects before logging
 */
function sanitize(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitize(item, depth + 1));

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const Logger = {
  /**
   * Info level structured log
   */
  info(message, meta = {}) {
    const payload = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...sanitize(meta)
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`ℹ️ [INFO] ${message}`, Object.keys(meta).length ? sanitize(meta) : '');
    }
  },

  /**
   * Warning level structured log
   */
  warn(message, meta = {}) {
    const payload = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...sanitize(meta)
    };
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(payload));
    } else {
      console.warn(`⚠️ [WARN] ${message}`, Object.keys(meta).length ? sanitize(meta) : '');
    }
  },

  /**
   * Error level structured log with stack trace
   */
  error(message, error = null, meta = {}) {
    const payload = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error ? {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack || undefined,
        code: error.code || error.statusCode || undefined
      } : undefined,
      ...sanitize(meta)
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(payload));
    } else {
      console.error(`❌ [ERROR] ${message}`, error?.message || '', Object.keys(meta).length ? sanitize(meta) : '');
      if (error?.stack) console.error(error.stack);
    }
  },

  /**
   * Express HTTP Request/Response logger middleware
   */
  requestLogger(req, res, next) {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID().slice(0, 8);
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const statusCode = res.statusCode;
      const isSlow = durationMs > 1500;
      const isError = statusCode >= 400;

      const logData = {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode,
        durationMs,
        ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
      };

      if (isError) {
        Logger.warn(`HTTP ${req.method} ${logData.path} -> ${statusCode} (${durationMs}ms)`, logData);
      } else if (isSlow) {
        Logger.warn(`[SLOW ROUTE] HTTP ${req.method} ${logData.path} -> ${statusCode} (${durationMs}ms)`, logData);
      } else {
        Logger.info(`HTTP ${req.method} ${logData.path} -> ${statusCode} (${durationMs}ms)`, logData);
      }
    });

    next();
  }
};

module.exports = Logger;

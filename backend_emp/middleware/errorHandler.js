/**
 * ============================================================================
 * Graceful Error Handling Middleware
 * ============================================================================
 * Catches all synchronous and asynchronous route errors, logs structured
 * context with Request IDs to Vercel logs, and responds with clean, sanitized JSON.
 */

const Logger = require('../utils/logger');

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.originalUrl || req.url} not found`,
    statusCode: 404,
    requestId: req.id || null
  });
}

/**
 * Central Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const requestId = req.id || req.headers?.['x-request-id'] || 'unknown';

  // Log full error stack and request context to Vercel / server console
  Logger.error(`Unhandled Exception on ${req.method} ${req.originalUrl || req.url}`, err, {
    requestId,
    statusCode,
    method: req.method,
    url: req.originalUrl || req.url,
    query: req.query,
    body: req.body
  });

  // Client-safe error message
  const userMessage = (statusCode < 500 || process.env.NODE_ENV !== 'production')
    ? (err.message || 'An unexpected error occurred')
    : 'Internal Server Error. Please contact support if the issue persists.';

  res.status(statusCode).json({
    success: false,
    error: userMessage,
    statusCode,
    requestId,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};

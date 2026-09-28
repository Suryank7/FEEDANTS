const { sendError } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');

/**
 * Central error handler.
 * Catches all errors thrown/passed via next(error) and returns
 * a consistent API response without exposing internals.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Log error details server-side
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    errorCode: err.errorCode || 'INTERNAL_ERROR',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Operational errors (thrown intentionally)
  if (err instanceof AppError) {
    return sendError(res, err.errorCode, err.message, err.statusCode);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 'VALIDATION_ERROR', messages.join('. '), 422);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return sendError(
      res,
      'DUPLICATE_ERROR',
      `Duplicate value for: ${field}`,
      409
    );
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return sendError(res, 'INVALID_ID', 'Invalid resource identifier', 400);
  }

  // Unknown / unhandled error — never expose internals
  return sendError(
    res,
    'INTERNAL_ERROR',
    'An unexpected error occurred. Please try again later.',
    500
  );
};

module.exports = errorHandler;

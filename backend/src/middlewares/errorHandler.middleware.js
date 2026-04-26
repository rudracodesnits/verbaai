const { AppError } = require('../utils/errors');
const { env } = require('../config/env');
const logger = require('../utils/logger');

/**
 * Centralized error handling middleware.
 * Catches all errors and returns a structured JSON response.
 *
 * Must be registered AFTER all routes.
 */
function errorHandler(err, _req, res, _next) {
  // Log the error
  if (err instanceof AppError) {
    logger.warn(`${err.code} [${err.statusCode}]: ${err.message}`);
  } else {
    logger.error('Unhandled error:', err);
  }

  // Operational errors (known, expected)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Prisma-specific errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this value already exists',
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Record not found',
      },
    });
  }

  // Unknown errors — hide details in production
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'Unknown error';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
